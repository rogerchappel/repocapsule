# Bug Report Capsule Example

Use this workflow when a maintainer asks for a small, reviewable repository snapshot with command output.

```sh
repocapsule init
repocapsule scan --cmd "npm test" --markdown .repocapsule/report.md
repocapsule report --input .repocapsule/capsule.json --output .repocapsule/report.md
```

Before sharing, open both generated files and confirm the included paths, package metadata, and command logs are safe to disclose.

The bundled `fixtures/sample-repo` directory is intentionally tiny so package consumers can run a smoke locally after install:

```sh
repocapsule scan --root ./fixtures/sample-repo --output /tmp/capsule.json --markdown /tmp/capsule.md
```
