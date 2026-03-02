type NarrativeStep = {
  label: string;
  text: string;
};

const STEP_REGEX = /^\d+\.\s*(?:THE\s+)?(.+?):\s*(.+)$/i;

export function parseNarrativeHook(scriptFix: string): NarrativeStep[] | null {
  const lines = scriptFix.split("\n").filter(Boolean);
  if (lines.length < 2) { return null; }

  const steps: NarrativeStep[] = [];

  for (const line of lines) {
    const match = STEP_REGEX.exec(line.trim());
    if (!match) { return null; }
    steps.push({ label: match[1].trim(), text: match[2].trim() });
  }

  return steps.length > 0 ? steps : null;
}
