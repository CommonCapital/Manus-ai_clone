# Contributing

Thanks for considering a contribution.

## Development setup

1. Fork and clone the repo.
2. Follow the [Setup](README.md#setup) section in the README to get a working local environment.
3. Create a branch off `main`: `git checkout -b your-feature-name`.

## Making changes

- Keep pull requests focused — one feature or fix per PR is easier to review than a bundle.
- Match the existing code style; run `npm run lint` before opening a PR.
- If you add or change an agent tool, update its `description` (the LLM reads this to decide when
  to use it) and, if relevant, the system prompts in [`src/lib/deepAgent/prompts.ts`](src/lib/deepAgent/prompts.ts).
- If you add a new skill under `public/skills/`, add a `SKILL.md` and register it in
  `public/skills/README.md`.

## Reporting issues

Open a GitHub issue with:
- What you expected to happen vs. what actually happened
- Steps to reproduce
- Relevant logs (redact any API keys)

## Pull requests

1. Push your branch and open a PR against `main`.
2. Describe what changed and why.
3. Link any related issue.

By contributing, you agree your contributions will be licensed under this project's
[MIT License](LICENSE).
