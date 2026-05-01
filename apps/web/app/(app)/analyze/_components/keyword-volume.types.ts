export type KeywordVolumeRow = {
  keyword: string;
  searchVolume: number;
  competition: number;
  competitionLevel: string | null;
  cpc: number;
};

export type KeywordVolumeResponse = {
  rows: KeywordVolumeRow[];
  meta: { fetchedAt: string };
};
