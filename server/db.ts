import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DEFAULT_FOLDERS, REVIEW_FOLDER_ID } from "@/lib/constants";
import type { AuditEvent, HubFolder, Job, MediaAsset } from "@/lib/types";

export const dataDir = path.resolve(process.env.MEDIA_HUB_DATA_DIR || ".data");
export const uploadDir = path.join(dataDir, "uploads");
export const previewDir = path.join(dataDir, "previews");
mkdirSync(uploadDir, { recursive: true, mode: 0o700 });
mkdirSync(previewDir, { recursive: true, mode: 0o700 });

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
export const db = new DatabaseSync(isProductionBuild ? ":memory:" : path.join(dataDir, "media-hub.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS documents (kind TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(kind,id));
CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, kind TEXT NOT NULL, target_id TEXT NOT NULL, status TEXT NOT NULL, progress INTEGER NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS active_job ON jobs(kind,target_id) WHERE status IN ('queued','running');
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, detail TEXT);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_name TEXT NOT NULL, role TEXT NOT NULL, expires INTEGER NOT NULL);`);

export function get<T>(kind: string, id: string): T | undefined {
  const row = db.prepare("SELECT value FROM documents WHERE kind=? AND id=?").get(kind, id) as { value: string } | undefined;
  return row ? JSON.parse(row.value) as T : undefined;
}

export function all<T>(kind: string): T[] {
  return (db.prepare("SELECT value FROM documents WHERE kind=? ORDER BY rowid DESC").all(kind) as { value: string }[])
    .map((row) => JSON.parse(row.value) as T);
}

export function put<T>(kind: string, id: string, value: T): T {
  db.prepare("INSERT INTO documents(kind,id,value) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET value=excluded.value")
    .run(kind, id, JSON.stringify(value));
  return value;
}

export function remove(kind: string, id: string) {
  db.prepare("DELETE FROM documents WHERE kind=? AND id=?").run(kind, id);
}

export function atomic<T>(callback: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = callback();
    db.exec("COMMIT");
    return value;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function audit(actor: string, action: string, target: string, detail?: string) {
  db.prepare("INSERT INTO audit(at,actor,action,target,detail) VALUES(?,?,?,?,?)")
    .run(new Date().toISOString(), actor, action, target, detail || null);
}

export function auditEvents(limit = 80): AuditEvent[] {
  return db.prepare("SELECT id,at,actor,action,target,detail FROM audit ORDER BY id DESC LIMIT ?").all(limit) as unknown as AuditEvent[];
}

export function enqueue(kind: Job["kind"], targetId: string, payload: Job["payload"] = {}): Job {
  const current = db.prepare("SELECT value FROM jobs WHERE kind=? AND target_id=? AND status IN ('queued','running')")
    .get(kind, targetId) as { value: string } | undefined;
  if (current) return JSON.parse(current.value) as Job;
  const now = new Date().toISOString();
  const job: Job = { id: crypto.randomUUID(), kind, targetId, payload, status: "queued", progress: 0, createdAt: now, updatedAt: now };
  db.prepare("INSERT INTO jobs(id,kind,target_id,status,progress,value,updated_at) VALUES(?,?,?,?,?,?,?)")
    .run(job.id, kind, targetId, job.status, 0, JSON.stringify(job), now);
  return job;
}

export function jobs(limit = 100): Job[] {
  return (db.prepare("SELECT value FROM jobs ORDER BY updated_at DESC LIMIT ?").all(limit) as { value: string }[])
    .map((row) => JSON.parse(row.value) as Job);
}

export function updateJob(job: Job) {
  job.updatedAt = new Date().toISOString();
  db.prepare("UPDATE jobs SET status=?,progress=?,value=?,updated_at=? WHERE id=?")
    .run(job.status, job.progress, JSON.stringify(job), job.updatedAt, job.id);
}

export function claimJob(): Job | undefined {
  return atomic(() => {
    const row = db.prepare("SELECT value FROM jobs WHERE status='queued' ORDER BY updated_at LIMIT 1").get() as { value: string } | undefined;
    if (!row) return undefined;
    const job = JSON.parse(row.value) as Job;
    job.status = "running";
    job.message = "Iniciando";
    updateJob(job);
    return job;
  });
}

export function recoverJobs() {
  for (const job of jobs().filter((item) => item.status === "running" && Date.now() - Date.parse(item.updatedAt) > 15 * 60_000)) {
    job.status = "queued";
    job.message = "Retomando após interrupção";
    updateJob(job);
  }
}

function seedFolders() {
  if (all<HubFolder>("folder").length) return;
  const createdAt = new Date().toISOString();
  for (const folder of DEFAULT_FOLDERS) put<HubFolder>("folder", folder.id, { ...folder, createdAt });
}

const demoAssets: Omit<MediaAsset, "createdAt" | "updatedAt">[] = [
  { id: "demo-water", name: "mao-aneis-agua.jpg", kind: "image", mimeType: "image/svg+xml", size: 1840000, width: 1200, height: 1600, orientation: "vertical", folderId: "lifestyle", folderPath: "MURANO_MARKETING/02_EVERGREEN/LIFESTYLE", previewUrl: "/demo/water.svg", descriptionShort: "Mão com anéis dourados parcialmente submersa em água clara.", descriptionFull: "Close vertical de uma mão usando composição de anéis dourados dentro de água azul translúcida, com reflexos de luz e atmosfera de verão.", tags: ["mão", "água", "anéis", "dourado", "verão", "lifestyle", "close"], colors: ["azul", "dourado"], products: ["anéis"], contexts: ["água", "verão"], suggestedUse: ["social", "campanha de verão"], confidence: 0.96, status: "ready", source: "demo", uploadedBy: "Murano IA", aiModel: "demo", analyzedAt: new Date().toISOString() },
  { id: "demo-necklace", name: "colar-luz-natural.jpg", kind: "image", mimeType: "image/svg+xml", size: 2240000, width: 1600, height: 1200, orientation: "horizontal", folderId: "products", folderPath: "MURANO_MARKETING/02_EVERGREEN/PRODUTOS", previewUrl: "/demo/necklace.svg", descriptionShort: "Colar dourado sobre tecido claro com luz natural lateral.", descriptionFull: "Fotografia horizontal de produto com colar dourado disposto sobre tecido bege, sombras suaves e composição editorial minimalista.", tags: ["colar", "dourado", "produto", "tecido", "luz natural", "minimalista"], colors: ["bege", "dourado"], products: ["colar"], contexts: ["estúdio", "atemporal"], suggestedUse: ["e-commerce", "banner"], confidence: 0.94, status: "ready", source: "demo", uploadedBy: "Murano IA", aiModel: "demo", analyzedAt: new Date().toISOString() },
  { id: "demo-earring", name: "brinco-perfil.jpg", kind: "image", mimeType: "image/svg+xml", size: 1980000, width: 1200, height: 1500, orientation: "vertical", folderId: "lifestyle", folderPath: "MURANO_MARKETING/02_EVERGREEN/LIFESTYLE", previewUrl: "/demo/earring.svg", descriptionShort: "Perfil usando brinco dourado em fundo quente.", descriptionFull: "Retrato vertical em close lateral destacando a orelha e um brinco dourado, com pele iluminada e fundo terracota desfocado.", tags: ["brinco", "orelha", "perfil", "dourado", "retrato", "quente"], colors: ["terracota", "dourado"], products: ["brinco"], contexts: ["editorial"], suggestedUse: ["social", "lançamento"], confidence: 0.92, status: "ready", source: "demo", uploadedBy: "Murano IA", aiModel: "demo", analyzedAt: new Date().toISOString() },
  { id: "demo-box", name: "unboxing-murano.mp4", kind: "video", mimeType: "video/mp4", size: 12800000, width: 1080, height: 1920, duration: 18, orientation: "vertical", folderId: "ugc", folderPath: "MURANO_MARKETING/02_EVERGREEN/UGC", previewUrl: "/demo/unboxing.svg", descriptionShort: "Vídeo vertical de abertura de embalagem Murano.", descriptionFull: "Vídeo curto em estilo UGC mostrando mãos abrindo uma embalagem clara e revelando uma peça dourada.", tags: ["unboxing", "embalagem", "mãos", "UGC", "vertical", "presente"], colors: ["branco", "dourado"], products: ["embalagem"], contexts: ["presente", "casa"], suggestedUse: ["reels", "ads"], confidence: 0.88, status: "ready", source: "demo", uploadedBy: "Murano IA", aiModel: "demo", analyzedAt: new Date().toISOString() },
  { id: "demo-pool", name: "pulseira-piscina.jpg", kind: "image", mimeType: "image/svg+xml", size: 2130000, width: 1400, height: 1400, orientation: "square", folderId: REVIEW_FOLDER_ID, folderPath: "MURANO_MARKETING/90_A_CLASSIFICAR", previewUrl: "/demo/pool.svg", descriptionShort: "Pulso com pulseiras próximo à piscina.", descriptionFull: "Composição quadrada com pulso usando pulseiras douradas em primeiro plano e água de piscina desfocada ao fundo.", tags: ["pulso", "pulseira", "piscina", "verão", "dourado"], colors: ["azul", "dourado"], products: ["pulseira"], contexts: ["piscina", "verão"], suggestedUse: ["campanha de verão"], confidence: 0.63, status: "review", statusNote: "Confirmar se pertence à campanha de verão", source: "demo", uploadedBy: "Equipe de conteúdo", aiModel: "demo", analyzedAt: new Date().toISOString() },
  { id: "demo-stack", name: "composicao-aneis.jpg", kind: "image", mimeType: "image/svg+xml", size: 1760000, width: 1600, height: 1200, orientation: "horizontal", folderId: "products", folderPath: "MURANO_MARKETING/02_EVERGREEN/PRODUTOS", previewUrl: "/demo/stack.svg", descriptionShort: "Composição de anéis dourados sobre pedra clara.", descriptionFull: "Fotografia de produto com vários anéis dourados organizados sobre superfície de pedra clara, sombras definidas e alto espaço negativo.", tags: ["anéis", "composição", "pedra", "produto", "dourado", "fundo claro"], colors: ["off-white", "dourado"], products: ["anéis"], contexts: ["estúdio", "atemporal"], suggestedUse: ["e-commerce", "carrossel"], confidence: 0.97, status: "ready", source: "demo", uploadedBy: "Murano IA", aiModel: "demo", analyzedAt: new Date().toISOString() },
];

function seedDemo() {
  if (all<MediaAsset>("media").length) return;
  const now = Date.now();
  demoAssets.forEach((asset, index) => {
    const at = new Date(now - index * 3_600_000).toISOString();
    put<MediaAsset>("media", asset.id, { ...asset, createdAt: at, updatedAt: at });
  });
}

seedFolders();
if (process.env.MEDIA_HUB_SEED_DEMO !== "0") seedDemo();
