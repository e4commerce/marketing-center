import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SOURCE_FOLDERS } from "@/lib/constants";
import type { BootstrapData, HubFolder, MediaAsset } from "@/lib/types";
import { authenticateUser, changePassword, clearSessionCookie, createAccessUser, createSession, currentUser, demoMode, destroySession, listUsers, sessionCookie, updateAccessUser } from "@/server/auth";
import { all, auditEvents, enqueue, get, jobs, put } from "@/server/db";
import { connectionStatus, createDriveFolder, destinationRootId, exchangeOAuth, moveDestinationFile, oauthUrl, provisionDestinationFolders, setDestinationRootId, trashDestinationFile, uploadDestination } from "@/server/drive";
import { attachVideoFrames, createFolder, createMediaFromBuffer, updateMedia } from "@/server/media";
import { searchMedia } from "@/server/search";
import { secret, setSecret } from "@/server/secrets";

export const runtime = "nodejs";
export const maxDuration = 300;

type Context = { params: Promise<{ path: string[] }> };
const loginAttempts = new Map<string, { failures: number; blockedUntil: number }>();

function loginKey(request: NextRequest, email: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return `${ip}:${email.trim().toLocaleLowerCase("pt-BR")}`;
}

function assertLoginAllowed(key: string) {
  const attempt = loginAttempts.get(key);
  if (!attempt) return;
  if (attempt.blockedUntil > Date.now()) throw new Error("Muitas tentativas. Aguarde 15 minutos e tente novamente.");
  if (attempt.blockedUntil) loginAttempts.delete(key);
}

function recordLogin(key: string, success: boolean) {
  if (success) { loginAttempts.delete(key); return; }
  const current = loginAttempts.get(key);
  const failures = (current?.failures || 0) + 1;
  loginAttempts.set(key, { failures, blockedUntil: failures >= 5 ? Date.now() + 15 * 60_000 : 0 });
}

function parts(context: Context) { return context.params.then((value) => value.path || []); }
function errorResponse(error: unknown, status = 400) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Seu usuário não tem permissão para esta ação." }, { status: 403 });
  return NextResponse.json({ error: error instanceof Error ? error.message : "Erro inesperado." }, { status });
}
function requireUser(request: NextRequest) {
  const user = currentUser(request);
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
function requireAdmin(user: ReturnType<typeof currentUser>) {
  if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
}
function requireEditor(user: ReturnType<typeof currentUser>) {
  if (!user || user.role === "viewer") throw new Error("FORBIDDEN");
}
function normalizedOrigin(value: string | null | undefined) {
  if (!value) return undefined;
  try { return new URL(value).origin; } catch { return undefined; }
}
function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new Error("Solicitação externa bloqueada.");
  if (!origin || fetchSite === "same-origin") return;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const host = request.headers.get("host")?.split(",")[0]?.trim();
  const allowedOrigins = new Set([
    normalizedOrigin(request.nextUrl.origin),
    normalizedOrigin(process.env.APP_URL),
    normalizedOrigin(forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined),
    normalizedOrigin(host ? `${request.nextUrl.protocol}//${host}` : undefined),
  ].filter((value): value is string => Boolean(value)));

  if (!allowedOrigins.has(normalizedOrigin(origin) || "")) throw new Error("Origem da solicitação não autorizada.");
}

const sessionSchema = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(300) }).strict();
const userCreateSchema = z.object({
  email: z.string().trim().email().max(200), name: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(300), role: z.enum(["admin", "manager", "viewer"]),
}).strict();
const userPatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(), role: z.enum(["admin", "manager", "viewer"]).optional(),
  active: z.boolean().optional(), password: z.string().min(8).max(300).optional(),
}).strict();
const passwordSchema = z.object({ currentPassword: z.string().min(1).max(300), newPassword: z.string().min(8).max(300) }).strict();
const folderSchema = z.object({ name: z.string().trim().min(1).max(80), parentId: z.string().min(1).max(100).optional() }).strict();
const settingsSchema = z.object({
  openrouterApiKey: z.string().max(500).optional(), googleClientId: z.string().max(500).optional(),
  googleClientSecret: z.string().max(500).optional(), destinationRootId: z.string().max(300).optional(),
}).strict();
const mediaPatchSchema = z.object({
  name: z.string().trim().min(1).max(240).optional(), descriptionShort: z.string().max(600).optional(),
  descriptionFull: z.string().max(6000).optional(), tags: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  folderId: z.string().max(100).optional(), status: z.enum(["uploading", "processing", "ready", "review", "error", "archived"]).optional(),
}).strict();

