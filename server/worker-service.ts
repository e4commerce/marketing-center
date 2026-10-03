import { claimJob, recoverJobs } from "./db";
import { runJob } from "./worker-runtime";

declare global {
  var muranoMediaWorkerStarted: boolean | undefined;
}

let running = true;

async function runLoop() {
  recoverJobs();

  while (running) {
    const job = claimJob();

    try {
      if (job) await runJob(job);
      else await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("[worker] Falha ao processar job", error);
    }
  }
}

export function startWorker() {
  if (globalThis.muranoMediaWorkerStarted) return;

  globalThis.muranoMediaWorkerStarted = true;
  running = true;

  const stop = () => { running = false; };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  void runLoop().catch((error) => {
    globalThis.muranoMediaWorkerStarted = false;
    console.error("[worker] Encerrado por erro inesperado", error);
  });
}
