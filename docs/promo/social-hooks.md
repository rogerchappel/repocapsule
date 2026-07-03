# RepoCapsule Social Hooks

Ground each post in the sample fixture and the `demo/run-sample-capsule.sh`
workflow.

## Short posts

1. Bug reports get easier when the repo context is small, local, and reviewed.
   RepoCapsule turns a checkout into deterministic JSON plus Markdown, with
   command logs and redaction checks before you share.

2. New demo for RepoCapsule: copy a fixture repo, capture a command log, render
   Markdown, then verify the fixture token did not leak. No network call
   required.

3. Agent handoffs should include enough evidence to debug without dumping an
   entire repository. RepoCapsule packages selected files, git facts, package
   metadata, and command output into an inspectable local report.

## Video angle

- Open with an issue comment that needs repo context.
- Run `bash demo/run-sample-capsule.sh`.
- Show `capsule.json` for deterministic structure.
- Show `report.md` for human review.
- End on the limitation: review the capsule before attaching it anywhere.
