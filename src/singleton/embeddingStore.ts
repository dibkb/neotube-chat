import { PgVector } from "@mastra/pg";
import { env } from "../env";
import { Pool } from "pg";
export class EmbeddingStore {
  private static instance: EmbeddingStore;
  public store: PgVector;
  public pool: Pool;
  private constructor() {
    this.store = new PgVector({
      connectionString: env.POSTGRES_CONNECTION_STRING || "",
    });
    this.pool = new Pool({
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
