import { SOURCE_FOLDERS } from "@/lib/constants";
import type { HubFolder, MediaAsset } from "@/lib/types";
import { all, audit, get, put, remove } from "./db";
import { createMediaFromBuffer } from "./media";
import { appUrl, secret, setSecret } from "./secrets";

type DriveRole = "destination" | "source";
type DriveFile = { id: string; name: string; mimeType: string; size?: string; modifiedTime?: string; parents?: string[] };

const FOLDER_MIME = "application/vnd.google-apps.folder";
const SUPPORTED = /^(image\/(jpeg|png|webp|heic|heif)|video\/(mp4|quicktime|webm)|application\/pdf)$/;

function refreshSecret(role: DriveRole) { return role === "destination" ? "googleDestinationRefresh" : "googleSourceRefresh"; }
function callbackUrl() { return `${appUrl()}/api/hub/drive/callback`; }

export function destinationRootId() {
  return get<string>("settings", "destinationRootId") || process.env.GOOGLE_DRIVE_DESTINATION_ROOT_ID || "";
}

export function setDestinationRootId(id: string) {
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(id)) throw new Error("ID da pasta raiz inválido.");
  put("settings", "destinationRootId", id);
}

export function oauthUrl(role: DriveRole) {
  if (!secret("googleClientId") || !secret("googleClientSecret")) throw new Error("Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.");
  const state = crypto.randomUUID();
  put("oauth-state", state, { role, expires: Date.now() + 10 * 60_000 });
  const scope = role === "source" ? "https://www.googleapis.com/auth/drive.readonly" : "https://www.googleapis.com/auth/drive";
  const query = new URLSearchParams({
    client_id: secret("googleClientId"), redirect_uri: callbackUrl(), response_type: "code", scope,
    access_type: "offline", prompt: "consent", include_granted_scopes: "false", state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
}

export async function exchangeOAuth(code: string, state: string) {
  const saved = get<{ role: DriveRole; expires: number }>("oauth-state", state);
  remove("oauth-state", state);
  if (!saved || saved.expires < Date.now()) throw new Error("Autorização expirada ou inválida.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ code, client_id: secret("googleClientId"), client_secret: secret("googleClientSecret"), redirect_uri: callbackUrl(), grant_type: "authorization_code" }),
    signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json() as { refresh_token?: string; error_description?: string };
  if (!response.ok || !data.refresh_token) throw new Error(data.error_description || "O Google não retornou um token de atualização. Autorize novamente.");
  setSecret(refreshSecret(saved.role), data.refresh_token);
  audit("Sistema", `drive.connect.${saved.role}`, saved.role);
  return saved.role;
}

async function accessToken(role: DriveRole) {
  const refreshToken = secret(refreshSecret(role));
  if (!refreshToken) throw new Error(`Conecte o Drive de ${role === "source" ? "origem" : "destino"}.`);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: secret("googleClientId"), client_secret: secret("googleClientSecret"), refresh_token: refreshToken, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || "A conexão com o Google expirou.");
  return data.access_token;
}

async function driveJson<T>(role: DriveRole, url: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken(role);
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) }, signal: init.signal || AbortSignal.timeout(60_000) });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `Google Drive respondeu ${response.status}.`);
  return data;
}

