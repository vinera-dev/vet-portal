# 0001. Authentication with Auth.js and the GitHub provider

Status: accepted

## Context

The portal needs to know who is using the assistant. Chat answers cost money to produce, and a
conversation belongs to one person, so the chat must not be open to anonymous traffic and two
people must never share a conversation. Booking an appointment stays open: a visitor can book as a
guest and manage the appointment later with its code.

Constraints:

- The app is a Next.js app router project deployed as a plain Node server or on a serverless host.
- There is no user database and none is wanted for a demo project.
- The solution must be testable without real credentials.

## Options considered

1. **Auth.js (next-auth v5) with the GitHub OAuth provider.** Maintained, integrates with the app
   router and the proxy file, signed JWT sessions in a cookie, no database needed.
2. **Email and password with a hand-written session layer.** Needs a user store, password hashing,
   reset flows and rate limiting. Too much surface for the value.
3. **A hosted identity service.** Adds an external dependency and an account just to run the demo.

## Decision

Use Auth.js with the GitHub provider and JWT sessions.

- Configuration comes from environment variables: `GITHUB_ID`, `GITHUB_SECRET` and `AUTH_SECRET`.
  They are documented in `.env.example` and never committed.
- Routes under `/chat` and `/api/chat` require a session. Anonymous requests to a page are
  redirected to `/sign-in`; anonymous requests to the API receive `401`.
- The chat session cookie is bound to the user id with an HMAC signature. A cookie issued for one
  user is ignored for any other user, so conversations stay separate even in a shared browser.
- For automated tests only, a credentials provider can be switched on with `E2E_AUTH=1`. It is
  refused when `NODE_ENV` is `production`, so it cannot be enabled by mistake on a deployment.

## Consequences

- Visitors need a GitHub account to use the chat. That is acceptable for a demo and is easy to
  replace later by adding another provider.
- Sessions are stateless. Signing out clears the cookie but does not revoke tokens already issued;
  the lifetime is therefore kept short.
- The OAuth callback URL must be registered for every environment that serves the app.
- Real GitHub login depends on an OAuth App that has to be created by the project owner. Until it
  exists, the login flow is covered only by tests that use a stubbed session.
