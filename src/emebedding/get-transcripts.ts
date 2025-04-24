import { getSubtitles } from "youtube-captions-scraper";

export const getTranscripts = async (videoId: string) => {
  let text = "";
  try {
    const captions = await getSubtitles({
      videoID: videoId,
      lang: "en",
    });
    captions.forEach((caption) => {
      text += caption.text + " ";
    });
  } catch (error) {
    console.error(error);
  }
  return text.length > 0 ? text : null;
};
