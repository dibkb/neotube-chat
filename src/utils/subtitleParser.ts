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
export function parseSrtToSubtitles(srtContent: string): Subtitle[] {
  // Split the SRT content by double newline (which separates subtitle entries)
  const subtitleBlocks = srtContent.trim().split("\n\n");

  const subtitles: Subtitle[] = [];

  for (const block of subtitleBlocks) {
    const lines = block.split("\n");

    // Skip if there are fewer than 3 lines (needs index, timestamp, and text)
    if (lines.length < 3) continue;

    // Parse the timestamp line (second line)
    const timestampLine = lines[1];
    const timestampMatch = timestampLine.match(
      /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/
    );

    if (!timestampMatch) continue;

    const startTime = timeToSeconds(timestampMatch[1]);
    const endTime = timeToSeconds(timestampMatch[2]);
    const duration = endTime - startTime;

    // Join all remaining lines as the text content
    const textContent = lines.slice(2).join(" ");

    subtitles.push({
      start: startTime,
      dur: duration,
      text: textContent,
    });
  }

  return subtitles;
}
