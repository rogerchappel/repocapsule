# Security Policy

## Supported Versions

RepoCapsule is pre-1.0. Security fixes are made on main until versioned releases begin.

## Reporting a Vulnerability

Please do not report suspected vulnerabilities in public issues, pull requests, or discussions. Use GitHub private vulnerability reporting when it is available for the repository. If it is not available, ask for a private reporting path without including exploit details, secrets, personal data, or sensitive technical details.

## Scope

In scope:

- Redaction bypasses in RepoCapsule defaults.
- Unsafe file inclusion defaults.
- CLI behavior that uploads, transmits, or exposes data unexpectedly.
- CI or release configuration maintained by this repository.

Out of scope:

- Secrets that were intentionally added to a user include pattern and shared without review.
- Vulnerabilities in unrelated projects scanned by RepoCapsule.
- General support requests.

## Safety Expectations

RepoCapsule is designed to reduce accidental disclosure, not to prove a repository contains no secrets. Always review generated capsules before sharing them outside your machine.
