const months = [
  {
    title: "Programming and terminal foundations", phase: "Programming foundations",
    tools: ["Python", "Git", "Bash"],
    topics: ["Variables, types, conditions, loops and functions", "Terminal navigation, files and Git commits"],
    project: "Build a command-line study tracker that stores tasks in a JSON file.",
    checks: ["Add, list and complete tasks without losing saved data.", "Handle invalid input and explain each function.", "Commit the project with setup instructions and no secrets."]
  },
  {
    title: "Reliable Python and Linux", phase: "Programming foundations",
    tools: ["Python", "Linux", "Git"],
    topics: ["Modules, virtual environments, exceptions and unit tests", "Processes, permissions, environment variables and logging"],
    project: "Turn the tracker into a tested Python package with structured logs.",
    checks: ["Run at least 15 tests covering success and invalid-input paths.", "Install and run the package in a fresh virtual environment.", "Diagnose a failed process using logs and exit codes."]
  },
  {
    title: "Networking and web fundamentals", phase: "Programming foundations",
    tools: ["Python", "Bash"],
    topics: ["IP addresses, DNS, TCP, TLS and HTTP", "JSON APIs, timeouts, retries and authentication basics"],
    project: "Build a small HTTP service and a client with bounded retries.",
    checks: ["Explain a request from DNS resolution to HTTP response.", "Demonstrate timeouts and failed requests without silent success.", "Write a diagram of client, server and trust boundaries."]
  },
  {
    title: "SQL and durable data", phase: "Backend and data",
    tools: ["PostgreSQL", "SQL", "Python"],
    topics: ["Tables, constraints, joins, transactions and indexes", "Parameterized queries, migrations and backups"],
    project: "Move the tracker into PostgreSQL with a migration and backup routine.",
    checks: ["Reject duplicate records with database constraints.", "Rollback a failed transaction without partial data.", "Restore a backup and explain a query plan."]
  },
  {
    title: "Production-shaped APIs", phase: "Backend and data",
    tools: ["FastAPI", "PostgreSQL", "Python"],
    topics: ["Request validation, API contracts and integration tests", "Authentication, authorization, pagination and rate limits"],
    project: "Expose the tracker as an authenticated REST API.",
    checks: ["Test unauthorized access, invalid input and pagination.", "Document API requests and consistent errors.", "Run the API and database tests from a clean checkout."]
  },
  {
    title: "Containers and continuous integration", phase: "Backend and data",
    tools: ["Docker", "GitHub Actions", "FastAPI"],
    topics: ["Images, containers, networks, volumes and health checks", "CI tests, reproducible builds and secret handling"],
    project: "Containerize the API and database and automate its tests.",
    checks: ["Start the stack with one documented command.", "Preserve data across container restarts.", "Block a broken build in CI and scan for exposed secrets."]
  },
  {
    title: "Azure fundamentals and identity", phase: "Cloud and infrastructure",
    tools: ["Azure", "Microsoft Entra ID", "Azure Key Vault"],
    topics: ["Subscriptions, resource groups, regions, networking and billing", "Least privilege, managed identities and secret rotation"],
    project: "Deploy a low-cost API environment with a budget alert and managed identity.",
    checks: ["Demonstrate permitted and denied identity operations.", "Read a secret without embedding credentials in code.", "Document estimated cost, teardown and least-privilege permissions."]
  },
  {
    title: "Infrastructure as code", phase: "Cloud and infrastructure",
    tools: ["Terraform", "Azure", "GitHub Actions"],
    topics: ["Providers, state, plans, modules and drift", "Remote state, environment separation and reviewed deployment"],
    project: "Recreate the Azure environment using Terraform.",
    checks: ["Apply twice without unexpected changes.", "Detect a manual change and explain the plan.", "Protect state, destroy lab resources and verify cleanup."]
  },
  {
    title: "Managed application delivery", phase: "Cloud and infrastructure",
    tools: ["Azure Web Apps", "Azure API Management", "Azure Application Insights"],
    topics: ["TLS, gateways, quotas, health probes and deployment rollback", "Metrics, logs, traces and service-level objectives"],
    project: "Deploy the API behind a gateway with a monitoring dashboard.",
    checks: ["Show one request across gateway and application telemetry.", "Enforce a quota and test a rollback.", "Define and measure availability and latency targets."]
  },
  {
    title: "Kubernetes fundamentals", phase: "Platform engineering",
    tools: ["Kubernetes", "Docker", "Helm"],
    topics: ["Pods, deployments, services, configuration and secrets", "Readiness, resource limits, scaling and rollouts"],
    project: "Run the API on a local Kubernetes cluster with a Helm chart.",
    checks: ["Recover after a pod is terminated.", "Demonstrate a rolling update and rollback.", "Explain resource requests, limits and health probes."]
  },
  {
    title: "AKS and platform security", phase: "Platform engineering",
    tools: ["AKS", "Terraform", "Microsoft Entra ID"],
    topics: ["Managed clusters, identity, network policies and workload isolation", "Cluster upgrades, autoscaling and secure delivery"],
    project: "Port the chart to a short-lived AKS lab provisioned with Terraform.",
    checks: ["Use workload identity instead of long-lived cloud keys.", "Test a network isolation rule and a denied permission.", "Document upgrade, scaling, cost and teardown procedures."]
  },
  {
    title: "Observable platform operations", phase: "Platform engineering",
    tools: ["OpenTelemetry", "Prometheus", "Grafana"],
    topics: ["Distributed traces, metrics and actionable alerts", "Incident response, capacity, backups and error budgets"],
    project: "Instrument the platform and run a controlled failure exercise.",
    checks: ["Trace a slow request and identify its bottleneck.", "Trigger an actionable alert and follow a runbook.", "Record recovery time and one reliability improvement."]
  },
  {
    title: "LLM fundamentals and model access", phase: "AI foundations and retrieval",
    tools: ["Azure OpenAI", "Azure AI Foundry", "Python"],
    topics: ["Tokens, context windows, inference, embeddings and model limitations", "Structured output, evaluation basics, quotas and cost controls"],
    project: "Build an LLM endpoint that extracts structured data from sample documents.",
    checks: ["Validate output schemas and reject malformed results.", "Measure latency and token cost on at least 30 test cases.", "Handle throttling and timeouts without inventing successful output."]
  },
  {
    title: "Retrieval and vector storage", phase: "AI foundations and retrieval",
    tools: ["PostgreSQL", "pgvector", "LlamaIndex"],
    topics: ["Chunking, embeddings, vector similarity and hybrid retrieval", "Document ingestion, access control and source citations"],
    project: "Build a permission-aware RAG service over a small document collection.",
    checks: ["Evaluate retrieval on at least 30 labeled questions.", "Return citations and abstain when evidence is absent.", "Verify that one user cannot retrieve another user's documents."]
  },
  {
    title: "Vector database trade-offs", phase: "AI foundations and retrieval",
    tools: ["Qdrant", "pgvector", "LangChain"],
    topics: ["Filtering, indexing, recall, latency and operational costs", "Repeatable evaluation and data lifecycle"],
    project: "Compare the same retrieval workload on pgvector and Qdrant.",
    checks: ["Compare recall and p95 latency on the same dataset.", "Test document updates and deletions.", "Write an architecture decision record selecting one database with evidence."]
  },
  {
    title: "Stateful agent workflows", phase: "Agent platforms",
    tools: ["LangGraph", "LangChain", "FastAPI"],
    topics: ["Tool calling, explicit workflow state and checkpoints", "Bounded execution, retries, human approval and prompt injection"],
    project: "Build a support workflow that retrieves evidence and proposes actions.",
    checks: ["Require human approval for a consequential action.", "Resume an interrupted run without repeating its side effect.", "Enforce step limits, permissions and malicious-input tests."]
  },
  {
    title: "Agent evaluation and observability", phase: "Agent platforms",
    tools: ["LangSmith", "Langfuse", "OpenTelemetry"],
    topics: ["Datasets, trace analysis and regression gates", "Quality, tool-use correctness, privacy and cost budgets"],
    project: "Add a regression suite and tracing to the agent service.",
    checks: ["Run at least 50 cases with a documented pass threshold.", "Fail CI when tool-use correctness regresses.", "Redact sensitive data and compare cost and latency across versions."]
  },
  {
    title: "Multi-tenant AI platform services", phase: "Agent platforms",
    tools: ["AKS", "Azure API Management", "Redis"],
    topics: ["Tenant isolation, quotas, caching and model routing", "MCP integration contracts, audit logs and safe tool access"],
    project: "Expose RAG and agent services through a tenant-aware platform API.",
    checks: ["Test cross-tenant access and per-tenant quotas.", "Verify cache keys cannot mix tenant data.", "Audit model and tool calls and demonstrate controlled fallback."]
  },
  {
    title: "AWS portability", phase: "Portability and governance",
    tools: ["AWS", "AWS Bedrock", "Terraform"],
    topics: ["Compare Azure and AWS identity, networking and model services", "Portable interfaces and provider-specific trade-offs"],
    project: "Port one AI service to a temporary AWS environment.",
    checks: ["Run the same contract tests against both providers.", "Compare cost, latency, identity and operational differences.", "Remove cloud resources and document why portability does or does not justify its cost."]
  },
  {
    title: "Event-driven AI workloads", phase: "Portability and governance",
    tools: ["Kafka", "AWS Lambda", "AWS Step Functions"],
    topics: ["Queues, idempotency, retries, dead letters and durable workflows", "Batch ingestion, event schemas and replay"],
    project: "Build asynchronous document ingestion with failure recovery.",
    checks: ["Replay a document event without duplicating records.", "Recover from a failed processing step.", "Measure backlog and processing time and demonstrate a dead-letter recovery path."]
  },
  {
    title: "Governance and disaster recovery", phase: "Portability and governance",
    tools: ["Azure Key Vault", "Microsoft Purview", "Terraform"],
    topics: ["Threat models, retention, auditability and data lineage", "Backup restoration, recovery objectives and cost governance"],
    project: "Perform a security and recovery review of the platform.",
    checks: ["Test secret rotation and document retention enforcement.", "Restore the platform and measure recovery time and data loss.", "Produce a threat model, risk register and prioritized remediation plan."]
  },
  {
    title: "Capstone: platform design and implementation", phase: "Architecture portfolio",
    tools: ["AKS", "Azure AI Foundry", "PostgreSQL"],
    topics: ["Requirements, architecture decisions and tenant boundaries", "Infrastructure, deployment pipelines and integration contracts"],
    project: "Build a reproducible internal AI platform combining ingestion, RAG, agents and telemetry.",
    checks: ["Provision the platform from a clean environment.", "Demonstrate two tenants with isolated data and quotas.", "Document at least five trade-off decisions with cost and reliability implications."]
  },
  {
    title: "Capstone: production readiness", phase: "Architecture portfolio",
    tools: ["LangSmith", "Grafana", "Terraform"],
    topics: ["Load testing, evaluation, incident drills and operations handover", "Service-level objectives, budgets and risk remediation"],
    project: "Harden the capstone and run a production-readiness review.",
    checks: ["Meet documented quality and p95 latency targets under a specified load.", "Demonstrate rollback, outage recovery and tenant-isolation tests.", "Publish dashboards, operating runbooks and measured monthly cost estimates."]
  },
  {
    title: "Architecture review and next-step portfolio", phase: "Architecture portfolio",
    tools: ["Git", "Azure", "AWS"],
    topics: ["System-design communication and stakeholder trade-offs", "Portfolio review, gaps and a focused next-year development plan"],
    project: "Present the platform to a peer reviewer and package a runnable portfolio.",
    checks: ["Deliver a 20-minute architecture walkthrough and answer failure/cost/security questions.", "Have another person run the platform from the documentation.", "Record feedback, remaining gaps and three prioritized next steps."]
  }
];

