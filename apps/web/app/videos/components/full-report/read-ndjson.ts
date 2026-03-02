import type { ReportStreamEvent } from "@/lib/features/full-report";

export async function readNdjsonStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ReportStreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) { break; }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) { continue; }
      try {
        onEvent(JSON.parse(line) as ReportStreamEvent);
      } catch {
        console.warn("[FullReport] Failed to parse event:", line);
      }
    }
  }

  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer) as ReportStreamEvent);
    } catch {
      // Ignore incomplete final chunk
    }
  }
}
