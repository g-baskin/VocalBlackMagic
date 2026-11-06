# 0001. Preserve two independent product apps

Recorded: 2026-11-06

## Status

Accepted (retrospective record of existing constraints).

## Context

[Product structure](../PRODUCT_SPEC.md) separates authorized reference intake
from music creation. [Architecture](../ARCHITECTURE.md) requires separate
permissions and no implicit voice-data transfer. Original decision date and
participants are not recorded.

## Decision

The project chose independently runnable Vocal Fix and TTB Studio apps in one
repository. Shared UI and contracts do not merge their workflows. Reference
transfer requires explicit recording and identity rights checks.

## Consequences

Independent surfaces preserve product boundaries and permit separate deployment.
They also require maintaining two app configurations and explicit cross-product
handoffs. Separation alone provides neither authentication nor tenant isolation.

## Alternatives

A single merged UI could reduce duplicated setup, but conflicts with the explicit
product boundary. Fully separate repositories could isolate releases further but
would complicate shared-contract changes. These are retrospective comparisons;
no historical evaluation of either option is documented.
