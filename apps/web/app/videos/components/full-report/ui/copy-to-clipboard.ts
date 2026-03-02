export async function copyToClipboard(
  text: string,
  setLabel: (label: string) => void,
  defaultLabel: string,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    setLabel("Copied!");
    setTimeout(() => setLabel(defaultLabel), 2000);
  } catch {
    setLabel("Copy failed");
    setTimeout(() => setLabel(defaultLabel), 2000);
  }
}
