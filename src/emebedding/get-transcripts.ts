import { getYouTubeTranscript } from "../transcript/youtube-transcript";
import { EmbeddingStore } from "../singleton/embeddingStore";
import { Subtitle } from "../utils/subtitleParser";

export const generateTranscript = async (
  videoId: string
): Promise<Subtitle[]> => {
  const captions = await getYouTubeTranscript(videoId);
  return captions;
};

export const getTranscripts = async (videoId: string) => {
  // If not in database, fetch from YouTube
  let text = "";
  try {
    const existingTranscript = (await getTranscriptFromDB(
      videoId
    )) as unknown as Subtitle[];
    if (existingTranscript) {
      existingTranscript.forEach((caption) => {
        text += caption.text + " ";
      });
      return text;
    }
    const generatedTranscript = (await generateTranscript(
      videoId
    )) as Subtitle[];
    if (!generatedTranscript) {
      throw new Error("Failed to generate transcript");
    }
    generatedTranscript.forEach((caption) => {
      text += caption.text + " ";
    });
    await saveTranscriptToDB(videoId, JSON.stringify(generatedTranscript));
  } catch (error) {
    throw error;
  }
  return text.length > 0 ? text : null;
};

export const getTranscriptFromDB = async (
  videoId: string
): Promise<Subtitle[] | null> => {
  try {
    const transcriptPool = EmbeddingStore.getInstance().transcriptPool;
    const query = `
      SELECT "transcript" 
      FROM "neo-tube-video-transcript" 
      WHERE "videoId" = $1
    `;
    const result = await transcriptPool.query(query, [videoId]);

    if (result.rows.length > 0) {
      return result.rows[0].transcript;
    }
    return null;
  } catch (error) {
    console.error("Error fetching transcript from database:", error);
    return null;
  }
};

export const saveTranscriptToDB = async (
  videoId: string,
  transcript: string
): Promise<boolean> => {
  try {
    const transcriptPool = EmbeddingStore.getInstance().transcriptPool;
    const query = `
      INSERT INTO "neo-tube-video-transcript" ("videoId", "transcript")
      VALUES ($1, $2)
      ON CONFLICT ("videoId") 
      DO UPDATE SET "transcript" = $2
    `;
    await transcriptPool.query(query, [videoId, transcript]);
    return true;
  } catch (error) {
    console.error("Error saving transcript to database:", error);
    return false;
  }
};
