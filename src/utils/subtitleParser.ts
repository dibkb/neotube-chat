/**
 * Converts SRT format subtitles to an array of Subtitle objects
 */

export interface Subtitle {
  start: number;
  dur: number;
  text: string;
}

/**
 * Converts time string in format "00:00:00,000" to seconds
 */
function timeToSeconds(time: string): number {
  const [hours, minutes, secondsAndMs] = time.split(":");
  const [seconds, ms] = secondsAndMs.split(",");

  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds) +
    parseInt(ms) / 1000
  );
}

/**
 * Parses SRT format subtitles to an array of Subtitle objects
 */
export function parseSrtToSubtitles(input: {
  success: boolean;
  transcript: Array<{
    text: string;
    duration: string;
    offset: string;
    lang: string;
  }>;
}): Subtitle[] {
  if (!input.success || !input.transcript) {
    return [];
  }

  return input.transcript.map((item) => ({
    start: parseFloat(item.offset),
    dur: parseFloat(item.duration),
    text: item.text,
  }));
}
