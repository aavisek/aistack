import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile, mkdir, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractTechnologies, validateJob, validateDate, findEvidence, listScreenshots, importScreenshots, recognizeScreenshot, learningPlan, technologyBreakdown, masterTechnologies, roleToolRecommendations, sourceToolMentions } from "./jd.mjs";
import { AzureJdProcessor } from "./jd-ai.mjs";

const sample = `Cloud: AWS (Bedrock, SageMaker, Lambda, API Gateway, S3), Azure (OpenAI Service, ML Studio, AKS), GCP (Vertex AI, Big Query, Cloud Storage).
AI Frameworks: TensorFlow, PyTorch, Hugging Face Transformers, Lang Chain.
Data: SQL (PostgreSQL, MySQL), NoSQL (MongoDB, DynamoDB), vector databases (Pinecone, Weaviate) for RAG & semantic search.
APIs: REST, GraphQL, WebSocket.
Security: IAM, RBAC, GDPR, SOC2.`;

test("recommendations recover exact source tools and composites without using corrected-only inventions", () => {
  const jobs = [{
    id: "one", title: "Platform",
    body: "Invented Terraform and Pinecone.\n\n--- Original Naukri source document ---\n\nUse Node.js/TypeScript, Phoenix, LangSmith, Manage Engine, Vertex AI Agent Engine, Claude Code and API Gateway."
  }, { id: "two", title: "Cloud", body: "Terraform, Step Functions, EventBridge and Kinesis." }];
  const mentions = sourceToolMentions(jobs);
  const tools = roleToolRecommendations({ totalJobs: 2, technologies: mentions });
  for (const name of ["Node.js", "TypeScript", "Arize Phoenix", "LangSmith", "ManageEngine", "Vertex AI Agent Engine", "Claude Code", "Amazon API Gateway",
    "Terraform", "AWS Step Functions", "Amazon EventBridge", "Amazon Kinesis"]) {
    const tool = tools.find((item) => item.name === name);
    assert.ok(tool, name);
    assert.equal(tool.jobCount, 1, name);
    assert.equal(tool.share, 50, name);
  }
  assert.equal(tools.some((item) => item.name === "Pinecone"), false);
  assert.ok(tools.find((item) => item.name === "Terraform").evidence.every((item) => item.jobId === "two"));
  assert.deepEqual(sourceToolMentions([{ id: "one", title: "Empty", body: "No tool requirements, only architecture." }]), []);
});

test("role tool recommendations rank exact names using unique evidence jobs and role-specific percentages", () => {
  const mention = (name, jobs, category = "Other") => ({
    name, category, evidence: jobs.map((jobId) => ({ jobId, title: jobId, evidence: name }))
  });
  const tools = roleToolRecommendations({ totalJobs: 3, technologies: [
    mention("Postgres", ["one"]), mention("PostgreSQL", ["one", "two"]),
    mention("Python", ["two"], "Languages"), mention("AKS", ["three"], "Cloud platforms"),
    mention("RAG", ["one", "two", "three"])
  ] });
  assert.deepEqual(tools.map((item) => item.name), ["PostgreSQL", "AKS", "Python"]);
  assert.deepEqual(tools.map((item) => item.rank), [1, 2, 3]);
  assert.equal(tools[0].jobCount, 2);
  assert.equal(tools[0].share, 66.7);
  assert.equal(tools[1].share, 33.3);
  assert.equal(tools[0].evidence.length, 2);
  assert.deepEqual(roleToolRecommendations({ totalJobs: 0, technologies: [] }), []);
});

