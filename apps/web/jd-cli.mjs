import { jdConfig } from "./jd-config.mjs";
import { JdStore } from "./jd-store.mjs";
import { importScreenshots } from "./jd.mjs";

const config = jdConfig();
if (!config.databaseUrl) {
  console.error("Set JD_DATABASE_URL before using JD commands. See README.");
  process.exitCode = 1;
} else {
  const store = new JdStore(config.databaseUrl);
  try {
    const command = process.argv[2];
    if (command === "migrate") {
      await store.migrate();
      console.log("JD database migration complete.");
    } else if (command === "import") {
      const progress = { total: 0, processed: 0, imported: 0, skipped: 0, failed: 0, errors: [] };
      await importScreenshots(store, config, progress);
      console.log(JSON.stringify(progress, null, 2));
      if (progress.failed) process.exitCode = 1;
    } else {
      throw new Error("Use migrate or import.");
    }
  } catch (error) {
    console.error("JD command failed:", error.message);
    process.exitCode = 1;
  } finally {
    await store.close();
  }
}
