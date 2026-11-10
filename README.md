# CS321 Lecture Recorder

Team 10 project for CS 321. Records lectures and turns them into transcripts, notes, and flashcards. Built with Expo and Supabase.

See docs/ARCHITECTURE.md for the overall design and the stories.

## Setup

You need Node 22+ and git.

```
git clone https://github.com/TrentFisher6/cs321-lecture-recorder.git
cd cs321-lecture-recorder
npm install
```

## Running the app

The app uses a development build, not Expo Go, because it needs native features like background recording.

Android (phone plugged in with USB debugging on, Android Studio installed):

```
npx expo run:android
```

This builds and installs the app, then starts the dev server. After that, `npx expo start` is enough and the app reloads when you save. Only run `npx expo run:android` again after adding a native package or changing `app.json`.

iPhone simulator (Mac with Xcode): `npx expo run:ios`

Screens are in `src/app/`. On the sign in screen there are debug buttons that log in as the demo student and demo staff accounts.

## Making changes

Make a branch for your story, then open a pull request when you're done. Don't push straight to main.

```
git checkout main
git pull
git checkout -b story-5
```

Run these before submitting a PR. CI will block merging on failing tests

```
npm run lint
npm test
```

Put unit tests in a `__tests__` folder next to the code and end in `-test.ts` like `src/lib/__tests__/spaced-repetition-test.ts`.

## Supabase

Only needed if you're changing the database or the edge function. Ask Trent to add you to the Supabase org first, then:

```
npx supabase login
npx supabase link --project-ref dqbheiqawuwzuvcaxvff
```

Deploy the edge function:

```
npm run fn:deploy -- process-lecture
```

Database changes go in migration files, not the dashboard:

```
npm run db:new <name>
# write the SQL in the new file in supabase/migrations
npm run db:push
npm run db:types
```

API keys (Claude, Deepgram) are stored as Supabase secrets. Don't put them in `.env` or commit them.
