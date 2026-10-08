# @feathertap/shared-logic

Platform-free domain logic shared by **ft-client.mobile** (Expo) and **ft-client.webapp** (Next.js PWA).

Extracted so the two clients cannot drift. If a rule lives here, both apps get the same answer.

## The one rule

Nothing in this package may import `react-native`, `expo-*`, `next/*`, or a Supabase client.
React is allowed, but only for pure hooks with no platform calls.

Anything platform-specific is **injected** by the consuming app.

## Using the API client

The client needs only two Supabase methods, so it takes a narrow interface rather than
the real client. Mobile and web configure Supabase differently (auth storage,
`detectSessionInUrl`), so each builds its own and injects it.

```ts
import { createApiClient } from "@feathertap/shared-logic";
import { supabase } from "./supabase";

export const api = createApiClient(supabase);
```

## What's inside

| Area | Contents |
|---|---|
| `lib/` | typed API client, session script helpers, intensity + journey maths, copy helpers |
| `hooks/` | `useSessionPlayer` — the session phase state machine |
| `types/` | database, conversation, tapping, survey |
| `constants/` | pre-built explore sessions |

## Commands

```bash
npm install
npm test
npm run typecheck
```

## Consumed as a submodule

Both clients add this repo as a git submodule and alias it in `tsconfig.json`:

```json
{ "paths": { "@feathertap/shared-logic": ["./shared-logic/index.ts"] } }
```
