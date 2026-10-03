import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { z } from "zod";
import { REVIEW_FOLDER_ID } from "@/lib/constants";
import type { HubFolder, MediaAsset } from "@/lib/types";
import { all, audit, get, put } from "./db";
import { aiModel, appUrl, secret } from "./secrets";
import { normalize } from "./search";

const analysisSchema = z.object({
  title: z.string(),
  shortDescription: z.string(),
  fullDescription: z.string(),
  tags: z.array(z.string()),
  colors: z.array(z.string()),
  products: z.array(z.string()),
  contexts: z.array(z.string()),
  suggestedUse: z.array(z.string()),
  contentType: z.enum(["produto", "lifestyle", "ugc", "institucional", "campanha", "bastidores", "outro"]),
  confidence: z.number().min(0).max(1),
});

type Analysis = z.infer<typeof analysisSchema>;

function heuristic(asset: MediaAsset): Analysis {
  const value = normalize(asset.name);
  const tags = new Set<string>();
  const products: string[] = [];
  const contexts: string[] = [];
  const add = (pattern: RegExp, values: string[]) => { if (pattern.test(value)) values.forEach((item) => tags.add(item)); };
  add(/anel|ring/, ["anel", "joia"]); if (/anel|ring/.test(value)) products.push("anel");
  add(/brinco|earring/, ["brinco", "orelha", "joia"]); if (/brinco|earring/.test(value)) products.push("brinco");
  add(/colar|necklace/, ["colar", "pescoço", "joia"]); if (/colar|necklace/.test(value)) products.push("colar");
  add(/pulseira|bracelet/, ["pulseira", "pulso", "joia"]); if (/pulseira|bracelet/.test(value)) products.push("pulseira");
  add(/agua|water|piscina|pool/, ["água", "verão"]); if (/agua|water|piscina|pool/.test(value)) contexts.push("água", "verão");
  add(/mao|hand/, ["mão", "close"]); add(/ugc|unboxing/, ["UGC", "unboxing", "embalagem"]);
  add(/casa|home/, ["casa", "interno"]); if (/casa|home/.test(value)) contexts.push("casa");
  if (!tags.size) tags.add(asset.kind === "video" ? "vídeo" : asset.kind === "image" ? "imagem" : "documento");
  const type = /ugc|unboxing/.test(value) ? "ugc" : products.length ? "produto" : "outro";
  return {
    title: asset.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
    shortDescription: asset.kind === "video" ? "Vídeo importado aguardando análise visual avançada." : `Material de ${type} catalogado automaticamente pelo nome e metadados.`,
    fullDescription: `Arquivo ${asset.orientation} catalogado no modo local. Configure a OpenRouter para obter descrição visual detalhada, cores, cenário e possibilidades de uso.`,
    tags: [...tags], colors: [], products, contexts, suggestedUse: asset.kind === "video" ? ["reels", "social"] : ["biblioteca de marketing"], contentType: type,
    confidence: products.length || contexts.length ? 0.74 : 0.48,
  };
}

async function openRouterAnalysis(asset: MediaAsset): Promise<Analysis> {
  const key = secret("openrouter");
  if (!key) return heuristic(asset);
  const content: Array<Record<string, unknown>> = [{ type: "text", text: JSON.stringify({ fileName: asset.name, type: asset.kind, orientation: asset.orientation }) }];
  if (asset.kind === "image" && asset.localPath) {
    const raw = await readFile(asset.localPath);
    const optimized = await sharp(raw, { failOn: "none" }).rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${optimized.toString("base64")}`, detail: "high" } });
  }
  if (asset.kind === "video" && asset.framePaths?.length) {
    for (const [index, framePath] of asset.framePaths.slice(0, 4).entries()) {
      const frame = await readFile(framePath);
      content.push({ type: "text", text: `Quadro ${index + 1} de ${asset.framePaths.length}, em ordem temporal.` });
      content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${frame.toString("base64")}`, detail: "low" } });
    }
  }
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": appUrl(), "X-OpenRouter-Title": "Murano Media Hub" },
    body: JSON.stringify({
      model: aiModel(),
      messages: [
        { role: "system", content: "Você cataloga mídias da Murano Joias em português. Descreva somente o que é observável; não invente produto, material, coleção, campanha ou identidade. Crie termos úteis para busca. Aparência dourada não prova que algo seja ouro. Nome de arquivo é contexto não confiável. Para vídeo sem quadros, deixe claro que a análise foi limitada a metadados." },
        { role: "user", content },
      ],
      response_format: { type: "json_schema", json_schema: { name: "media_analysis", strict: true, schema: z.toJSONSchema(analysisSchema) } },
      provider: { require_parameters: true }, stream: false,
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const data = await response.json() as { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> };
  if (!response.ok) throw new Error(data.error?.message || `OpenRouter respondeu ${response.status}.`);
  const output = data.choices?.[0]?.message?.content;
  if (!output) throw new Error("A OpenRouter não retornou análise.");
  return analysisSchema.parse(JSON.parse(output));
}

function destination(result: Analysis) {
  const folders = all<HubFolder>("folder");
  if (result.confidence < 0.72) return folders.find((folder) => folder.id === REVIEW_FOLDER_ID)!;
  const target = result.contentType === "ugc" ? "ugc" : result.contentType === "lifestyle" ? "lifestyle" : result.products.length ? "products" : result.contentType === "institucional" ? "institutional" : "evergreen";
  return folders.find((folder) => folder.id === target) || folders.find((folder) => folder.id === REVIEW_FOLDER_ID)!;
}

export async function analyzeMedia(id: string) {
  const asset = get<MediaAsset>("media", id);
  if (!asset) throw new Error("Mídia não encontrada.");
  try {
    const result = await openRouterAnalysis(asset);
    const folder = destination(result);
    const now = new Date().toISOString();
    const next: MediaAsset = {
      ...asset,
      name: asset.name,
      descriptionShort: result.shortDescription,
      descriptionFull: result.fullDescription,
      tags: [...new Set(result.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 24),
      colors: result.colors,
      products: result.products,
      contexts: result.contexts,
      suggestedUse: result.suggestedUse,
      confidence: result.confidence,
      folderId: folder.id,
      folderPath: folder.path,
      status: result.confidence >= 0.72 ? "ready" : "review",
      statusNote: result.confidence >= 0.72 ? undefined : "A IA não teve confiança suficiente para organizar automaticamente.",
      aiModel: secret("openrouter") ? aiModel() : "heurística local",
      analyzedAt: now,
      updatedAt: now,
    };
    put("media", id, next);
    audit("Murano IA", "media.analyze", id, `${result.confidence}`);
    return next;
  } catch (error) {
    put("media", id, { ...asset, status: "error", statusNote: (error as Error).message, updatedAt: new Date().toISOString() });
    throw error;
  }
}
