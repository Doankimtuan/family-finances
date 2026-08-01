# Future Risks (6–12 months)

| Risk | Why it causes rewrite pressure | Guard |
|------|-------------------------------|-------|
| Reintroducing desktop sidebar | Breaks Mobile Native SoT | Design Checklist + review |
| Offline write cache | Violates BR-15 permanently | Codeowners reject |
| Parallel domain logic in Actions bypassing services | Strangler debt | Architecture Coding Rules |
| Mixing UI kits / Lucide | DS violation | Dependency allowlist |
| Jar labeled as Balance | BR-01 regression | Playwright real≠virtual |
| Premature microservices | Candidate C forbidden | Architecture Decision freeze |
