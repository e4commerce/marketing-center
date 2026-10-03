import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { SOURCE_FOLDERS } from "../lib/constants";
import type { MediaAsset } from "../lib/types";
import { all, get, put } from "../server/db";
import { attachVideoFrames } from "../server/media";
import { normalize, searchMedia } from "../server/search";

test("normalização preserva busca sem acentos", () => {
  assert.equal(normalize("Mão na Água"), "mao na agua");
});

test("busca natural encontra a cena de mão na água", () => {
  const media = all<MediaAsset>("media");
  const result = searchMedia(media, "foto de mão na água");
  assert.equal(result[0]?.id, "demo-water");
});

test("as duas fontes aprovadas são imutáveis por contrato", () => {
  assert.deepEqual(SOURCE_FOLDERS.map((source) => source.folderId), [
    "164JUiDoPsibeyF1c__lG1Qkyy1rwiRRI",
    "1Vf_SC7Gh5_DD2kzeHs_zM9vT0DTGzvfM",
  ]);
  assert.ok(SOURCE_FOLDERS.every((source) => source.readOnly));
});

test("estrutura inicial inclui entrada, revisão e arquivo", () => {
  const ids = new Set(all<{ id: string }>("folder").map((folder) => folder.id));
  assert.ok(ids.has("inbox"));
  assert.ok(ids.has("review"));
  assert.ok(ids.has("archive"));
});

test("vídeos aceitam quadros visuais para preview e análise", async () => {
  const now = new Date().toISOString();
  const video: MediaAsset = {
    id: "test-video-frames", name: "teste-video.mp4", kind: "video", mimeType: "video/mp4", size: 100,
    orientation: "vertical", folderId: "inbox", folderPath: "MURANO_MARKETING/00_ENTRADA", previewUrl: "/demo/video-placeholder.svg",
    descriptionShort: "Teste", descriptionFull: "Teste", tags: [], colors: [], products: [], contexts: [], suggestedUse: [],
    confidence: 0, status: "archived", source: "upload", createdAt: now, updatedAt: now, uploadedBy: "Teste",
  };
  put("media", video.id, video);
  const frame = await sharp({ create: { width: 80, height: 120, channels: 3, background: "#6b4eff" } }).jpeg().toBuffer();
  const updated = await attachVideoFrames(video.id, [frame]);
  assert.equal(updated.framePaths?.length, 1);
  assert.equal(updated.previewUrl, `/api/file/${video.id}?frame=0`);
  assert.equal(get<MediaAsset>("media", video.id)?.framePaths?.length, 1);
});
