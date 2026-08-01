# Test cases — `dependency-resolver`

| Case | Intent |
|------|--------|
| case-01-happy-path | Valid runtime plan |
| case-02-missing-config | UNKNOWN when .ai-os.yaml absent |
| case-03-circular-deps | critical circular-rejection |
| case-04-raci-violation | fail on foreign entry_kind |
| case-05-worker-mutation | veto if mutate_workers true |
