import { claimJob, recoverJobs } from "./db";
import { runJob } from "./worker-runtime";

let running = true;
process.on("SIGINT", () => { running = false; });
process.on("SIGTERM", () => { running = false; });

async function main() {
  recoverJobs();
  while (running) {
    const job = claimJob();
    if (job) await runJob(job);
    else await new Promise((resolve) => setTimeout(resolve, 800));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
