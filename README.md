# vet-portal

A web portal for a fictional veterinary clinic: visitors book and manage appointments, and signed in users chat with an AI agent. A GraphQL API sits in front of the REST API of the [vet-agent](https://github.com/vinera-dev/vet-agent) project.

> **Status:** feature complete against a simulated backend. Booking, appointment management, chat, authentication code and the test suites are implemented. It is not deployed yet, and signing in with a real GitHub OAuth App has not been exercised. All data is fictional.

## Features

- Appointment booking: keyboard operable day selector, free and unavailable times, form validated with zod, confirmation with an appointment code.
- Appointment management by code: view, reschedule and cancel.
- Chat with the clinic agent: live region for screen readers, loading and error states, sources of each answer, notice when a conversation is handed to a human or flagged as an emergency.
- Sign in with GitHub (Auth.js). The chat is only available to signed in users and every user has their own conversation.
- Accessible by design: contrast checked token palette, visible focus, skip link, axe checks in unit and end-to-end tests.

## Architecture

```
Browser
  |  GraphQL (/api/graphql)        chat (/api/chat, httpOnly cookie)
  v                                v
Next.js app router (this repo)
  |-- GraphQL Yoga schema and resolvers
  |-- typed REST client (zod validated responses)
  |-- chat route handler (session cookie bound to the user)
  v
vet-agent REST API   (/appointments, /agent/chat)
```

- **Next.js app router and TypeScript** (strict). Pages are server components; interactive parts are small client components.
- **GraphQL Yoga** at `/api/graphql`. The schema (`src/graphql/typeDefs.ts`, exported to `schema.graphql`) exposes `slots(day)`, `appointment(id)` and the `bookAppointment`, `rescheduleAppointment` and `cancelAppointment` mutations. REST error codes become typed GraphQL error codes in `extensions.code` (for example `SLOT_UNAVAILABLE`).
- **Typed REST client** (`src/server/vet-api`). Responses are validated with zod, failures become a single error type, and the client takes an injectable `fetch` so tests never need the network.
- **Generated types.** `graphql-codegen` writes resolver and operation types to `src/gql` from the schema and the documents in `src/graphql/operations`. The folder is not committed; the `pre*` npm scripts regenerate it. `schema.graphql` is committed and CI fails if it drifts.
- **Chat route** (`/api/chat`). It forwards the message to the agent and keeps the conversation id in an `httpOnly`, `SameSite=Lax` cookie that the browser JavaScript cannot read. The cookie value is signed and bound to the signed in user, so another user can never resume it.
- **Authentication.** Auth.js with the GitHub provider and JWT sessions, see [ADR 0001](docs/adr/0001-authentication-with-authjs-and-github.md). `src/proxy.ts` redirects anonymous visitors of `/chat` to `/sign-in` and answers `401` for `/api/chat`.

## Running it

Requirements: Node 24 and npm 11.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://127.0.0.1:3000>. Without a backend the booking and chat calls fail with a clear error message. To use a real backend, start [vet-agent](https://github.com/vinera-dev/vet-agent) and set `VET_API_URL` (default `http://127.0.0.1:8000`).

To try the portal without the real backend, run the simulated one in a second terminal and point the portal at it:

```bash
node fake-backend/server.ts
VET_API_URL=http://127.0.0.1:8765 npm run dev
```

### Environment variables

| Variable        | Purpose                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| `VET_API_URL`   | Base URL of the vet-agent REST API                                             |
| `AUTH_SECRET`   | Secret used to sign sessions and chat cookies (`npx auth secret`)              |
| `GITHUB_ID`     | Client id of a GitHub OAuth App                                                |
| `GITHUB_SECRET` | Client secret of the same OAuth App                                            |
| `E2E_AUTH`      | Set to `1` only for tests: enables a name based sign in. Refused in production |

To enable GitHub sign in, create an OAuth App with the callback URL `http://127.0.0.1:3000/api/auth/callback/github` and fill in `GITHUB_ID` and `GITHUB_SECRET`.

## Testing

```bash
npm run lint
npm run typecheck
npm test
npm run e2e
```

- **Unit and integration tests** (Jest and Testing Library, 153 tests). The GraphQL resolvers run through a real Yoga instance against a simulated vet-agent API (`fake-backend/`). Components are tested for behavior, keyboard use, loading, error and empty states, and with jest-axe.
- **End-to-end tests** (Playwright, Chromium). The app runs in dev mode next to the simulated backend and covers the booking flow, appointment management, chat context, user separation, route protection and axe scans of every main page.
- **Lint rules.** Besides the Next.js rules, a local rule rejects any code comment.
- **CI** (`.github/workflows/ci.yml`) runs codegen drift check, format check, lint, typecheck, unit tests and build, plus the end-to-end suite in a second job.

The simulated backend keeps appointments and chat sessions in memory and implements the same endpoints and error codes as the real service. Its replies are canned, so chat answers in tests are deterministic and not produced by a model.

## Roadmap

- [x] 1. Next.js skeleton, tests and CI
- [x] 2. GraphQL gateway over the vet-agent API
- [x] 3. Appointment calendar
- [x] 4. Agent chat interface
- [x] 5. Authentication code (Auth.js with GitHub; sign in with a real OAuth App not verified yet)
- [x] 6. End-to-end and accessibility tests
- [ ] 7. Public deployment

## License

Released under the [MIT License](LICENSE).
