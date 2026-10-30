import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { readFile, readdir, realpath } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const execute = promisify(execFile);
export const roles = ["ai-architect", "ai-platform-architect", "other", "unclassified"];
export const categories = ["AI applications", "Models and ML", "Cloud platforms", "Data and retrieval", "Platform engineering", "Architecture and APIs", "Security and governance", "Languages", "Other"];
const groups = [
  ["AI applications", [
    ["RAG", "retrieval augmented generation", "retrieval-augmented generation"], ["LLMs", "LLM", "large language models"],
    ["LangChain", "Lang Chain"], ["LangGraph"], ["LlamaIndex", "Llama Index"], ["Semantic Kernel"], ["AutoGen"], ["CrewAI"],
    ["MCP", "model context protocol"], ["Agent-to-Agent", "A2A"], ["Agentic AI", "agentic systems", "AI agents", "multi-agent"],
    ["Prompt engineering", "prompt-engineering"], ["Embeddings", "embedding"], ["Semantic search"], ["Model evaluation", "evaluation suites", "evals"],
    ["Structured outputs"], ["Model routing", "model selection and routing"], ["Fine-tuning", "fine tuning", "fine-tuned"],
    ["Distillation"], ["Speech-to-Text", "speech to text"], ["Text-to-Speech", "text to speech"], ["Chatbots", "chatbot"]
  ]],
  ["Models and ML", [
    ["PyTorch"], ["TensorFlow"], ["Hugging Face", "HuggingFace"], ["Transformers"], ["Scikit-learn", "sklearn"],
    ["Deep learning"], ["Machine learning"], ["NLP", "natural language processing"], ["Computer vision"], ["ONNX"],
    ["vLLM"], ["Ollama"], ["OpenAI"], ["GPT"], ["Llama"], ["Claude"], ["Gemini"]
  ]],
  ["Cloud platforms", [
    ["Azure", "Microsoft Azure"], ["AWS", "Amazon Web Services"], ["GCP", "Google Cloud", "Google Cloud Platform"],
    ["Azure OpenAI", "Azure OpenAI Service"], ["Azure AI Foundry", "Microsoft Foundry", "Azure AI Studio"],
    ["Azure Machine Learning", "Azure ML", "ML Studio"], ["AKS", "Azure Kubernetes Service"],
    ["AWS Bedrock", "Amazon Bedrock", "Bedrock"], ["SageMaker", "Amazon SageMaker"], ["AWS Lambda", "Lambda"],
    ["Amazon S3", "S3"], ["Vertex AI"], ["BigQuery", "Big Query"], ["Cloud Storage"], ["Azure Speech"],
    ["AWS Transcribe", "Transcribe"], ["Amazon Polly", "Polly"], ["Azure AI Search"], ["Microsoft 365 Copilot"], ["Copilot Studio"]
  ]],
  ["Data and retrieval", [
    ["SQL"], ["PostgreSQL", "Postgres"], ["MySQL"], ["NoSQL"], ["MongoDB"], ["DynamoDB"], ["Redis"], ["Pinecone"],
    ["Weaviate"], ["Milvus"], ["Qdrant"], ["pgvector"], ["Vector databases", "vector database", "vector stores", "vector store"],
    ["Databricks"], ["Apache Spark", "Spark"], ["Snowflake"], ["Delta Lake"], ["Microsoft Fabric"], ["ETL"], ["Data pipelines"]
  ]],
  ["Platform engineering", [
    ["Docker"], ["Kubernetes", "K8s"], ["Terraform"], ["Bicep"], ["Helm"], ["CI/CD", "CI CD"],
    ["DevOps"], ["MLOps"], ["LLMOps"], ["GitOps"], ["GitHub Actions"], ["Azure DevOps"], ["Jenkins"],
    ["MLflow"], ["Kubeflow"], ["Observability"], ["OpenTelemetry"], ["Prometheus"], ["Grafana"],
    ["Tracing"], ["Monitoring"], ["Caching"], ["Batching"], ["Cost optimization", "cost optimisation"],
    ["Capacity planning"], ["Fallbacks", "fallback"], ["Model serving"], ["GPU"], ["Linux"]
  ]],
  ["Architecture and APIs", [
    ["Microservices"], ["Serverless"], ["Event-driven architecture", "event-driven"], ["Domain-driven design", "domain-driven"],
    ["REST"], ["GraphQL"], ["WebSocket", "WebSockets"], ["API Gateway"], ["Kafka"], ["RabbitMQ"],
    ["FastAPI"], ["Flask"], ["Django"], ["Node.js", "NodeJS"], ["NestJS"], ["Distributed systems"],
    ["Multi-cloud", "multi cloud"], ["System design"], ["High availability"], ["Disaster recovery"]
  ]],
  ["Security and governance", [
    ["IAM", "identity and access management"], ["RBAC", "role-based access control"], ["OAuth", "OAuth2"],
    ["Encryption"], ["Data privacy"], ["Responsible AI"], ["AI governance"], ["GDPR"], ["SOC 2", "SOC2"],
    ["Microsoft Purview", "Purview"], ["Microsoft Defender", "Defender"], ["Microsoft Sentinel", "Sentinel"],
    ["Guardrails"], ["Prompt injection"], ["Zero trust"]
  ]],
  ["Languages", [["Python"], ["TypeScript"], ["JavaScript"], ["Java"], ["C++"], ["C#"], ["Go", "Golang"], ["Rust"], ["Bash"]]]
];
export const catalogue = groups.flatMap(([category, entries]) => entries.map(([name, ...aliases]) => ({ name, category, aliases: [name, ...aliases] })));
export const normalizeName = (value) => value.toLowerCase().replace(/\s+/g, " ").trim();

