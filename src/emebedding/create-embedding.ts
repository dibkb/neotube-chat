import { MDocument } from "@mastra/rag";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { getTranscripts } from "./get-transcripts";
import { EmbeddingStore } from "../singleton/embeddingStore";
import { env } from "../env";

export const createEmbedding = async (videoId: string) => {
  try {
    const vectorStore = EmbeddingStore.getInstance();

    const text = await getTranscripts(videoId);
    if (!text) {
      throw new Error("Trouble getting transcripts...");
    }
    const doc = MDocument.fromText(text, { videoId });
    const chunks = await doc.chunk({
      strategy: "recursive",
      size: 512,
      overlap: 50,
    });

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks.map((chunk) => chunk.text),
    });

    await vectorStore.store.upsert({
      indexName: env.INDEX_NAME,
      vectors: embeddings,
      metadata: chunks.map((chunk) => ({
        text: chunk.text,
        videoId: chunk.metadata.videoId,
      })),
    });
    return { success: true, length: chunks.length };
  } catch (error) {
    console.error(error);
    return { success: false, length: 0 };
  }
};
