# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.smoke.spec.ts >> Login + money gates (ST-E02-002) >> confirm error UI offers continue to login
- Location: tests/e2e/login.smoke.spec.ts:39:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at /var/folders/tc/837jq90d23qbm4r36f_nnxkm0000gn/T/cursor-sandbox-cache/54dc857e7ac13024f25a879936441919/playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```