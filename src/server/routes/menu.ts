import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, redis } from '@devvit/web/server';
import { createPost } from '../core/post';

const COUNTS_KEY = 'scores:counts';
const BEST_KEY = 'scores:best';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create post',
      },
      400
    );
  }
});

menu.post('/reset-scores', async (c) => {
  try {
    await redis.del(COUNTS_KEY);
    await redis.del(BEST_KEY);
    return c.json<UiResponse>({ showToast: 'Scores reset' }, 200);
  } catch (error) {
    console.error(`Error resetting scores: ${error}`);
    return c.json<UiResponse>({ showToast: 'Reset failed' }, 400);
  }
});