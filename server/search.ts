import type { MediaAsset } from "@/lib/types";

export function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const aliases: Record<string, string[]> = {
  mao: ["mão", "mãos", "pulso"],
  agua: ["água", "piscina", "mar", "praia"],
  casa: ["casa", "interno", "interior", "doméstico"],
  verao: ["verão", "praia", "piscina", "água", "sol"],
  joia: ["anel", "anéis", "brinco", "colar", "pulseira", "piercing"],
  dourado: ["dourado", "ouro", "gold"],
  video: ["vídeo", "reels", "ugc"],
};

const stopWords = new Set(["a", "o", "as", "os", "de", "da", "do", "em", "na", "no", "com", "foto", "imagem", "material"]);
function terms(query: string) {
  return [...new Set(normalize(query).split(/[^a-z0-9]+/).filter((word) => word.length > 1 && !stopWords.has(word)))];
}

export function searchMedia(items: MediaAsset[], query: string) {
  items = items.filter((item) => item.status !== "archived");
  if (!query.trim()) return items;
  const needles = terms(query);
  return items
    .map((item) => {
      const primary = normalize(`${item.name} ${item.descriptionShort} ${item.tags.join(" ")}`);
      const secondary = normalize(`${item.descriptionFull} ${item.products.join(" ")} ${item.contexts.join(" ")} ${item.folderPath} ${item.colors.join(" ")} ${item.suggestedUse.join(" ")}`);
      const score = needles.reduce((total, needle) => {
        if (primary.includes(needle)) return total + 6;
        if (secondary.includes(needle)) return total + 3;
        const semanticMatch = (aliases[needle] || []).map(normalize).some((alias) => primary.includes(alias) || secondary.includes(alias));
        return total + (semanticMatch ? 1 : 0);
      }, 0);
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(b.item.updatedAt) - Date.parse(a.item.updatedAt))
    .map(({ item }) => item);
}
