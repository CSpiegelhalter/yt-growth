type TitleStat = {
  key: string;
  value: string;
};

export function parseTitleStats(stats: string): TitleStat[] {
  if (!stats) { return []; }

  return stats.split("|").map((part) => {
    const [key = "", value = ""] = part.split(":").map((s) => s.trim());
    return { key, value };
  });
}
