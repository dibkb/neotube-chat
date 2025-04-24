import { EmbeddingStore } from "../singleton/embeddingStore";

export async function metadataIdExists(id: string): Promise<boolean> {
  const pool = EmbeddingStore.getInstance().pool;
  const query = `
        SELECT EXISTS (
          SELECT 1 FROM neotubeembeddings
          WHERE metadata->>'videoId' = $1
        ) AS "exists";
      `;
  const result = await pool.query(query, [id]);
  return result.rows[0].exists;
}
