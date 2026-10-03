import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { REVIEW_FOLDER_ID } from "@/lib/constants";
import type { HubFolder, MediaAsset, MediaKind } from "@/lib/types";
import { all, audit, enqueue, get, previewDir, put, uploadDir } from "./db";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "video/mp4", "video/quicktime", "video/webm", "application/pdf"]);
const MAX_BYTES = 200 * 1024 * 1024;

function extension(name: string) { return path.extname(name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin"; }
function kindFor(mime: string): MediaKind { return mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "document"; }
function orientation(width?: number, height?: number): MediaAsset["orientation"] {
  if (!width || !height) return "unknown";
  if (Math.abs(width - height) / Math.max(width, height) < 0.08) return "square";
  return width > height ? "horizontal" : "vertical";
}

export async function createMediaFromBuffer(buffer: Buffer, fileName: string, mimeType: string, actor: string, source: MediaAsset["source"] = "upload", metadata: Partial<MediaAsset> = {}, queueAnalysis = true) {
  if (!ALLOWED.has(mimeType)) throw new Error("Formato não suportado no MVP.");
  if (buffer.length > MAX_BYTES) throw new Error("O arquivo ultrapassa o limite de 200 MB do MVP.");
  const hash = createHash("sha256").update(buffer).digest("hex");
  const duplicate = all<MediaAsset>("media").find((item) => item.status !== "archived" && get<string>("hash", item.id) === hash);
  if (duplicate) return { media: duplicate, duplicate: true };
  const id = crypto.randomUUID();
  const ext = extension(fileName);
  const localPath = path.join(uploadDir, `${id}${ext}`);
  await writeFile(localPath, buffer, { mode: 0o600 });
  let width: number | undefined;
  let height: number | undefined;
  let previewUrl = kindFor(mimeType) === "video" ? "/demo/video-placeholder.svg" : "/demo/document.svg";
  if (mimeType.startsWith("image/")) {
    const info = await sharp(buffer, { failOn: "none" }).metadata();
    width = info.width;
    height = info.height;
    const previewPath = path.join(previewDir, `${id}.jpg`);
    await sharp(buffer, { failOn: "none" }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84 }).toFile(previewPath);
    previewUrl = `/api/file/${id}?preview=1`;
  }
  const folder = get<HubFolder>("folder", metadata.folderId || "inbox") || get<HubFolder>("folder", REVIEW_FOLDER_ID)!;
  const now = new Date().toISOString();
  const media: MediaAsset = {
    id, name: fileName, kind: kindFor(mimeType), mimeType, size: buffer.length, width, height,
    orientation: orientation(width, height), folderId: folder.id, folderPath: folder.path,
    localPath, previewUrl, descriptionShort: "Análise pendente", descriptionFull: "O material está aguardando análise.",
    tags: [], colors: [], products: [], contexts: [], suggestedUse: [], confidence: 0,
    status: "processing", source, createdAt: now, updatedAt: now, uploadedBy: actor, ...metadata,
  };
  put("hash", id, hash);
  put("media", id, media);
  if (queueAnalysis) enqueue("analyze", id);
  audit(actor, "media.upload", id, fileName);
  return { media, duplicate: false };
}

export async function attachVideoFrames(id: string, frames: Buffer[]) {
  const current = get<MediaAsset>("media", id);
  if (!current || current.kind !== "video") throw new Error("Vídeo não encontrado.");
  const framePaths: string[] = [];
  for (const [index, frame] of frames.slice(0, 4).entries()) {
    const output = path.join(previewDir, `${id}-frame-${index}.jpg`);
    await sharp(frame, { failOn: "none" }).rotate().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(output);
    framePaths.push(output);
  }
  const next = { ...current, framePaths, previewUrl: framePaths.length ? `/api/file/${id}?frame=0` : current.previewUrl, updatedAt: new Date().toISOString() };
  put("media", id, next);
  enqueue("analyze", id);
  return next;
}

export function updateMedia(id: string, patch: Partial<Pick<MediaAsset, "name" | "descriptionShort" | "descriptionFull" | "tags" | "folderId" | "status">>, actor: string) {
  const current = get<MediaAsset>("media", id);
  if (!current) throw new Error("Arquivo não encontrado.");
  let folderPath = current.folderPath;
  if (patch.folderId) {
    const folder = get<HubFolder>("folder", patch.folderId);
    if (!folder) throw new Error("Pasta de destino não encontrada.");
    folderPath = folder.path;
  }
  const next = { ...current, ...patch, folderPath, updatedAt: new Date().toISOString() };
  put("media", id, next);
  audit(actor, "media.update", id, JSON.stringify(Object.keys(patch)));
  return next;
}

export function createFolder(name: string, parentId: string, actor: string) {
  const clean = name.trim().replace(/[\\/:*?"<>|]/g, "-").slice(0, 80);
  if (!clean) throw new Error("Informe um nome de pasta.");
  const parent = get<HubFolder>("folder", parentId);
  if (!parent) throw new Error("Pasta-pai não encontrada.");
  const folder: HubFolder = { id: crypto.randomUUID(), name: clean, parentId, path: `${parent.path}/${clean.toUpperCase().replace(/\s+/g, "_")}`, createdAt: new Date().toISOString() };
  put("folder", folder.id, folder);
  audit(actor, "folder.create", folder.id, folder.path);
  return folder;
}
