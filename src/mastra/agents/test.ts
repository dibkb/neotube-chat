import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

export const testAgent = new Agent({
  name: "Test Agent",
  instructions: `You are a helpful assistant that can answer...`,
  model: openai("gpt-4o-mini"),
});
