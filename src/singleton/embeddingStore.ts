import { PgVector } from "@mastra/pg";
import { env } from "../env";

export class EmbeddingStore {
  private static instance: EmbeddingStore;
  public store: PgVector;
  private constructor() {
    this.store = new PgVector({
      connectionString: env.POSTGRES_CONNECTION_STRING || "",
    });
  }

  static getInstance(): EmbeddingStore {
    if (!EmbeddingStore.instance) {
      EmbeddingStore.instance = new EmbeddingStore();
    }
    return EmbeddingStore.instance;
  }
}

export const store = EmbeddingStore.getInstance();
