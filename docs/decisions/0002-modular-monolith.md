# 0002. Keep TTB Studio a modular monolith

Recorded: 2026-11-06

## Status

Accepted (retrospective record of an established target architecture).

## Context

TTB needs projects, request planning, model orchestration and eventual editing
and exports. GPU inference has different resource needs from the web app.
[Target architecture](../ARCHITECTURE.md) explicitly distinguishes modules from
separate product services. The original evaluation history is not documented.

## Decision

The project chose one deployable TTB API organized into modules, with heavy
inference allowed in an out-of-process GPU worker. It did not choose one
microservice per feature. Most processing modules remain unimplemented.

## Consequences

This avoids a service boundary for every feature while permitting GPU resources
to run separately. Modules share deployment and require disciplined internal
boundaries. Worker calls still need durable job state, cancellation, retries,
idempotency and resource limits; a process boundary does not supply these.

## Alternatives

Per-feature microservices offer separate scaling but add distributed coordination
and conflict with the documented monolith constraint. In-process GPU inference
avoids worker transport but ties web availability and resources to model work.
These trade-offs are retrospective analysis, not recorded historical trials.