test("master technologies merge catalogue aliases and count distinct saved JDs", () => {
  const entries = masterTechnologies([
    { name: "Postgres", category: "Other", aliases: [], jobIds: ["one"] },
    { name: "PostgreSQL", category: "Data and retrieval", aliases: [], jobIds: ["one", "two"] },
    { name: "Azure Foundry", category: "Other", aliases: [], jobIds: ["one"] },
    { name: "Airflow", category: "Other", aliases: [], jobIds: ["two"] },
    { name: "Custom Tool", category: "Other", aliases: ["custom alias"], jobIds: ["two"] },
    { name: "RAG", category: "AI applications", aliases: [], jobIds: ["one"] },
    { name: "Vector databases", category: "Data and retrieval", aliases: [], jobIds: ["one"] }
  ]);
  for (const name of ["AKS", "Azure AI Foundry", "PostgreSQL", "Qdrant", "pgvector", "LangSmith", "LangGraph", "TypeScript", "Python"]) {
    assert.ok(entries.some((item) => item.name === name), name);
  }
  assert.equal(entries.find((item) => item.name === "PostgreSQL").jobCount, 2);
  assert.equal(entries.some((item) => item.name === "Postgres"), false);
  assert.equal(entries.find((item) => item.name === "Azure AI Foundry").jobCount, 1);
  assert.equal(entries.find((item) => item.name === "Apache Airflow").builtIn, false);
  assert.equal(entries.find((item) => item.name === "Apache Airflow").jobCount, 1);
  for (const name of ["Custom Tool", "RAG", "Vector databases", "MLOps", "System design", "Prompt engineering", "IAM", "GPU", "OpenAI"]) {
    assert.equal(entries.some((item) => item.name === name), false, name);
  }
  assert.equal(entries.find((item) => item.name === "PostgreSQL").type, "Databases");
  assert.equal(entries.find((item) => item.name === "LangSmith").type, "Tools and frameworks");
  assert.deepEqual(entries.slice(0, 3).map((item) => item.name), ["PostgreSQL", "Apache Airflow", "Azure AI Foundry"]);
  for (let index = 1; index < entries.length; index += 1) {
    assert.ok(entries[index - 1].jobCount >= entries[index].jobCount);
    if (entries[index - 1].jobCount === entries[index].jobCount) {
      assert.ok(entries[index - 1].name.localeCompare(entries[index].name) <= 0);
    }
  }
});

test("technology breakdown groups names and concepts without changing counts or percentages", () => {
  const input = [
    { name: "Python", category: "Languages", jobCount: 2, share: 66.7 },
    { name: "Pinecone", category: "Other", jobCount: 1, share: 33.3 },
    { name: "Vector DB", category: "Data and retrieval", jobCount: 1, share: 33.3 },
    { name: "AWS", category: "Cloud platforms", jobCount: 3, share: 100 },
    { name: "BigQuery", category: "Cloud platforms", jobCount: 2, share: 66.7 },
    { name: "SQL", category: "Data and retrieval", jobCount: 1, share: 33.3 },
    { name: "Docker", category: "Languages", jobCount: 1, share: 33.3 },
    { name: "React", category: "Languages", jobCount: 1, share: 33.3 },
    { name: "RAG", category: "AI applications", jobCount: 1, share: 33.3 }
  ];
  const result = technologyBreakdown(input);
  assert.equal(result.length, input.length);
  assert.equal(result[0].name, "AWS");
  for (const original of input) {
    const entry = result.find((item) => item.name === original.name);
    assert.equal(entry.share, original.share);
    assert.equal(entry.jobCount, original.jobCount);
  }
  for (const name of ["Pinecone", "Vector DB", "BigQuery"]) assert.equal(result.find((item) => item.name === name).type, "Databases and database types");
  for (const name of ["SQL", "Python"]) assert.equal(result.find((item) => item.name === name).type, "Languages");
  for (const name of ["Docker", "React", "RAG"]) assert.equal(result.find((item) => item.name === name).type, "Tools, frameworks and capabilities");
  assert.deepEqual(technologyBreakdown([]), []);
});

function job(overrides = {}) {
  return { title: "AI Architect", company: "", body: "Python, PostgreSQL and RAG. Lang Chain is useful.", roleFamily: "ai-architect",
    reviewed: false, collectedOn: "2026-10-29", postedOn: "", screenshotIds: [],
    technologies: [{ name: "Python", category: "Languages", requirement: "required" }], ...overrides };
}

test("Azure requests support v1 base URLs and preserve the dated deployment API", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] }) };
  });
  const config = {
    azureOpenAiEndpoint: "https://example.openai.azure.com/openai/v1/",
    azureOpenAiDeployment: "my-deployment",
    azureOpenAiApiKey: "test-key",
    azureOpenAiApiVersion: "2024-10-21"
  };
  const messages = [{ role: "user", content: "Return JSON." }];
  assert.deepEqual(await new AzureJdProcessor(null, config).request(messages, 100), { ok: true });
  assert.equal(calls[0].url, "https://example.openai.azure.com/openai/v1/chat/completions");
  assert.equal(calls[0].body.model, "my-deployment");
  assert.equal(calls[0].body.max_completion_tokens, 100);
  assert.equal(calls[0].body.temperature, undefined);
  assert.equal(calls[0].body.max_tokens, undefined);
  await new AzureJdProcessor(null, { ...config, azureOpenAiEndpoint: "https://example.services.ai.azure.com/openai/v1" }).request(messages);
  assert.equal(calls[1].url, "https://example.services.ai.azure.com/openai/v1/chat/completions");
  await new AzureJdProcessor(null, { ...config, azureOpenAiEndpoint: "https://example.openai.azure.com" }).request(messages, 100);
  assert.equal(calls[2].url, "https://example.openai.azure.com/openai/deployments/my-deployment/chat/completions?api-version=2024-10-21");
  assert.equal(calls[2].body.max_tokens, 100);
  assert.equal(calls[2].body.temperature, 0);
});

