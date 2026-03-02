import type { TranscriptChunk } from "../types";

export function buildChunkSystemPrompt(isFirstChunk: boolean): string {
  const verbatimRule = isFirstChunk
    ? `- verbatimOpening: Copy the first ~45 seconds of transcript VERBATIM. Do not summarize or paraphrase.`
    : `- verbatimOpening: Set to null (this is not the first chunk).`;

  return `You are a cynical viewer looking for reasons to click away from this YouTube video.
Analyze the transcript chunk and return JSON:

{
  "ctas": [{ "timeSec": 120, "type": "subscribe"|"like"|"comment"|"link"|"other", "quote": "verbatim quote" }],
  "keywords": ["specific", "terms"],
  "topicSummary": "1-2 sentence summary of what this chunk covers",
  "pacingDensity": "low"|"medium"|"high",
  "dropOffHypothesis": "Why viewers may have left at this point" or null,
  "frictionPoints": ["dead air at 1:30", "repeated the same point 3 times"],
  "valueDensity": 7,
  "verbatimOpening": "First ~45 seconds verbatim..." or null
}

Rules:
- ctas: Detect any calls-to-action. Use the approximate timestamp in seconds.
- keywords: Extract 3-8 specific, meaningful terms (not generic words).
- topicSummary: Concise summary of the content in this chunk.
- pacingDensity: "low" = slow/repetitive, "medium" = balanced, "high" = fast/dense.
- dropOffHypothesis: Only provide if drop-off points are present. Explain what content may have caused viewers to leave.
- frictionPoints: List specific moments that would make a viewer click away — dead air, tangents, repetitive filler, "um/uh" heavy sections, confusing explanations, lack of visual cues in spoken content. Be brutally specific with timestamps.
  IMPORTANT: The transcript is split into chunks for processing. Ignore "dead air" or "pauses" that occur at the very beginning or very end of a transcript chunk — these are artifacts of the chunking process, not real pauses in the video. Only flag dead air that occurs clearly in the middle of the chunk where the speaker genuinely trails off or stalls.
- valueDensity: Rate 1-10 using these anchors:
  2 = rambling with no progress, viewer learns/experiences nothing new
  5 = adequate content delivery but predictable, no surprises
  8 = high tension, discoveries, clear explanations, entertainment every moment
  Scores of 4-6 MUST be justified with a specific reason. Default to the edges, not the middle.
${verbatimRule}
- If the transcript seems incoherent (auto-captions, non-English fragments), hypothesize the actual content from context clues and analyze that.

Return ONLY valid JSON.`;
}

export function buildChunkUserPrompt(
  chunk: TranscriptChunk,
  videoTitle: string,
  isLastChunk: boolean,
): string {
  const dropOffContext =
    chunk.dropOffPoints.length > 0
      ? `\nDROP-OFF POINTS IN THIS CHUNK:\n${chunk.dropOffPoints
          .map(
            (d) =>
              `- At ${d.timeSec}s: ${d.severityPct}% of remaining audience left`,
          )
          .join("\n")}`
      : "";

  const continuationNote = isLastChunk
    ? ""
    : "\n(This chunk continues into the next segment — the text ends at an arbitrary split, not a pause.)";

  return `Video: "${videoTitle}"
Chunk ${chunk.index + 1}: ${formatTime(chunk.startTimeSec)} - ${formatTime(chunk.endTimeSec)}
Word count: ${chunk.wordCount}
${dropOffContext}

TRANSCRIPT:
${chunk.text}${continuationNote}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
