import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { EmbeddingStore } from "../singleton/embeddingStore";
import { env } from "../env";

export const constructGenerationPrompt = async ({
  message,
  videoId,
}: {
  message: string;
  videoId: string;
}): Promise<string> => {
  const vectorStore = EmbeddingStore.getInstance();
  const { embedding } = await embed({
    value: message,
    model: openai.embedding("text-embedding-3-small"),
  });

  const results = await vectorStore.store.query({
    indexName: env.INDEX_NAME,
    queryVector: embedding,
    topK: 3,
    filter: {
      videoId: videoId,
    },
  });
  const context = results.map((result) => result.metadata?.text).join("\n");
  const formattedMessage = `
      Context (transcript snippets, retrieved dynamically):
      ${context}
      User Query:
      ${message}
      `;
  return formattedMessage;
};
