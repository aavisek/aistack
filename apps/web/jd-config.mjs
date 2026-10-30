import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

try { loadEnvFile(); }
catch (error) { if (error.code !== "ENOENT") throw error; }

export function jdConfig(env = process.env) {
  const databaseUrl = env.JD_DATABASE_URL;
  if (databaseUrl && !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
    throw new Error("JD_DATABASE_URL must be a PostgreSQL connection URL.");
  }
  return {
    databaseUrl,
    testDatabaseUrl: env.JD_TEST_DATABASE_URL,
    host: env.HOST || (databaseUrl ? "127.0.0.1" : "0.0.0.0"),
    screenshotDir: resolve(env.JD_SCREENSHOT_DIR || "Job Description"),
    ocrCommand: env.JD_OCR_COMMAND || "tesseract",
    azureOpenAiEndpoint: (env.AZURE_OPENAI_ENDPOINT || env.JD_GPT_ENDPOINT)?.replace(/\/+$/, ""),
    azureOpenAiApiKey: env.AZURE_OPENAI_API_KEY || env.JD_GPT_API_KEY,
    azureOpenAiDeployment: env.AZURE_OPENAI_DEPLOYMENT || env.JD_GPT_DEPLOYMENT,
    azureOpenAiApiVersion: env.AZURE_OPENAI_API_VERSION || env.JD_GPT_API_VERSION || "2024-10-21"
  };
}
