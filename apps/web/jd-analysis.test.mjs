import test from "node:test";
import assert from "node:assert/strict";
import { compareTrends, createAnalysis } from "./jd-analysis.mjs";
import { jobSourceUrl, jobSourceFingerprint } from "./jd-source.mjs";
import { extractSavedNaukriJob } from "./jd-html.mjs";
import { chromium } from "playwright";

test("analysis creation generates a dated name when omitted and retains explicit API names", async () => {
  const values = [];
  const store = { pool: { async query(sql, params) { values.push(params); } } };
  await createAnalysis(store);
  assert.match(values[0][1], /^JD analysis \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} UTC$/);
  await createAnalysis(store, "Original saved collection");
  assert.equal(values[1][1], "Original saved collection");
  assert.notEqual(values[0][0], values[1][0]);
});

test("batch trends compare independent denominators and include appearing and disappearing tools", () => {
  const rows = compareTrends([{name:"Python",jobCount:2,share:50},{name:"Qdrant",jobCount:1,share:25}],
    [{name:"Python",jobCount:2,share:100},{name:"Terraform",jobCount:1,share:50}]);
  assert.equal(rows.find(r=>r.name==="Python").change,-50);
  assert.equal(rows.find(r=>r.name==="Qdrant").change,25);
  assert.equal(rows.find(r=>r.name==="Terraform").change,-50);
  assert.deepEqual(compareTrends([],null),[]);
});

test("saved job sources support LinkedIn IDs and reject unrelated URLs", () => {
  assert.equal(jobSourceUrl("https://www.linkedin.com/jobs/view/platform-engineer-1234567890/?tracking=1"),"https://www.linkedin.com/jobs/view/1234567890");
  assert.equal(jobSourceFingerprint("https://linkedin.com/jobs/view/1234567890"),"linkedin:1234567890");
  assert.equal(jobSourceUrl("https://in.linkedin.com/jobs/view/ai-platform-architect-at-example-1234567890"), "https://www.linkedin.com/jobs/view/1234567890");
  assert.equal(jobSourceFingerprint("https://in.linkedin.com/jobs/view/1234567890"), "linkedin:1234567890");
  for (const url of ["https://in.linkedin.com.evil.example/jobs/view/123", "https://evil.linkedin.com/jobs/view/123",
    "https://user:password@in.linkedin.com/jobs/view/123", "http://in.linkedin.com/jobs/view/123"]) assert.throws(() => jobSourceUrl(url));
  for(const url of ["https://evil.example/jobs/view/123","https://www.linkedin.com/login","http://www.linkedin.com/jobs/view/123",
    "https://user:pass@www.linkedin.com/jobs/view/123","https://www.linkedin.com:8443/jobs/view/123"]) assert.throws(()=>jobSourceUrl(url));
});

test("LinkedIn saved HTML is read offline and rejects incomplete descriptions", {skip:process.env.JD_HTML_BROWSER_TEST!=="1"}, async()=>{
  const browser=await chromium.launch({chromiumSandbox:true});
  try {
    const context=await browser.newContext({offline:true,javaScriptEnabled:false});
    await context.route("**/*",r=>r.abort());
    const page=await context.newPage();
    const text="Python and Terraform are required. ".repeat(10);
    const html=`<link rel="canonical" href="https://www.linkedin.com/jobs/view/1234567890"><h1>Platform Engineer</h1><a class="topcard__org-name-link">Example</a><div class="show-more-less-html__markup">${text}</div><script>document.body.innerHTML='bad'</script>`;
    const result=await extractSavedNaukriJob(page,html);
    assert.equal(result.sourceUrl,"https://www.linkedin.com/jobs/view/1234567890");
    assert.ok(result.text.includes(text.trim()));
    const regional = await extractSavedNaukriJob(page, html.replace("www.linkedin.com", "in.linkedin.com"));
    assert.equal(regional.sourceUrl, result.sourceUrl);
    assert.equal(regional.text, result.text);
    await assert.rejects(extractSavedNaukriJob(page, `<!-- saved from url=(0050)https://www.linkedin.com/jobs/view/9999999999 -->${html}`), /conflicting job IDs/);
    await assert.rejects(extractSavedNaukriJob(page,html.replace(text,"Login")),/No complete/);
  }finally{await browser.close();}
});
