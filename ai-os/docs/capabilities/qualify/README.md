# Capability — `qualify`

**Title:** Qualify  
**Pipeline:** `qualification-framework`  
**Board decision:** MERGE

## Purpose

Benchmark, metrics, certification, release Go/No-Go

## @Run commands

- `@Run benchmark`

## Implementation workers (packaging detail)

- `reference-project-catalog`
- `benchmark-runner`
- `qualification-runner`
- `evaluation-engine`
- `stress-test-runner`
- `metrics-engine`
- `coverage-analyzer`
- `regression-runner`
- `certification-engine`
- `release-qualification-board`

## Future simplification

Merge evaluation+metrics+coverage into quality-metrics; merge stress+regression into resilience-bench