const coreTools = new Set([
  "Python", "Git", "Bash", "Linux", "SQL", "PostgreSQL", "FastAPI", "Docker",
  "GitHub Actions", "Azure", "Microsoft Entra ID", "Azure Key Vault", "Terraform",
  "Kubernetes", "AKS", "OpenTelemetry", "Grafana", "Azure OpenAI", "pgvector", "LangGraph"
]);
const optionalMonths = new Set([15, 19, 20, 21, 24]);

export function platformLearningRoadmap(recommendation) {
  const demand = new Map(recommendation.tools.map((item) => [item.name, item]));
  const planned = new Set(months.flatMap((month) => month.tools));
  return {
    role: "ai-platform-architect", title: "24-month AI Platform Architect learning roadmap",
    startingPoint: "Beginner in programming and cloud", weeklyHours: 16,
    plannedWeeks: 96, bufferWeeks: 8, totalHours: 1664, reviewedJobs: recommendation.totalJobs,
    buckets: [
      {
        id: "junior", title: "Junior role", fromMonth: 1, toMonth: 18,
        goal: "Build and operate a tested backend, one cloud platform and a safe AI application. Start junior-role applications when the month-18 checks are demonstrable.",
        experience: "Demonstrate independent implementation, debugging and documented delivery. Optional month 15 can be skipped."
      },
      {
        id: "senior", title: "Senior role", fromMonth: 19, toMonth: 21,
        goal: "Develop engineering depth in portability, durable workloads, governance and recovery. These are optional expansion modules, not requirements for initial junior applications.",
        experience: "Senior readiness additionally requires sustained production ownership, incident handling, mentoring and reliable delivery on a team; these months alone do not establish seniority."
      },
      {
        id: "architect", title: "Architect role", fromMonth: 22, toMonth: 24,
        goal: "Practice platform design, measurable trade-offs, production-readiness reviews and stakeholder communication through the capstone.",
        experience: "Architect readiness additionally requires real cross-team design responsibility and production experience. Core capstone months 22-23 also strengthen the junior portfolio; month 24 remains optional."
      }
    ],
    priorities: [
      { code: "P0", title: "Essential foundations", description: "Months 1-12: programming, backend, one cloud and platform operations. Do not skip these prerequisites." },
      { code: "P1", title: "Job-ready core and proof", description: "Months 13-14, 16-18 and 22-23: one working AI stack, safe agents, evaluation and a production-shaped portfolio. Learn one implementation rather than all alternatives." },
      { code: "P2", title: "Optional expansion", description: "Months 15, 19-21 and 24: alternative vector databases, AWS, event tooling, deeper governance and extended portfolio review. Defer until the core works or a target job requires them." }
    ],
    minimumToolkit: [...coreTools].map((name) => ({
      name, jobCount: demand.get(name)?.jobCount ?? 0, share: demand.get(name)?.share ?? 0
    })),
    readiness: [
      { month: 6, target: "Backend trainee/junior foundation", criteria: "Build and test an authenticated API with PostgreSQL, containerize it, and run CI independently." },
      { month: 12, target: "Junior platform/cloud foundation", criteria: "Deploy one Azure stack with Terraform and AKS, demonstrate least privilege, monitoring, rollback and recovery." },
      { month: 18, target: "Start applying for junior platform/AI engineering roles", criteria: "Demonstrate a permission-aware RAG service and bounded agent, automated quality tests, tenant isolation and measured cost/latency. Pass the P0/P1 checks completed so far; optional month 15 is not required." },
      { month: 23, target: "Stronger job-ready portfolio", criteria: "A peer can deploy the capstone, verify isolation and failure recovery, and reproduce documented quality, load and cost measurements. Be able to explain the trade-offs without following a tutorial." }
    ],
    weeklySchedule: [
      { activity: "Concepts and official documentation", hours: 4 },
      { activity: "Hands-on project work", hours: 8 },
      { activity: "Testing and troubleshooting", hours: 2 },
      { activity: "Review and architecture notes", hours: 2 }
    ],
    months: months.map((item, index) => ({
      ...item, month: index + 1, quarter: Math.floor(index / 3) + 1, weeks: 4, hours: 64,
      bucket: index < 18 ? "junior" : index < 21 ? "senior" : "architect",
      priority: optionalMonths.has(index + 1) ? "P2" : index < 12 ? "P0" : "P1",
      prerequisites: index ? [Array.from({ length: index }, (_, n) => n + 1).filter((month) => !optionalMonths.has(month)).at(-1)] : [],
      tools: item.tools.map((name) => ({
        name, jobCount: demand.get(name)?.jobCount ?? 0, share: demand.get(name)?.share ?? 0,
        essential: coreTools.has(name) && !optionalMonths.has(index + 1),
        source: demand.has(name) ? "Saved platform JDs" : "Curriculum foundation"
      }))
    })),
    additionalTools: recommendation.tools.filter((item) => !planned.has(item.name))
      .map(({ name, jobCount, share }) => ({ name, jobCount, share }))
  };
}
