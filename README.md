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

1. Download Expo Go on your phone and make an Expo account
2. Log in on your laptop with `npx expo login` (same account as the phone)
3. Run `npx expo start` and scan the QR code
4. If it doesn't connect, try `npx expo start --tunnel`

Screens are in `src/app/`. The app reloads when you save.

## Making changes

Make a branch for your story, then open a pull request when you're done. Don't push straight to main.

```
git checkout main
git pull
git checkout -b story-5
```

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
