import { env } from "../env";

import { parseSrtToSubtitles, Subtitle } from "../utils/subtitleParser";
import { z } from "zod";

const transcriptSchema = z.object({
  success: z.boolean(),
  transcript: z.array(
    z.object({
      text: z.string(),
      duration: z.string(),
      offset: z.string(),
      lang: z.string(),
    })
  ),
});
export async function getYouTubeTranscript(
  videoId: string
): Promise<Subtitle[]> {
  const url =
    "https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}";
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": env.RAPID_API_KEY,
      "x-rapidapi-host": env.RAPID_API_HOST,
    },
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    const parsedResult = transcriptSchema.parse(result);
    return parseSrtToSubtitles(parsedResult);
  } catch (error) {
    console.error(error);
    return [];
  }
}
