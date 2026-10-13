export const MAX_SCORE = 50;

export type ScoreRequest = { score: number };

export type ScoreResponse = {
  type: 'score';
  percentile: number;
  best: number;
  plays: number;
};