# vet-portal

A web portal for a fictional veterinary clinic: customers chat with an AI agent and manage appointments through a GraphQL API.

> **Status:** planned, not started. This README describes the intended scope.

## Purpose

Show full stack TypeScript work with Next.js and GraphQL on top of an existing backend (the [vet-agent](https://github.com/vinera-dev/vet-agent) REST API). All data is fictional.

## Planned scope

- Next.js app with a chat interface for the agent, including session history
- Appointment calendar: list free slots, book, reschedule and cancel
- GraphQL gateway that wraps the REST API with typed schemas and error handling
- Authentication and protected routes
- Accessible, responsive UI
- End-to-end tests of the main flows

## Planned stack

TypeScript, Next.js, React, GraphQL, Playwright, Jest, GitHub Actions.

## Roadmap

- [ ] 1. Next.js skeleton, tests and CI
- [ ] 2. GraphQL gateway over the vet-agent API
- [ ] 3. Appointment calendar
- [ ] 4. Agent chat interface
- [ ] 5. Authentication
- [ ] 6. End-to-end tests and deployment

## License

Released under the [MIT License](LICENSE).