export async function GET(request: NextRequest, context: Context) {
  try {
    const route = await parts(context);
    if (route[0] === "drive" && route[1] === "callback") {
      const code = request.nextUrl.searchParams.get("code");
      const state = request.nextUrl.searchParams.get("state");
      if (!code || !state) throw new Error("O Google não retornou uma autorização válida.");
      const role = await exchangeOAuth(code, state);
      return NextResponse.redirect(new URL(`/?connected=${role}`, request.url));
    }
    const user = requireUser(request);
    if (route[0] === "bootstrap") {
      const data: BootstrapData = {
        media: all<MediaAsset>("media").filter((item) => item.status !== "archived"),
        folders: all<HubFolder>("folder").sort((a, b) => a.path.localeCompare(b.path)),
        jobs: jobs(), audit: auditEvents(), connections: connectionStatus(), sources: SOURCE_FOLDERS,
        user, users: user.role === "admin" ? listUsers() : [], demoMode: demoMode(),
      };
      return NextResponse.json(data);
    }
    if (route[0] === "search") {
      const query = request.nextUrl.searchParams.get("q") || "";
      return NextResponse.json({ media: searchMedia(all<MediaAsset>("media").filter((item) => item.status !== "archived"), query) });
    }
    if (route[0] === "drive" && route[1] === "connect") {
      requireAdmin(user);
      const role = request.nextUrl.searchParams.get("role") === "source" ? "source" : "destination";
      return NextResponse.redirect(oauthUrl(role));
    }
    return NextResponse.json({ error: "Rota não encontrada." }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const route = await parts(context);
    if (route[0] === "session") {
      assertSameOrigin(request);
      const body = sessionSchema.parse(await request.json());
      const key = loginKey(request, body.email);
      assertLoginAllowed(key);
      const account = authenticateUser(body.email, body.password);
      recordLogin(key, Boolean(account));
      if (!account) return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
      const session = createSession(account);
      return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(session.token, session.expires) } });
    }
    const user = requireUser(request);
    assertSameOrigin(request);
    if (route[0] === "account" && route[1] === "password") {
      const body = passwordSchema.parse(await request.json());
      changePassword(user.id, body.currentPassword, body.newPassword, user.email);
      return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
    }
    if (route[0] === "users") {
      requireAdmin(user);
      return NextResponse.json({ user: createAccessUser(userCreateSchema.parse(await request.json()), user.email) }, { status: 201 });
    }
    if (route[0] === "upload") {
      requireEditor(user);
      const form = await request.formData();
      const files = form.getAll("files").filter((entry): entry is File => entry instanceof File);
      const folderId = String(form.get("folderId") || "inbox");
      if (!files.length) throw new Error("Selecione pelo menos um arquivo.");
      if (files.length > 50) throw new Error("Envie no máximo 50 arquivos por lote.");
      const result = [];
      for (const [index, file] of files.entries()) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const frameFiles = form.getAll(`frames_${index}`).filter((entry): entry is File => entry instanceof File);
        const created = await createMediaFromBuffer(buffer, file.name, file.type || "application/octet-stream", user.name, "upload", { folderId }, file.type.startsWith("video/") ? frameFiles.length === 0 : true);
        if (!created.duplicate && frameFiles.length) {
          created.media = await attachVideoFrames(created.media.id, await Promise.all(frameFiles.map(async (frame) => Buffer.from(await frame.arrayBuffer()))));
        }
        if (!created.duplicate && connectionStatus().destination && destinationRootId()) {
          const folder = get<HubFolder>("folder", folderId);
          const driveId = await uploadDestination(buffer, file.name, file.type, folder?.driveId || destinationRootId());
          const next = { ...created.media, driveId, updatedAt: new Date().toISOString() };
          put("media", next.id, next);
          created.media = next;
        }
        result.push(created);
      }
      return NextResponse.json({ result }, { status: 201 });
    }
    if (route[0] === "folders") {
      requireEditor(user);
      const body = folderSchema.parse(await request.json());
      const folder = createFolder(body.name || "", body.parentId || "root", user.name);
      const parent = get<HubFolder>("folder", folder.parentId || "root");
      if (connectionStatus().destination && parent?.driveId) {
        folder.driveId = await createDriveFolder(folder.name, parent.driveId);
        put("folder", folder.id, folder);
      }
      return NextResponse.json({ folder }, { status: 201 });
    }
    if (route[0] === "media" && route[2] === "reanalyze") {
      requireEditor(user);
      const media = get<MediaAsset>("media", route[1]);
      if (!media) throw new Error("Arquivo não encontrado.");
      put("media", media.id, { ...media, status: "processing", statusNote: undefined, updatedAt: new Date().toISOString() });
      return NextResponse.json({ job: enqueue("analyze", media.id) }, { status: 202 });
    }
    if (route[0] === "imports" && route[1]) {
      requireAdmin(user);
      if (!SOURCE_FOLDERS.some((source) => source.id === route[1])) throw new Error("Fonte não autorizada.");
      if (!connectionStatus().source || !connectionStatus().destination) throw new Error("Conecte os Drives de origem e destino antes de importar.");
      return NextResponse.json({ job: enqueue("import-source", route[1]) }, { status: 202 });
    }
    if (route[0] === "drive" && route[1] === "provision") {
      requireAdmin(user);
      return NextResponse.json({ rootId: await provisionDestinationFolders() });
    }
    if (route[0] === "settings") {
      requireAdmin(user);
      const body = settingsSchema.parse(await request.json());
      if (body.openrouterApiKey?.trim()) setSecret("openrouter", body.openrouterApiKey.trim());
      if (body.googleClientId?.trim()) setSecret("googleClientId", body.googleClientId.trim());
      if (body.googleClientSecret?.trim()) setSecret("googleClientSecret", body.googleClientSecret.trim());
      if (body.destinationRootId?.trim()) setDestinationRootId(body.destinationRootId.trim());
      return NextResponse.json({ connections: connectionStatus(), configured: { googleClientId: Boolean(secret("googleClientId")), googleClientSecret: Boolean(secret("googleClientSecret")) } });
    }
    return NextResponse.json({ error: "Rota não encontrada." }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const route = await parts(context);
    const user = requireUser(request);
    assertSameOrigin(request);
    if (route[0] === "users" && route[1]) {
      requireAdmin(user);
      const body = userPatchSchema.parse(await request.json());
      if (route[1] === user.id && body.active === false) throw new Error("Você não pode desativar o próprio usuário.");
      if (route[1] === user.id && body.role && body.role !== user.role) throw new Error("Você não pode alterar o próprio nível de acesso.");
      return NextResponse.json({ user: updateAccessUser(route[1], body, user.email) });
    }
    if (route[0] !== "media" || !route[1]) return NextResponse.json({ error: "Rota não encontrada." }, { status: 404 });
    requireEditor(user);
    const body = mediaPatchSchema.parse(await request.json());
    const before = get<MediaAsset>("media", route[1]);
    const media = updateMedia(route[1], body, user.name);
    if (body.folderId && before?.driveId) {
      const folder = get<HubFolder>("folder", body.folderId);
      if (folder?.driveId) await moveDestinationFile(before.driveId, folder.driveId);
    }
    return NextResponse.json({ media });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const route = await parts(context);
    assertSameOrigin(request);
    if (route[0] === "session") {
      destroySession(request);
      return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
    }
    const user = requireUser(request);
    requireEditor(user);
    if (route[0] !== "media" || !route[1]) return NextResponse.json({ error: "Rota não encontrada." }, { status: 404 });
    const media = get<MediaAsset>("media", route[1]);
    if (!media) throw new Error("Arquivo não encontrado.");
    if (media.driveId) await trashDestinationFile(media.driveId);
    const archived = updateMedia(media.id, { status: "archived" }, user.name);
    return NextResponse.json({ media: archived });
  } catch (error) {
    return errorResponse(error);
  }
}
