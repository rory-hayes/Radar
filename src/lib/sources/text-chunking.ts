import { hashText } from "@/lib/sources/url-crawler";

export type TextChunk = {
  content: string;
  contentHash: string;
  tokenCount: number;
  chunkIndex: number;
};

export function chunkSourceText(text: string, maxChunkCharacters = 4000): TextChunk[] {
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;

    if (next.length <= maxChunkCharacters) {
      current = next;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (paragraph.length > maxChunkCharacters) {
      chunks.push(...splitLongParagraph(paragraph, maxChunkCharacters));
      current = "";
    } else {
      current = paragraph;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.map((content, chunkIndex) => ({
    content,
    contentHash: hashText(content),
    tokenCount: estimateTokenCount(content),
    chunkIndex,
  }));
}

export function estimateTokenCount(content: string) {
  return Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length * 1.3));
}

function splitLongParagraph(paragraph: string, maxChunkCharacters: number) {
  const chunks: string[] = [];

  for (let index = 0; index < paragraph.length; index += maxChunkCharacters) {
    chunks.push(paragraph.slice(index, index + maxChunkCharacters));
  }

  return chunks;
}
