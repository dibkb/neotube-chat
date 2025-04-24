import { MDocument } from "@mastra/rag";
import { PgVector } from "@mastra/pg";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { getTranscripts } from "./get-transcripts";
import { EmbeddingStore } from "../singleton/embeddingStore";

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
      indexName: "neoTubeEmbeddings", // index name
      vectors: embeddings, // array of embedding vectors
      metadata: chunks.map((chunk) => ({
        text: chunk.text, // The original text content
        videoId: chunk.metadata.videoId,
      })),
    });
  } catch (error) {
    console.error(error);
  }
};
