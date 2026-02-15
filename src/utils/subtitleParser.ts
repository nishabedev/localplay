import type { SubtitleCue } from '../types';

// Parse SRT content into SubtitleCue array
export const parseSRT = (content: string): SubtitleCue[] => {
  const cues: SubtitleCue[] = [];

  // Normalize line endings (handle Windows \r\n and old Mac \r)
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalizedContent.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim());
    if (lines.length < 3) continue;

    const idMatch = lines[0].match(/^\d+$/);
    if (!idMatch) continue;

    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );
    if (!timeMatch) continue;

    const startTime =
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000;

    const endTime =
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000;

    const text = lines.slice(2).join('\n').trim();

    cues.push({
      id: parseInt(idMatch[0]),
      startTime,
      endTime,
      text,
    });
  }

  return cues;
};

// Extract plain text from SRT content for search indexing
export const extractPlainText = (srtContent: string): string => {
  const cues = parseSRT(srtContent);
  return cues.map(cue => cue.text).join(' ');
};
