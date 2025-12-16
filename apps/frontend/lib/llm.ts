import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PlanInputs = {
  channelTitle?: string | null;
  recentStats?: Array<{ title?: string | null; views?: number; avgViewDuration?: number | null }>;
  competitors?: string[];
  niche?: string;
};

export async function generatePlanMarkdown(inputs: PlanInputs) {
  const messages = [
    {
      role: "system",
      content:
        "You are a YouTube growth consultant. Output concise markdown with headings, bullet lists, and short explanations.",
    },
    {
      role: "user",
      content: `
Channel: ${inputs.channelTitle ?? "Unknown"}
Niche: ${inputs.niche ?? "general"}
Recent videos (title | views | avg view duration sec):
${(inputs.recentStats ?? [])
  .map((v) => `- ${v.title ?? "Untitled"} | ${v.views ?? "?"} views | ${v.avgViewDuration ?? "?"}s`)
  .join("\n")}
Competitor hints: ${(inputs.competitors ?? []).join(", ") || "none"}

Produce:
- 1 best next topic and 2 alternates
- 3 title options
- thumbnail guidance (no images)
- top 5 tags/keywords
- 1-week checklist (7 days)
Keep it tight and actionable.
`,
    },
  ];

  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages,
    temperature: 0.5,
    max_tokens: 600,
  });
  return resp.choices[0]?.message?.content?.trim() ?? "";
}

export async function generateRetentionHypotheses(
  rows: Array<{ title?: string; cliffTimeSec?: number; cliffReason?: string }>
) {
  const bullet = rows
    .map(
      (r) =>
        `- ${r.title ?? "video"}: cliff at ~${r.cliffTimeSec ?? "?"}s (${r.cliffReason ?? "drop"})`
    )
    .join("\n");
  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You explain audience retention cliffs briefly and suggest 3 quick fixes. Keep answers short.",
      },
      {
        role: "user",
        content: `Videos and cliffs:\n${bullet}\nGive one hypothesis that covers the pattern and 3 tactical fixes.`,
      },
    ],
    temperature: 0.4,
    max_tokens: 220,
  });
  return resp.choices[0]?.message?.content?.trim() ?? "";
}