export class JdError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function termPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, term === "Go" ? "u" : "iu");
}

export function findEvidence(text, aliases) {
  for (const alias of aliases) {
    const match = termPattern(alias).exec(text);
    if (match) {
      const start = Math.max(0, text.lastIndexOf("\n", match.index) + 1, match.index - 100);
      const endOfLine = text.indexOf("\n", match.index + match[0].length);
      return text.slice(start, Math.min(endOfLine < 0 ? text.length : endOfLine, match.index + match[0].length + 150)).trim();
    }
  }
  return null;
}

export function extractTechnologies(text, learned = []) {
  const entries = new Map(catalogue.map((item) => [normalizeName(item.name), item]));
  for (const item of learned) {
    const key = normalizeName(item.name);
    if (!entries.has(key)) entries.set(key, { ...item, aliases: [item.name, ...item.aliases] });
  }
  return [...entries.values()].flatMap((item) => {
    const evidence = findEvidence(text, item.aliases);
    return evidence ? [{ name: item.name, category: item.category, requirement: "unspecified", evidence }] : [];
  });
}

function field(value, name, maximum, optional = false) {
  if (typeof value !== "string" || (!optional && !value.trim()) || value.length > maximum) {
    throw new JdError(`${name} must be ${optional ? "a" : "a non-empty"} string of at most ${maximum} characters.`);
  }
  return value.trim();
}

export function validateDate(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    throw new JdError(`${name} must be a valid YYYY-MM-DD date.`);
  }
  return value;
}

