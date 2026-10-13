import { Hono } from 'hono';
import { context, redis } from '@devvit/web/server';
import type { ScoreRequest, ScoreResponse } from '../../shared/api';
import { MAX_SCORE } from '../../shared/api';
import seedScores from '../data/seedScores.json';

type ErrorResponse = {
  status: 'error';
  message: string;
};

const SEED_SCORES: readonly number[] = seedScores.filter(
  (n: number) => Number.isFinite(n) && n >= 0 && n <= 1
);
const EPSILON = 1e-9;

const COUNTS_KEY = 'scores:counts';
const BEST_KEY = 'scores:best';

export const api = new Hono();

api.post('/score', async (c) => {
  let body: ScoreRequest;
  try {
    body = await c.req.json<ScoreRequest>();
  } catch {
    return c.json<ErrorResponse>({ status: 'error', message: 'Invalid JSON' }, 400);
  }

  const score = body.score;
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Invalid score' }, 400);
  }

  try {
    await redis.hIncrBy(COUNTS_KEY, String(score), 1);

    const { userId } = context;
    let best = score;
    if (userId) {
      const previous = Number((await redis.hGet(BEST_KEY, userId)) ?? -1);
      if (score > previous) {
        await redis.hSet(BEST_KEY, { [userId]: String(score) });
      } else {
        best = previous;
      }
    }

    const counts = await redis.hGetAll(COUNTS_KEY);
    let liveTotal = 0;
    let liveBelow = 0;
    for (let s = 0; s <= MAX_SCORE; s++) {
      const n = Number(counts[String(s)] ?? 0);
      liveTotal += n;
      if (s < score) liveBelow += n;
    }

    const normalized = score / MAX_SCORE;
    const seedBelow = SEED_SCORES.filter((v) => v < normalized - EPSILON).length;

    const total = SEED_SCORES.length + liveTotal;
    const below = seedBelow + liveBelow;
    const percentile = total > 0 ? Math.round((below / total) * 100) : 0;

    return c.json<ScoreResponse>({ type: 'score', percentile, best, plays: total });
  } catch (error) {
    console.error('API Score Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to save score' }, 500);
  }
});