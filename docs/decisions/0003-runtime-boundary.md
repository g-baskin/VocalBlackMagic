# 0003. Use SvelteKit and Bun with private Python audio workers

Recorded: 2026-11-06

## Status

Accepted (retrospective record of the documented SaaS migration).

## Context

The repository began with Python/FastAPI prototypes and browser pages.
[SaaS stack](../SAAS_STACK.md) documents the move to two Svelte frontends and
Docker-free operation. The original framework comparison and selection rationale
beyond those stated constraints are not recorded.

## Decision

The project selected Svelte 5, SvelteKit 3 and Bun for both user-facing apps,
sharing workspace contracts and UI. Python APIs remain localhost-only
prototypes; extraction into a private GPU audio worker is planned. Docker is
optional, not a runtime requirement. Production audio bridges remain blocked
until authentication, tenant ownership and billing safeguards are integrated.

## Consequences

Web apps can run without a GPU backend or Docker. Python remains available for
model execution. Maintaining two runtimes requires separate dependency and test
environments and matching wire contracts. Current production builds do not
provide working public uploads, generation or authentication.

## Alternatives

Keeping FastAPI browser pages as the primary UI would avoid a second runtime but
does not match the documented SaaS migration. A mandatory container stack would
standardize packaging but contradict Docker-free operation. Moving inference
into Bun would reduce language boundaries but has no verified model integration
here. These are current comparisons, not evidence of historical evaluations.
