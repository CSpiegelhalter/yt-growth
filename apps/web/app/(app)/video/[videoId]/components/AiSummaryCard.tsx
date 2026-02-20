type Win = {
  label: string;
  metric: string;
  why: string;
};

type Improvement = {
  label: string;
  metric: string;
  fix: string;
};

type TopAction = {
  what: string;
  why: string;
  effort: "low" | "medium" | "high";
};

export type CoreAnalysis = {
  headline?: string;
  wins?: Win[];
  improvements?: Improvement[];
  topAction?: TopAction;
};
