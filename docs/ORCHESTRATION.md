# Orchestration

RepoCapsule is local-first. Agents and maintainers should run it inside the repository they want to summarize, inspect the generated capsule, then attach or paste only the reviewed output.

## Agent Flow

1. Run repocapsule init if the target repo does not have repocapsule.config.json.
2. Edit include and exclude patterns until the capsule contains only relevant files.
3. Run repocapsule scan --markdown .repocapsule/report.md.
4. Review .repocapsule/capsule.json and .repocapsule/report.md before sharing.
5. Use repocapsule record --cmd "npm test" when a failing command log is useful.

## Safety Rules

- Do not upload capsules automatically.
- Do not disable redaction for public bug reports.
- Prefer narrow include patterns for fixtures and source files.
- Keep command logs short and reproducible.
- Re-run the capsule after changing config so JSON and Markdown stay in sync.

## Local Gates

Use these before releasing or handing work to another agent:

- npm test
- npm run check
- npm run build
- npm run smoke
- bash scripts/validate.sh