test("AI extraction preserves original OCR and accepts evidence with corrected whitespace", async () => {
  const processor = new AzureJdProcessor(null, {});
  processor.request = async () => ({
    title: "AI Architect", roleFamily: "ai-architect", sourceText: "Build AI platforms.",
    requirements: [{ name: "Python", category: "Languages", requirement: "required", evidence: "Use Python and RAG", confidence: 0.9 }]
  });
  const result = await processor.analyzeDocument("Job", [{ id: "page", sourcePath: "Job/one.png", text: "Use Python\nand RAG" }]);
  assert.equal(result.requirements.length, 1);
  assert.equal(result.requirements[0].evidence, "Use Python\nand RAG");
  assert.ok(result.sourceText.includes("Use Python\nand RAG"));
  processor.request = async () => ({ sourceText: "Python", requirements: [] });
  await assert.rejects(processor.analyzeDocument("Job", [{ id: "page", text: "Python" }]), /no technologies/);
  processor.request = async () => ({ sourceText: "Python", requirements: [{ name: "Invented", evidence: "Not present anywhere" }] });
  await assert.rejects(processor.analyzeDocument("Job", [{ id: "page", text: "Python" }]), /evidence quote not found/);
});

test("AI reports truncated responses and oversized OCR rather than saving partial results", async (t) => {
  const config = { azureOpenAiEndpoint: "https://example.openai.azure.com/openai/v1", azureOpenAiDeployment: "test", azureOpenAiApiKey: "test" };
  t.mock.method(globalThis, "fetch", async () => ({
    ok: true, json: async () => ({ choices: [{ finish_reason: "length", message: { content: "{}" } }] })
  }));
  const processor = new AzureJdProcessor(null, config);
  await assert.rejects(processor.request([]), /token limit/);
  await assert.rejects(processor.analyzeDocument("Job", [{ id: "page", text: "x".repeat(100001) }]), /no text was truncated/);
});

test("AI repairs invalid evidence once instead of discarding technologies silently", async () => {
  const processor = new AzureJdProcessor(null, {});
  const calls = [];
  processor.request = async (messages) => {
    calls.push(messages);
    return {
      title: "AI Architect", sourceText: "Python is required.",
      requirements: [{ name: "Python", evidence: calls.length === 1 ? "An invented quote" : "Python is required." }]
    };
  };
  const result = await processor.analyzeDocument("Job", [{ id: "page", sourcePath: "Job/one.png", text: "Python is required." }]);
  assert.equal(calls.length, 2);
  assert.match(calls[1].at(-1).content, /Validation failed/);
  assert.equal(result.requirements[0].name, "Python");
});

test("extracts all named technologies from a representative sample and canonicalizes aliases", () => {
  const found = extractTechnologies(sample);
  for (const name of ["AWS", "AWS Bedrock", "SageMaker", "AWS Lambda", "API Gateway", "Amazon S3", "Azure", "OpenAI",
    "Azure Machine Learning", "AKS", "GCP", "Vertex AI", "BigQuery", "Cloud Storage", "TensorFlow", "PyTorch", "Hugging Face",
    "Transformers", "LangChain", "SQL", "PostgreSQL", "MySQL", "NoSQL", "MongoDB", "DynamoDB", "Vector databases",
    "Pinecone", "Weaviate", "RAG", "Semantic search", "REST", "GraphQL", "WebSocket", "IAM", "RBAC", "GDPR", "SOC 2"]) {
    assert.ok(found.some((item) => item.name === name), `Missing ${name}`);
  }
  assert.ok(found.every((item) => item.evidence && item.requirement === "unspecified"));
});

test("alias mentions and overlapping screenshot text do not duplicate technologies", () => {
  const found = extractTechnologies("Postgres PostgreSQL POSTGRES; Lang Chain LangChain Lang\nChain.");
  assert.equal(found.filter((item) => item.name === "PostgreSQL").length, 1);
  assert.equal(found.filter((item) => item.name === "LangChain").length, 1);
});

test("matches token boundaries and avoids ordinary go, JavaScript/Java and SQL/NoSQL false positives", () => {
  const names = extractTechnologies("go ahead with JavaScript and NoSQL; programmatic use of RESTful APIs").map((item) => item.name);
  assert.deepEqual(names, ["NoSQL", "JavaScript"]);
  assert.ok(extractTechnologies("Use Go and C++ with C#").some((item) => item.name === "Go"));
  assert.equal(findEvidence("PyTorch\nis important", ["TensorFlow"]), null);
});

