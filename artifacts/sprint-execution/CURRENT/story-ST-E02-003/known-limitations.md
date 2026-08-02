# ST-E02-003 — Known Limitations

1. **Register happy-path e2e not automated** — Creating real users needs disposable Auth credentials / project settings; smoke covers UI + chrome + links. Confirm-after-signup path is covered in unit (`next: "confirm"`).
2. **Password reset does not include a set-new-password screen** — Email link exchanges via `/auth/confirm` then lands on login (`next=/login`). A dedicated update-password UI is out of S1 scope.
3. **Email enumeration** — Forgot-password surfaces Auth/config errors honestly when unconfigured; when Auth is up, success toast is shown on accepted send (Supabase may still accept unknown emails depending on project settings).
4. **Supabase dashboard** — Redirect URLs must include `/auth/confirm` for register/recovery emails (see planning blocker B-ENV-02).
