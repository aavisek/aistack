import test from "node:test";
import assert from "node:assert/strict";
import { platformLearningRoadmap } from "./jd-roadmap.mjs";
import { masterTechnologies } from "./jd.mjs";

test("beginner roadmap contains 24 ordered months, exact workload and skip-safe priority levels", () => {
  const roadmap = platformLearningRoadmap({ totalJobs: 0, tools: [] });
  assert.equal(roadmap.weeklyHours, 16);
  assert.equal(roadmap.months.length, 24);
  assert.equal(roadmap.weeklySchedule.reduce((sum, item) => sum + item.hours, 0), 16);
  assert.equal(roadmap.plannedWeeks + roadmap.bufferWeeks, 104);
  assert.equal(roadmap.totalHours, 104 * 16);
  assert.equal(roadmap.months.reduce((sum, item) => sum + item.hours, 0), 96 * 16);
  assert.equal(roadmap.months.filter((month) => month.priority === "P0").length, 12);
  assert.equal(roadmap.months.filter((month) => month.priority === "P1").length, 7);
  assert.deepEqual(roadmap.months.filter((month) => month.priority === "P2").map((month) => month.month), [15, 19, 20, 21, 24]);
  const knownNames = new Set(masterTechnologies(roadmap.months.flatMap((month) => month.tools.map((tool) => ({
    name: tool.name, category: "Other", aliases: [], jobIds: []
  })))).map((item) => item.name));
  for (const [index, month] of roadmap.months.entries()) {
    assert.equal(month.month, index + 1);
    assert.equal(month.quarter, Math.floor(index / 3) + 1);
    assert.equal(month.hours, month.weeks * 16);
    assert.ok(month.project.length > 20);
    assert.ok(month.topics.length >= 2);
    assert.equal(month.checks.length, 3);
    for (const prerequisite of month.prerequisites) {
      assert.ok(prerequisite < month.month);
      assert.notEqual(roadmap.months[prerequisite - 1].priority, "P2");
    }
    for (const tool of month.tools) assert.ok(knownNames.has(tool.name), tool.name);
  }
  assert.ok(roadmap.readiness.some((checkpoint) => checkpoint.month === 18));
  assert.equal(roadmap.minimumToolkit.length, 20);
  assert.equal(roadmap.months[15].prerequisites[0], 14);
  assert.equal(roadmap.months[21].prerequisites[0], 18);
  assert.deepEqual(roadmap.buckets.map((bucket) => bucket.id), ["junior", "senior", "architect"]);
  assert.deepEqual(roadmap.buckets.map((bucket) => roadmap.months.filter((month) => month.bucket === bucket.id).length), [18, 3, 3]);
  for (const bucket of roadmap.buckets) {
    const assigned = roadmap.months.filter((month) => month.bucket === bucket.id);
    assert.equal(assigned[0].month, bucket.fromMonth);
    assert.equal(assigned.at(-1).month, bucket.toMonth);
    assert.ok(bucket.goal.length > 30);
    assert.ok(bucket.experience.length > 30);
  }
  assert.ok(roadmap.months.filter((month) => month.bucket === "senior").every((month) => month.priority === "P2"));
  assert.equal(roadmap.months[21].priority, "P1");
});

test("JD demand annotates the roadmap but cannot remove foundations or reorder prerequisites", () => {
  const roadmap = platformLearningRoadmap({ totalJobs: 7, tools: [
    { name: "Terraform", jobCount: 3, share: 42.9 },
    { name: "LangSmith", jobCount: 1, share: 14.3 },
    { name: "Pinecone", jobCount: 2, share: 28.6 }
  ] });
  assert.equal(roadmap.reviewedJobs, 7);
  assert.equal(roadmap.months[7].tools.find((tool) => tool.name === "Terraform").share, 42.9);
  assert.equal(roadmap.months[7].tools.find((tool) => tool.name === "Terraform").essential, true);
  assert.equal(roadmap.months[16].tools.find((tool) => tool.name === "LangSmith").essential, false);
  assert.equal(roadmap.months[0].tools[0].name, "Python");
  assert.equal(roadmap.months[0].tools[0].source, "Curriculum foundation");
  assert.deepEqual(roadmap.additionalTools, [{ name: "Pinecone", jobCount: 2, share: 28.6 }]);
});