export function validateJob(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new JdError("A job object is required.");
  const title = field(input.title, "Title", 300);
  const company = field(input.company, "Company", 300, true);
  const body = field(input.body, "JD text", 100000);
  if (!roles.includes(input.roleFamily)) throw new JdError("Select a valid role family.");
  if (typeof input.reviewed !== "boolean") throw new JdError("Reviewed must be true or false.");
  if (!Array.isArray(input.screenshotIds) || input.screenshotIds.length > 100 || !input.screenshotIds.every(isUuid) || new Set(input.screenshotIds).size !== input.screenshotIds.length) {
    throw new JdError("Screenshot IDs must be unique UUIDs (maximum 100).");
  }
  if (!Array.isArray(input.technologies) || input.technologies.length > 500) throw new JdError("Provide at most 500 technologies.");
  const technologies = input.technologies.map((item) => {
    if (!item || typeof item !== "object") throw new JdError("Invalid technology.");
    const requestedName = field(item.name, "Technology name", 120);
    const known = catalogue.find((entry) => entry.aliases.some((alias) => normalizeName(alias) === normalizeName(requestedName)));
    const name = known?.name ?? requestedName;
    const category = known?.category ?? item.category;
    if (!categories.includes(category)) throw new JdError(`Invalid category for ${name}.`);
    if (!["required", "preferred", "unspecified"].includes(item.requirement)) throw new JdError(`Invalid requirement for ${name}.`);
    const evidence = findEvidence(body, known?.aliases ?? [name]);
    if (!evidence) throw new JdError(`${name} has no matching evidence in the JD text. Correct the text or remove it.`);
    return { name, category, requirement: item.requirement, evidence, aliases: known?.aliases ?? [name] };
  });
  if (new Set(technologies.map((item) => normalizeName(item.name))).size !== technologies.length) throw new JdError("Remove duplicate technologies or aliases.");
  if (input.reviewed && (!technologies.length || input.roleFamily === "unclassified")) throw new JdError("A reviewed job needs a classified role and at least one technology.");
  return {
    title, company, body, technologies, roleFamily: input.roleFamily, reviewed: input.reviewed, screenshotIds: input.screenshotIds,
    postedOn: input.postedOn ? validateDate(input.postedOn, "Posting date") : null,
    collectedOn: validateDate(input.collectedOn, "Collection date")
  };
}

export function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function listScreenshots(directory) {
  const root = await realpath(directory);
  const result = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && /\.(jpe?g|png|webp)$/i.test(entry.name)) {
        const resolved = await realpath(path);
        if (!resolved.startsWith(`${root}${sep}`)) throw new JdError("Screenshot is outside the configured directory.");
        result.push({ path: resolved, sourcePath: relative(root, resolved) });
      }
    }
  }
  await walk(root);
  return result.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath, "en", { numeric: true }));
}

export async function recognizeScreenshot(path, command = "tesseract") {
  try {
    const { stdout } = await execute(command, [path, "stdout", "-l", "eng", "--psm", "6"], { timeout: 90000, maxBuffer: 2 * 1024 * 1024 });
    if (stdout.trim().length < 20) throw new JdError("OCR found too little text; provide a clearer screenshot.");
    return stdout.trim();
  } catch (error) {
    if (error instanceof JdError) throw error;
    throw new JdError(error.code === "ENOENT" ? "Tesseract is not installed. Install tesseract-ocr and its English language data." : "Local OCR failed or timed out; retry with a clearer image.", 503);
  }
}

export async function importScreenshots(store, config, progress, recognize = recognizeScreenshot) {
  const files = await listScreenshots(config.screenshotDir);
  progress.total = files.length;
  for (const file of files) {
    const hash = createHash("sha256").update(await readFile(file.path)).digest("hex");
    if (await store.hasScreenshot(hash)) {
      progress.skipped += 1;
    } else {
      let text = "";
      let failure = null;
      try {
        text = await recognize(file.path, config.ocrCommand);
      } catch (error) {
        failure = error instanceof Error ? error.message : "Screenshot extraction failed.";
        progress.errors.push({ sourcePath: file.sourcePath, message: failure });
      }
      await store.saveScreenshot(hash, file.sourcePath, text, failure);
      if (failure) progress.failed += 1;
      else progress.imported += 1;
    }
    progress.processed += 1;
  }
  return progress;
}

export function learningPlan(technologies) {
  const stages = [
    { quarter: 1, title: "Foundations and architecture", categories: ["Languages", "Architecture and APIs", "Security and governance"] },
    { quarter: 2, title: "Data, models and retrieval", categories: ["Data and retrieval", "Models and ML"] },
    { quarter: 3, title: "AI applications and agents", categories: ["AI applications"] },
    { quarter: 4, title: "Production platform capstone", categories: ["Cloud platforms", "Platform engineering", "Other"] }
  ];
  return stages.map((stage) => ({ ...stage, technologies: technologies.filter((item) => stage.categories.includes(item.category)) }));
}
