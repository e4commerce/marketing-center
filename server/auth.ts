import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import type { AccessUser, UserRole } from "@/lib/types";
import { audit, dataDir, db } from "./db";

const COOKIE = "murano_media_session";
const SESSION_DAYS = 14;
const INITIAL_EMAIL = "thiago@muranojoias.com.br";
const INITIAL_PASSWORD = "admin123";
let cachedSessionSecret: string | undefined;

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  active: number;
  created_at: string;
  updated_at: string;
};

function sessionSecret() {
  if (process.env.MURANO_SESSION_SECRET) return process.env.MURANO_SESSION_SECRET;
  if (cachedSessionSecret) return cachedSessionSecret;

  const secretPath = path.join(dataDir, "session.key");
  try {
    cachedSessionSecret = readFileSync(secretPath, "utf8").trim();
  } catch {
    cachedSessionSecret = randomBytes(32).toString("base64url");
    writeFileSync(secretPath, cachedSessionSecret, { mode: 0o600 });
  }
  return cachedSessionSecret;
}

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("pt-BR");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

function passwordMatches(password: string, encoded: string) {
  const [algorithm, salt, expectedValue] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedValue) return false;
  const expected = Buffer.from(expectedValue, "base64url");
  const supplied = scryptSync(password, salt, expected.length);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function publicUser(row: UserRow): AccessUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function ensureInitialAdmin() {
  const count = db.prepare("SELECT COUNT(*) AS total FROM users").get() as { total: number };
  if (count.total > 0) return;

  const now = new Date().toISOString();
  db.prepare("INSERT INTO users(id,email,name,password_hash,role,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)")
    .run(randomUUID(), INITIAL_EMAIL, "Thiago", hashPassword(INITIAL_PASSWORD), "admin", 1, now, now);
}

ensureInitialAdmin();

export function demoMode() {
  return process.env.MEDIA_HUB_SEED_DEMO !== "0";
}

export function listUsers(): AccessUser[] {
  return (db.prepare("SELECT * FROM users ORDER BY active DESC, name COLLATE NOCASE").all() as unknown as UserRow[]).map(publicUser);
}

export function authenticateUser(email: string, password: string): AccessUser | undefined {
  const row = db.prepare("SELECT * FROM users WHERE email=? COLLATE NOCASE AND active=1").get(normalizeEmail(email)) as UserRow | undefined;
  if (!row || !passwordMatches(password, row.password_hash)) return undefined;
  return publicUser(row);
}

export function createAccessUser(input: { email: string; name: string; password: string; role: UserRole }, actor: string): AccessUser {
  const now = new Date().toISOString();
  const row: UserRow = {
    id: randomUUID(),
    email: normalizeEmail(input.email),
    name: input.name.trim(),
    password_hash: hashPassword(input.password),
    role: input.role,
    active: 1,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare("INSERT INTO users(id,email,name,password_hash,role,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)")
      .run(row.id, row.email, row.name, row.password_hash, row.role, row.active, row.created_at, row.updated_at);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) throw new Error("Já existe um usuário com este e-mail.");
    throw error;
  }

  audit(actor, "user.created", row.id, row.email);
  return publicUser(row);
}

export function updateAccessUser(id: string, input: { name?: string; role?: UserRole; active?: boolean; password?: string }, actor: string): AccessUser {
  const row = db.prepare("SELECT * FROM users WHERE id=?").get(id) as UserRow | undefined;
  if (!row) throw new Error("Usuário não encontrado.");

  const next = {
    name: input.name?.trim() || row.name,
    role: input.role || row.role,
    active: input.active === undefined ? row.active : Number(input.active),
    passwordHash: input.password ? hashPassword(input.password) : row.password_hash,
    updatedAt: new Date().toISOString(),
  };
  db.prepare("UPDATE users SET name=?,role=?,active=?,password_hash=?,updated_at=? WHERE id=?")
    .run(next.name, next.role, next.active, next.passwordHash, next.updatedAt, id);
  if (!next.active) db.prepare("DELETE FROM user_sessions WHERE user_id=?").run(id);
  audit(actor, "user.updated", id, row.email);

  return publicUser({ ...row, name: next.name, role: next.role, active: next.active, password_hash: next.passwordHash, updated_at: next.updatedAt });
}

export function changePassword(userId: string, currentPassword: string, newPassword: string, actor: string) {
  const row = db.prepare("SELECT * FROM users WHERE id=? AND active=1").get(userId) as UserRow | undefined;
  if (!row || !passwordMatches(currentPassword, row.password_hash)) throw new Error("A senha atual está incorreta.");
  db.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?")
    .run(hashPassword(newPassword), new Date().toISOString(), userId);
  db.prepare("DELETE FROM user_sessions WHERE user_id=?").run(userId);
  audit(actor, "user.password_changed", userId, row.email);
}

export function createSession(user: AccessUser) {
  const raw = randomBytes(32).toString("base64url");
  const token = `${raw}.${sign(raw)}`;
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  db.prepare("DELETE FROM user_sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO user_sessions(token_hash,user_id,expires,created_at) VALUES(?,?,?,?)")
    .run(hashToken(raw), user.id, expires, new Date().toISOString());
  return { token, expires };
}

export function sessionCookie(token: string, expires: number) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expires).toUTCString()}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

function rawSessionToken(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return undefined;
  const [raw, signature] = token.split(".");
  if (!raw || !signature) return undefined;
  const expected = Buffer.from(sign(raw));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return undefined;
  return raw;
}

export function currentUser(request: NextRequest): AccessUser | null {
  const raw = rawSessionToken(request);
  if (!raw) return null;
  const row = db.prepare(`SELECT u.* FROM user_sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires>=? AND u.active=1`).get(hashToken(raw), Date.now()) as UserRow | undefined;
  return row ? publicUser(row) : null;
}

export function destroySession(request: NextRequest) {
  const raw = rawSessionToken(request);
  if (raw) db.prepare("DELETE FROM user_sessions WHERE token_hash=?").run(hashToken(raw));
}
