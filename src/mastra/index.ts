import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { testAgent } from "./agents/test";
import { env } from "../env";
import { createEmbedding } from "../emebedding/create-embedding";
import { metadataIdExists } from "../emebedding/embedding-exists";

export const mastra = new Mastra({
  agents: { testAgent },
  server: {
    port: Number(process.env.PORT) || 4111,
    timeout: 300000,
    cors: {
      origin:
        env.ENVIRONMENT === "production"
          ? [env.FRONTEND_URL]
          : [
              "http://localhost:3000",
              "http://localhost:3001",
              "http://localhost:5173",
            ],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
    apiRoutes: [
      registerApiRoute("/health", {
        method: "GET",
        handler: async (c) => {
          return c.json({ message: "ok" });
        },
      }),
      //--------------------------------
      registerApiRoute("/test-agent", {
        method: "GET",
        handler: async (c) => {
          const agent = await c.get("mastra").getAgent("testAgent");
          const response = await agent.stream("What is your name?");
          return response.toDataStreamResponse();
        },
      }),
      //--------------------------------
      registerApiRoute(`/prepare-chat-agent`, {
        method: "POST",
        handler: async (c) => {
          const { videoId } = await c.req.json();
          if (!videoId) {
            return c.json({ success: false, error: "Video ID is required" });
          }
          const exists = await metadataIdExists(videoId);
          if (exists) {
            return c.json({ success: true });
          }
          const { success, length } = await createEmbedding(videoId);
          if (!success) {
            return c.json({
              success: false,
              error: "Failed to create embedding",
            });
          }
          return c.json({ success: true, length });
        },
      }),
    ],
  },
});
