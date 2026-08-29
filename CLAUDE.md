# CLAUDE.md

This project keeps all agent instructions in **[AGENTS.md](./AGENTS.md)** so that every
agent tool reads the same rules. Read that file first.

Instructions are nested — the `AGENTS.md` closest to the file you are editing wins:

- `AGENTS.md` — repo-wide architecture, commands, and federation invariants
- `packages/shell/AGENTS.md` — the host application
- `packages/{home,records,prescriptions,analytics}/AGENTS.md` — the four remotes

Skills are nested the same way: repo-wide skills live in `.agents/skills/`, and
package-specific skills live in `packages/<name>/.agents/skills/`.
