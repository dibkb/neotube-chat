import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { testAgent } from "./agents/test";
import { generationAgent } from "./agents/generation";
import { env } from "../env";
import { createEmbedding } from "../emebedding/create-embedding";
import { metadataIdExists } from "../emebedding/embedding-exists";
import { constructGenerationPrompt } from "../generation/construct-generation";
import {
  generateTranscript,
  getTranscriptFromDB,
  saveTranscriptToDB,
} from "../emebedding/get-transcripts";
import { getYouTubeTranscript } from "../transcript/youtube-transcript";

export const mastra = new Mastra({
  agents: { testAgent, generationAgent },
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
          return c.json({ message: "healthy 🔥" });
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
      registerApiRoute("/generate-transcript-v1", {
        method: "GET",
        handler: async (c) => {
          const videoId = c.req.query("videoId");
          if (!videoId) {
            return c.json({ success: false, error: "Video ID is required" });
          }
          const transcript = await getYouTubeTranscript(videoId);
          return c.json({ success: true, transcript });
        },
      }),
      //--------------------------------
      registerApiRoute("/generate-transcript", {
        method: "GET",
        handler: async (c) => {
          try {
            const videoId = c.req.query("videoId");
            if (!videoId) {
              return c.json({ success: false, error: "Video ID is required" });
            }
            let transcript = await getTranscriptFromDB(videoId);
            console.log("transcript from db", transcript);
            if (transcript.length > 0) {
              return c.json({ success: true, transcript });
            }
            const newTranscript = await generateTranscript(videoId);
            if (!newTranscript) {
              return c.json({
                success: false,
                error: "Failed to generate transcript",
              });
            }
            await saveTranscriptToDB(videoId, JSON.stringify(newTranscript));
            return c.json({ success: true, transcript: newTranscript });
          } catch (error) {
            return c.json({
              success: false,
              error: "Failed to generate transcript",
            });
          }
        },
      }),
      //--------------------------------
      registerApiRoute(`/prepare-chat-agent`, {
        method: "POST",
        handler: async (c) => {
          try {
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
          } catch (error) {
            return c.json({
              success: false,
              error: "Failed to create embedding",
            });
          }
        },
      }),
      //--------------------------------
      registerApiRoute(`/chat`, {
        method: "POST",
        handler: async (c) => {
          const { videoId, userId, message } = await c.req.json();
          if (!videoId || !userId || !message) {
            return c.json({
              success: false,
              error: "Missing required fields: videoId, userId, message",
            });
          }
          const generationAgent = c.get("mastra").getAgent("generationAgent");
          const formattedMessage = await constructGenerationPrompt({
            message,
            videoId,
          });
          const response = await generationAgent.stream(
            [
              {
                role: "user",
                content: formattedMessage,
              },
            ],
            {
              threadId: videoId,
              resourceId: userId,
            }
          );
          const encoder = new TextEncoder();
          const responseStream = new TransformStream();
          const writer = responseStream.writable.getWriter();

          (async () => {
            try {
              const reader = response.textStream;
              for await (const chunk of reader) {
                try {
                  const formattedChunk = `data: ${JSON.stringify({
                    type: "text",
                    value: chunk,
                  })}\n\n`;
                  await writer.write(encoder.encode(formattedChunk));
                } catch (writeError) {
                  console.log(
                    "Write error (client likely disconnected):",
                    writeError
                  );
                  break;
                }
              }
              try {
                await writer.write(encoder.encode("data: [DONE]\n\n"));
              } catch (closeError) {
                console.log("Error writing close event:", closeError);
              }
            } catch (error: unknown) {
              if (
                error instanceof Error &&
                error.message.includes("ResponseAborted")
              ) {
                console.log("Client disconnected:", error);
              } else {
                console.error("Stream processing error:", error);

                try {
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "error",
                        value:
                          error instanceof Error
                            ? error.message
                            : String(error),
                      })}\n\n`
                    )
                  );
                } catch (writeError) {
                  console.log("Error writing error message:", writeError);
                }
              }
            } finally {
              try {
                if (writer.desiredSize !== null) {
                  await writer.close();
                }
              } catch (e) {
                console.log("Error closing writer:", e);
              }
            }
          })();

          return new Response(responseStream.readable, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        },
      }),
    ],
  },
});
