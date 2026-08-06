# Recommendations

1. Start Sprint 1 with E01 bootstrap before any Money/Plan UI.  
2. Codify import lint: ban `archive/legacy-v1`; prefer `shared/*`.  
3. Add Playwright stubs early for AC-018/019 paths.  
4. Keep Architecture SoT untouched; document `components/`→`shared/ui` in eng handbook (already in Design Foundation).  
5. Schema review before S3 against live `supabase/migrations`.  
6. Introduce i18n key discipline by end of S2.  
7. Wire structured logging + request_id in shell; Sentry before MVP release.  