test("validates unknown technologies with source evidence and normalizes known aliases", () => {
  const validated = validateJob(job({ body: "Use NewTechX and Lang Chain.", technologies: [
    { name: "NewTechX", category: "Other", requirement: "preferred" },
    { name: "Lang Chain", category: "Other", requirement: "unspecified" }
  ] }));
  assert.equal(validated.technologies[0].name, "NewTechX");
  assert.equal(validated.technologies[1].name, "LangChain");
  assert.equal(validated.technologies[1].category, "AI applications");
  assert.throws(() => validateJob(job({ technologies: [{ name: "Invented", category: "Other", requirement: "required" }] })), /no matching evidence/);
});

test("previously reviewed custom technologies are suggested in future JDs without duplicating catalogue entries", () => {
  const found = extractTechnologies("Use NewTechX and Python.", [
    { name: "NewTechX", category: "Other", aliases: ["newtechx"] },
    { name: "Python", category: "Languages", aliases: ["python"] }
  ]);
  assert.equal(found.filter((item) => item.name === "NewTechX").length, 1);
  assert.equal(found.filter((item) => item.name === "Python").length, 1);
});

test("rejects invalid metadata, duplicate aliases and unreviewable jobs", () => {
  for (const value of [
    { title: "" }, { body: "" }, { roleFamily: "unknown" }, { reviewed: "true" }, { collectedOn: "2026-02-30" },
    { screenshotIds: ["../../file"] }, { technologies: [null] }, { reviewed: true, technologies: [] },
    { reviewed: true, roleFamily: "unclassified" }, { technologies: [{ name: "Python", category: "Languages", requirement: "must" }] },
    { technologies: ["Postgres", "PostgreSQL"].map((name) => ({ name, category: "Data and retrieval", requirement: "required" })) }
  ]) assert.throws(() => validateJob(job(value)));
  assert.equal(validateJob(job()).postedOn, null);
  assert.equal(validateDate("2028-02-29", "Date"), "2028-02-29");
});

test("local importer recurses, ignores symlinks, skips duplicate bytes and retries OCR failures", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jd-import-"));
  try {
    await mkdir(join(dir, "nested"));
    await writeFile(join(dir, "one.jpeg"), "same-image");
    await writeFile(join(dir, "nested", "copy.png"), "same-image");
    await writeFile(join(dir, "bad.jpeg"), "bad-image");
    await writeFile(join(dir, "notes.txt"), "not an image");
    await symlink(join(dir, "one.jpeg"), join(dir, "linked.jpeg"));
    assert.equal((await listScreenshots(dir)).length, 3);
    const saved = new Map();
    const store = {
      hasScreenshot: async (hash) => saved.get(hash)?.failure === null,
      saveScreenshot: async (hash, path, text, failure) => saved.set(hash, { path, text, failure })
    };
    const state = () => ({ processed: 0, imported: 0, skipped: 0, failed: 0, errors: [] });
    const first = state();
    await importScreenshots(store, { screenshotDir: dir }, first, async (path) => {
      if (path.endsWith("bad.jpeg")) throw new Error("Unreadable image");
      return "Python and Kubernetes";
    });
    assert.equal(first.imported, 1);
    assert.equal(first.skipped, 1);
    assert.equal(first.failed, 1);
    assert.equal(first.processed, 3);
    assert.match(first.errors[0].message, /Unreadable/);
    const second = state();
    await importScreenshots(store, { screenshotDir: dir }, second, async () => "Python and Kubernetes");
    assert.equal(second.imported, 1);
    assert.equal(second.skipped, 2);
    assert.equal(second.failed, 0);
    assert.equal(saved.size, 2);
  } finally { await rm(dir, { recursive: true }); }
});

test("OCR dependency failures are explicit", async () => {
  await assert.rejects(recognizeScreenshot("/missing", `missing-tesseract-${randomUUID()}`), /Tesseract is not installed/);
});

test("learning sequence includes every observed technology exactly once in prerequisite stages", () => {
  const technologies = [{ name: "Python", category: "Languages" }, { name: "RAG", category: "AI applications" }, { name: "Unknown", category: "Other" }];
  const plan = learningPlan(technologies);
  assert.equal(plan.length, 4);
  assert.equal(plan[0].technologies[0].name, "Python");
  assert.equal(plan[2].technologies[0].name, "RAG");
  assert.equal(plan.flatMap((stage) => stage.technologies).length, technologies.length);
});

test("Azure AI processor requires explicit environment configuration and never exposes the key", async () => {
  const processor = new AzureJdProcessor({}, {});
  assert.equal(processor.enabled(), false);
  await assert.rejects(processor.request([]), /Configure AZURE_OPENAI_ENDPOINT/);
});
