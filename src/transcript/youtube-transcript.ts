import { env } from "../env";

import { parseSrtToSubtitles, Subtitle } from "../utils/subtitleParser";

export async function getYouTubeTranscript(
  videoId: string
): Promise<Subtitle[]> {
  const response = await fetch(
    `https://${env.RAPID_API_HOST}/download-srt/${videoId}?language=en`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-host": env.RAPID_API_HOST,
        "x-rapidapi-key": env.RAPID_API_KEY,
      },
    }
  );
  const textData = await response.text();
  return parseSrtToSubtitles(textData);
}
