# PixReveal

Guess the pixel art before it's fully revealed.

PixReveal is a quick pixel-art guessing game that runs right inside a Reddit post. A drawing is revealed pixel by pixel, and you pick the right name from four options. The faster you guess, the more points you score. At the end you see how you rank against other players.

PixReveal is based on my browsergame [pixreveal.com](https://pixreveal.com).

## How to play

1. Tap **Play** on the post to open the game.
2. Five pixel drawings come up, one after another. Each one is slowly revealed over 10 seconds.
3. Pick the correct answer from four options. On a keyboard you can also press 1 to 4.
4. A correct answer scores the seconds you had left, so earlier guesses are worth more. A wrong answer or running out of time scores 0.
5. After the fifth drawing you see your total score and the percentage of players you beat.

A full game takes about a minute.

## For moderators

- Installing the app creates one game post in your subreddit.
- **Create a new post** in the subreddit menu adds another game post.
- **Reset scores** in the subreddit menu deletes all stored scores. The built-in starting distribution stays.
- The app does not post, comment, or moderate anything else.

## Data & privacy

- The app stores your final score and your personal best score to build the ranking.
- Scores are stored with Reddit's built-in app storage (Redis). Nothing is sent to external services.
- The app does not read your messages, subscriptions, or any other Reddit content.

## Version history

### 0.1.0

- First release: Classic mode with five drawings per game and a percentile ranking at the end.

## Development

Built with [Devvit Web](https://developers.reddit.com/), [Vue 3](https://vuejs.org/), [Pinia](https://pinia.vuejs.org/), [Vite](https://vite.dev/), and [Hono](https://hono.dev/) for the backend, written in TypeScript.

Requires Node 24.

### Getting started

1. Install dependencies: `npm install`
2. Log in to Reddit: `npm run login`
3. Start a live playtest on your test subreddit: `npm run dev`

### Commands

- `npm run dev`: Playtest the app live on Reddit
- `npm run build`: Build the client and server
- `npm run test:types`: Type-check the project
- `npm run deploy`: Type-check, lint, and upload a new version
- `npm run launch`: Upload and submit the app for review
- `npm run login`: Log the CLI into Reddit