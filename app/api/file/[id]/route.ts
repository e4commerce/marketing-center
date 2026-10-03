import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import type { MediaAsset } from "@/lib/types";
import { currentUser } from "@/server/auth";
import { get, previewDir } from "@/server/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!currentUser(request)) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const { id } = await context.params;
  const asset = get<MediaAsset>("media", id);
  if (!asset) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  const preview = request.nextUrl.searchParams.get("preview") === "1";
  const frameIndex = request.nextUrl.searchParams.get("frame");
  const filePath = frameIndex !== null ? asset.framePaths?.[Number(frameIndex)] : preview ? path.join(previewDir, `${id}.jpg`) : asset.localPath;
  if (!filePath) return NextResponse.redirect(new URL(asset.previewUrl, request.url));
  try {
    const bytes = await readFile(filePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": preview || frameIndex !== null ? "image/jpeg" : asset.mimeType,
        "Cache-Control": preview || frameIndex !== null ? "private, max-age=3600" : "private, no-store",
        "Content-Disposition": `${preview || frameIndex !== null ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(asset.name)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo local indisponível." }, { status: 404 });
  }
}
