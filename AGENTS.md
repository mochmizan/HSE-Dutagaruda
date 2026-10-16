# viaannn — prod build root (new project, OpenCode conventions)

## Scope

Spec-driven rebuild of the HSE Inspection Platform. Spec in `spec/` is binding.
No code until the owner approves the spec.

## Conventions (OpenCode only; ignore Cursor/other-harness specifics)

- Work only inside `D:\dev\viaannn`.
- Indonesian K3 labels in all user-facing UI. `tabular-nums` on numbers/dates.
- TypeScript strict, zero-error builds. `bun run build` per package.
- ctx7 CLI (`npx ctx7@latest docs <id> <query>`) to verify library signatures.
- Modals: Esc + backdrop close. Dark mode everywhere.
- Workers: `worker`-type subagents briefed with the poteto playbooks
  (`D:\marketplace\pstack-opencode\poteto-mode\SKILL.md`, `agents\poteto-agent.md`)
  minus Cursor-specific tooling. Spec gates in `spec/07-build-order.md` are law:
  no stream starts before its gate is green.

## Layout

`apps/web` (Vite+React) · `apps/api` (Hono+Drizzle+Better Auth) ·
`packages/shared` (DTOs, calculators, dates) · `infra/` (compose) · `spec/` ·
`wiki/` (verification skill `SKILL.md`, feature map `features/`, helpers;
proof `artifacts/` git-ignored).