async function listChildren(folderId: string) {
  const files: DriveFile[] = [];
  let pageToken = "";
  do {
    const query = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`, fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,parents)", pageSize: "1000",
      supportsAllDrives: "true", includeItemsFromAllDrives: "true", ...(pageToken ? { pageToken } : {}),
    });
    const data = await driveJson<{ files: DriveFile[]; nextPageToken?: string }>("source", `https://www.googleapis.com/drive/v3/files?${query}`);
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return files;
}

export async function inventorySource(sourceId: string, limit = 5000) {
  const source = SOURCE_FOLDERS.find((item) => item.id === sourceId);
  if (!source) throw new Error("Fonte não autorizada.");
  const queue = [{ id: source.folderId, path: source.name }];
  const files: Array<DriveFile & { path: string }> = [];
  put("source-object", source.folderId, true);
  while (queue.length && files.length < limit) {
    const current = queue.shift()!;
    for (const file of await listChildren(current.id)) {
      put("source-object", file.id, true);
      if (file.mimeType === FOLDER_MIME) queue.push({ id: file.id, path: `${current.path}/${file.name}` });
      else if (SUPPORTED.test(file.mimeType)) files.push({ ...file, path: current.path });
      if (files.length >= limit) break;
    }
  }
  put("source-inventory", sourceId, { at: new Date().toISOString(), count: files.length, bytes: files.reduce((sum, file) => sum + Number(file.size || 0), 0) });
  return files;
}

async function downloadSourceFile(id: string) {
  if (!get<boolean>("source-object", id)) throw new Error("O arquivo não pertence ao inventário de origem autorizado.");
  const token = await accessToken("source");
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(180_000) });
  if (!response.ok) throw new Error(`Não foi possível ler o arquivo de origem (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

function assertDestinationId(id: string) {
  if (get<boolean>("source-object", id) || SOURCE_FOLDERS.some((source) => source.folderId === id)) throw new Error("Operação bloqueada: o ID pertence a uma fonte somente leitura.");
}

export async function uploadDestination(buffer: Buffer, name: string, mimeType: string, parentId?: string) {
  const root = parentId || destinationRootId();
  if (!root) throw new Error("Configure a pasta raiz do Drive novo.");
  assertDestinationId(root);
  const token = await accessToken("destination");
  const boundary = `murano_${crypto.randomUUID()}`;
  const metadata = JSON.stringify({ name, parents: [root] });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,parents", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body, signal: AbortSignal.timeout(180_000),
  });
  const data = await response.json() as { id?: string; error?: { message?: string } };
  if (!response.ok || !data.id) throw new Error(data.error?.message || "Falha ao copiar para o Drive novo.");
  put("destination-object", data.id, true);
  return data.id;
}

export async function copySourceAsset(file: DriveFile & { path: string }, actor = "Importador") {
  if (!SUPPORTED.test(file.mimeType)) return null;
  const already = all<MediaAsset>("media").find((asset) => asset.sourceDriveId === file.id);
  if (already) return already;
  const buffer = await downloadSourceFile(file.id);
  const created = await createMediaFromBuffer(buffer, file.name, file.mimeType, actor, "drive-import", { sourceDriveId: file.id });
  if (!secret("googleDestinationRefresh") || !destinationRootId()) return created.media;
  const driveId = await uploadDestination(buffer, file.name, file.mimeType);
  const next = { ...created.media, driveId, updatedAt: new Date().toISOString() };
  put("media", next.id, next);
  audit(actor, "source.copy", file.id, driveId);
  return next;
}

export async function createDriveFolder(name: string, parentId: string) {
  assertDestinationId(parentId);
  const data = await driveJson<{ id: string }>("destination", "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  put("destination-object", data.id, true);
  return data.id;
}

export async function moveDestinationFile(fileId: string, targetFolderId: string) {
  if (!get<boolean>("destination-object", fileId)) throw new Error("Movimentação bloqueada: o arquivo não foi criado no Drive novo pela plataforma.");
  assertDestinationId(targetFolderId);
  const metadata = await driveJson<{ parents?: string[] }>("destination", `https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents&supportsAllDrives=true`);
  const query = new URLSearchParams({ addParents: targetFolderId, removeParents: (metadata.parents || []).join(","), supportsAllDrives: "true", fields: "id,parents" });
  await driveJson("destination", `https://www.googleapis.com/drive/v3/files/${fileId}?${query}`, { method: "PATCH" });
}

export async function trashDestinationFile(fileId: string) {
  if (!get<boolean>("destination-object", fileId)) throw new Error("Exclusão bloqueada: o arquivo não foi criado no Drive novo pela plataforma.");
  await driveJson("destination", `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trashed: true }),
  });
}

export async function provisionDestinationFolders() {
  let root = destinationRootId();
  if (!root) {
    root = await createDriveFolder("MURANO_MARKETING", "root");
    setDestinationRootId(root);
  }
  const folders = all<HubFolder>("folder").sort((a, b) => a.path.split("/").length - b.path.split("/").length);
  const mapping = new Map<string, string>([["root", root]]);
  for (const folder of folders) {
    if (folder.id === "root") { put("folder", folder.id, { ...folder, driveId: root }); continue; }
    const parentDriveId = mapping.get(folder.parentId || "root") || root;
    const driveId = folder.driveId || await createDriveFolder(folder.name, parentDriveId);
    mapping.set(folder.id, driveId);
    put("folder", folder.id, { ...folder, driveId });
  }
  audit("Sistema", "drive.provision", root);
  return root;
}

export function connectionStatus() {
  return {
    destination: Boolean(secret("googleDestinationRefresh")), source: Boolean(secret("googleSourceRefresh")),
    openrouter: Boolean(secret("openrouter")), destinationRootId: destinationRootId() || undefined,
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",
  };
}
