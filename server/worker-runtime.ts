import type { Job } from "@/lib/types";
import { analyzeMedia } from "./ai";
import { inventorySource, copySourceAsset, moveDestinationFile } from "./drive";
import { audit, get, updateJob } from "./db";
import type { HubFolder, MediaAsset } from "@/lib/types";

export async function runJob(job: Job) {
  try {
    if (job.kind === "analyze") {
      job.progress = 20; job.message = "Analisando material"; updateJob(job);
      const media = await analyzeMedia(job.targetId);
      const folder = get<HubFolder>("folder", media.folderId);
      if (media.driveId && folder?.driveId) await moveDestinationFile(media.driveId, folder.driveId);
      job.progress = 100; job.message = "Análise concluída";
    } else if (job.kind === "import-source") {
      job.progress = 2; job.message = "Criando inventário somente leitura"; updateJob(job);
      const files = await inventorySource(job.targetId);
      let completed = 0;
      for (const file of files) {
        job.message = `Copiando ${file.name}`;
        job.progress = Math.max(3, Math.round((completed / Math.max(files.length, 1)) * 100));
        updateJob(job);
        await copySourceAsset(file);
        completed++;
      }
      job.progress = 100; job.message = `${completed} arquivo(s) copiado(s)`;
      audit("Importador", "source.import.complete", job.targetId, `${completed}`);
    }
    job.status = "done";
  } catch (error) {
    job.status = "error";
    job.error = (error as Error).message;
    job.message = "Falha no processamento";
  }
  updateJob(job);
}
