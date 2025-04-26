import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  ENVIRONMENT: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4111),
  POSTGRES_CONNECTION_STRING: z.string().url(),
  POSTGRES_CONNECTION_STRING_MEMORY: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  INDEX_NAME: z.string().default("neoTubeEmbeddings"),
  POSTGRES_CONNECTION_STRING_TRANSCRIPT: z.string().url(),
  RAPID_API_KEY: z.string().min(1),
  RAPID_API_HOST: z.string().min(1),
});

// Validate the environment variables
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
