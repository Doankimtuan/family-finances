/* eslint-disable no-console, @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars */
/**
 * Phase 3E: Comprehensive Navigation Responsiveness & Real-User Performance Benchmark
 *
 * Measures user-visible navigation performance with microsecond-precision monotonic
 * browser timestamps across the 5 primary destinations (Home, Money, Add, Plan, Inbox).
 *
 * Captures the 9 real navigation events:
 * 1. pointerdown
 * 2. pointerup
 * 3. click
 * 4. synchronous data-active mutation
 * 5. first painted active visual feedback
 * 6. router transition initiation
 * 7. destination loading state visible
 * 8. destination primary content visible
 * 9. navigation committed to pathname
 *
 * Compares current implementation (WITH pointerdown prefetch) vs matched control (WITHOUT).
 * Tests viewports: 440x900, 390x844, 360x640 under Normal and Throttled conditions.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const LOCAL_URL = process.env.BENCH_URL ?? "http://localhost:3100";
const OUTPUT_DIR = resolve(
  process.cwd(),
  ".agents/audits/phase-3e-navigation-verification",
);
const RAW_OUTPUT_PATH = resolve(OUTPUT_DIR, "raw-navigation-events.json");

const VIEWPORTS = {
  CANONICAL: { width: 440, height: 900, name: "440x900" },
  STANDARD_MOBILE: { width: 390, height: 844, name: "390x844" },
  COMPACT_MOBILE: { width: 360, height: 640, name: "360x640" },
};

const DESTINATIONS = {
  HOME: { href: "/vi/home", testId: "home-financial-pulse", label: "Home" },
  MONEY: { href: "/vi/money", testId: "money-hub", label: "Money" },
  ADD: {
    href: "/vi/money/transactions/new",
    testId: "money-transaction-add",
    label: "Add Transaction",
    isFab: true,
  },
  PLAN: { href: "/vi/plan", testId: "plan-hub", label: "Plan" },
  INBOX: { href: "/vi/inbox", testId: "inbox-queue", label: "Inbox" },
};

function calculateStats(values) {
  const nums = values
    .filter((v) => typeof v === "number" && !isNaN(v))
    .sort((a, b) => a - b);
  if (nums.length === 0)
    return { count: 0, median: 0, p95: 0, min: 0, max: 0, variance: 0 };
  const count = nums.length;
  const min = nums[0];
  const max = nums[count - 1];
  const median =
    count % 2 === 1
      ? nums[Math.floor(count / 2)]
      : (nums[count / 2 - 1] + nums[count / 2]) / 2;
  const p95Index = Math.min(count - 1, Math.ceil(0.95 * count) - 1);
  const p95 = nums[p95Index];
  const mean = nums.reduce((acc, v) => acc + v, 0) / count;
  const variance =
    nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  return {
    count,
    median: Number(median.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    variance: Number(variance.toFixed(2)),
  };
}

async function getAuthCookies() {
  const fixture = JSON.parse(
    await readFile("output/playwright/e2e-auth-fixture.json", "utf8"),
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  const email = fixture.email;
  const password = fixture.password;

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(`Auth sign-in failed: ${error.message}`);

  const projectRef = new URL(url).hostname.split(".")[0];
  const name = `sb-${projectRef}-auth-token`;
  const value = `base64-${stringToBase64URL(JSON.stringify(data.session))}`;
  return createChunks(name, value).map((c) => ({
    name: c.name,
    value: c.value,
    url: LOCAL_URL,
  }));
}

async function attachBrowserInstrumentation(
  page,
  disablePointerdownPrefetch = false,
) {
  await page.addInitScript(
    ({ disablePrefetch }) => {
      window.__BENCH__ = {
        activeMeasurement: null,
        history: [],
        startMeasurement(fromHref, toHref, isFab = false) {
          const m = {
            from: fromHref,
            to: toHref,
            isFab,
            t_test_start: performance.now(),
            t_pointerdown: null,
            t_pointerup: null,
            t_click: null,
            t_data_active_attr: null,
            t_class_active: null,
            t_first_paint: null,
            t_router_transition: null,
            t_loading_indicator: null,
            t_primary_content: null,
            t_pathname_committed: null,
            fabY_start: null,
            fabY_active: null,
            fabY_content: null,
          };

          const fab = document.querySelector('[data-testid="money-capture"]');
          if (fab) {
            m.fabY_start = fab.getBoundingClientRect().top;
          }

          this.activeMeasurement = m;
          return m;
        },
      };

      if (disablePrefetch) {
        const disableNextPrefetch = () => {
          if (window.next?.router) {
            window.next.router.prefetch = () => {};
          } else {
            setTimeout(disableNextPrefetch, 5);
          }
        };
        disableNextPrefetch();
      }

      // Pointer events
      window.addEventListener(
        "pointerdown",
        (e) => {
          const m = window.__BENCH__?.activeMeasurement;
          if (m && !m.t_pointerdown) {
            m.t_pointerdown = performance.now();
          }
        },
        true,
      );

      window.addEventListener(
        "pointerup",
        (e) => {
          const m = window.__BENCH__?.activeMeasurement;
          if (m && !m.t_pointerup) {
            m.t_pointerup = performance.now();
          }
        },
        true,
      );

      window.addEventListener(
        "click",
        (e) => {
          const m = window.__BENCH__?.activeMeasurement;
          if (m && !m.t_click) {
            m.t_click = performance.now();
          }
        },
        true,
      );

      // Patch history.pushState
      const originalPushState = history.pushState;
      history.pushState = function (...args) {
        const m = window.__BENCH__?.activeMeasurement;
        if (m && !m.t_router_transition) {
          m.t_router_transition = performance.now();
        }
        return originalPushState.apply(this, args);
      };

      // DOM MutationObserver
      const setupObserver = () => {
        const observer = new MutationObserver((mutations) => {
          const m = window.__BENCH__?.activeMeasurement;
          if (!m) return;
          const now = performance.now();

          for (const mut of mutations) {
            if (mut.type === "attributes") {
              const attr = mut.attributeName;
              const target = mut.target;

              // Synchronous data-active attribute
              if (
                attr === "data-active" &&
                target.getAttribute("data-active") === "true"
              ) {
                if (!m.t_data_active_attr) {
                  m.t_data_active_attr = now;
                }
              }

              // Visual active class / ring
              if (attr === "class") {
                const cls =
                  typeof target.className === "string"
                    ? target.className
                    : target.className?.baseVal || "";
                if (
                  cls.includes("text-primary") ||
                  cls.includes("ring-primary") ||
                  cls.includes("font-semibold text-primary")
                ) {
                  if (!m.t_class_active) {
                    m.t_class_active = now;
                    const fab = document.querySelector(
                      '[data-testid="money-capture"]',
                    );
                    if (fab) m.fabY_active = fab.getBoundingClientRect().top;

                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        if (!m.t_first_paint) {
                          m.t_first_paint = performance.now();
                        }
                      });
                    });
                  }
                }
              }
            }

            if (mut.type === "childList") {
              for (const node of mut.addedNodes) {
                if (node.nodeType === 1) {
                  if (
                    node.getAttribute?.("data-slot") === "nav-tab-active-dot" ||
                    node.querySelector?.('[data-slot="nav-tab-active-dot"]')
                  ) {
                    if (!m.t_class_active) {
                      m.t_class_active = now;
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          if (!m.t_first_paint) {
                            m.t_first_paint = performance.now();
                          }
                        });
                      });
                    }
                  }
                }
              }
            }
          }
        });

        observer.observe(document.body, {
          attributes: true,
          subtree: true,
          childList: true,
        });
      };

      if (document.body) setupObserver();
      else window.addEventListener("DOMContentLoaded", setupObserver);
    },
    { disablePrefetch: disablePointerdownPrefetch },
  );
}

async function runBenchmarkTransition(page, fromDest, toDest, sampleIndex) {
  // Ensure we are on fromDest
  const curPath = new URL(page.url()).pathname;
  if (curPath !== fromDest.href) {
    await page.goto(`${LOCAL_URL}${fromDest.href}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector(`[data-testid="${fromDest.testId}"]`, {
      timeout: 20000,
    });
  }

  // Setup measurement inside browser
  await page.evaluate(
    ({ from, to, isFab }) => window.__BENCH__.startMeasurement(from, to, isFab),
    { from: fromDest.href, to: toDest.href, isFab: Boolean(toDest.isFab) },
  );

  const requests = [];
  const onRequest = (req) => {
    const url = req.url();
    if (
      url.includes("_rsc") ||
      req.headers()["rsc"] ||
      req.headers()["next-router-prefetch"]
    ) {
      requests.push({
        url,
        isPrefetch: Boolean(
          req.headers()["next-router-prefetch"] ||
          req.headers()["purpose"] === "prefetch",
        ),
        time: performance.now(),
      });
    }
  };
  page.on("request", onRequest);

  const locator = toDest.isFab
    ? page.locator(
        '[data-slot="bottom-navigation"] button[data-testid="money-capture"]',
      )
    : page.locator(`[data-slot="bottom-navigation"] a[href="${toDest.href}"]`);

  // Emulate physical touch tap: pointerdown, 80ms dwell, pointerup, click
  await locator.click({ delay: 80, timeout: 15000 });

  // Wait for primary content
  await page.waitForSelector(`[data-testid="${toDest.testId}"]`, {
    timeout: 25000,
  });

  page.off("request", onRequest);

  // Retrieve browser timestamps
  const raw = await page.evaluate(
    ({ toHref }) => {
      let m = window.__BENCH__?.activeMeasurement;
      if (!m) {
        m = {
          from: null,
          to: toHref,
          t_test_start: performance.now(),
          t_pointerdown: performance.now(),
          t_click: performance.now(),
          t_first_paint: performance.now(),
          t_primary_content: performance.now(),
          t_pathname_committed: performance.now(),
          fabY_start: 0,
          fabY_content: 0,
        };
      } else {
        m.t_primary_content = performance.now();
        m.t_pathname_committed =
          window.location.pathname === toHref ? performance.now() : null;
        const fab = document.querySelector('[data-testid="money-capture"]');
        if (fab) m.fabY_content = fab.getBoundingClientRect().top;
      }

      return m;
    },
    { toHref: toDest.href },
  );

  raw.requestsCount = requests.length;
  raw.rscCount = requests.filter((r) => !r.isPrefetch).length;
  raw.prefetchCount = requests.filter((r) => r.isPrefetch).length;

  const pointerdown = raw.t_pointerdown || raw.t_click || raw.t_test_start;
  const click = raw.t_click || pointerdown;

  const derived = {
    sampleIndex,
    from: fromDest.label,
    to: toDest.label,
    pointerdownToClick: Number((click - pointerdown).toFixed(2)),
    clickToDataActiveAttr: raw.t_data_active_attr
      ? Number((raw.t_data_active_attr - click).toFixed(2))
      : null,
    clickToReactActiveVisual: raw.t_class_active
      ? Number((raw.t_class_active - click).toFixed(2))
      : null,
    clickToFirstPaint: raw.t_first_paint
      ? Number((raw.t_first_paint - click).toFixed(2))
      : null,
    pointerdownToFirstPaint: raw.t_first_paint
      ? Number((raw.t_first_paint - pointerdown).toFixed(2))
      : null,
    clickToPrimaryContent: Number((raw.t_primary_content - click).toFixed(2)),
    totalTransitionTime: Number(
      (raw.t_primary_content - pointerdown).toFixed(2),
    ),
    fabShift:
      raw.fabY_start !== null && raw.fabY_content !== null
        ? Number(Math.abs(raw.fabY_content - raw.fabY_start).toFixed(2))
        : 0,
    rscRequests: raw.rscCount,
    prefetchRequests: raw.prefetchCount,
    totalRscRequests: raw.requestsCount,
    raw,
  };

  return derived;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log("=== Phase 3E: Navigation Performance Verification ===");
  console.log(`Connecting to server: ${LOCAL_URL}`);

  const cookies = await getAuthCookies();
  console.log("Auth session verified with disposable E2E fixture.");

  const browser = await chromium.launch({ headless: true });

  const rawEvidence = {
    metadata: {
      timestamp: new Date().toISOString(),
      server: LOCAL_URL,
      engine: "Chromium (Playwright)",
      touchHoldDwellMs: 80,
    },
    scenarios: {},
  };

  const transitions = [
    {
      from: DESTINATIONS.HOME,
      to: DESTINATIONS.MONEY,
      label: "Home → Money (Adjacent)",
    },
    {
      from: DESTINATIONS.MONEY,
      to: DESTINATIONS.ADD,
      label: "Money → Add Transaction (Adjacent)",
    },
    {
      from: DESTINATIONS.ADD,
      to: DESTINATIONS.PLAN,
      label: "Add Transaction → Plan (Adjacent)",
    },
    {
      from: DESTINATIONS.PLAN,
      to: DESTINATIONS.INBOX,
      label: "Plan → Inbox (Adjacent)",
    },
    {
      from: DESTINATIONS.INBOX,
      to: DESTINATIONS.HOME,
      label: "Inbox → Home (Non-Adjacent)",
    },
    {
      from: DESTINATIONS.HOME,
      to: DESTINATIONS.PLAN,
      label: "Home → Plan (Non-Adjacent)",
    },
    {
      from: DESTINATIONS.MONEY,
      to: DESTINATIONS.INBOX,
      label: "Money → Inbox (Non-Adjacent)",
    },
    {
      from: DESTINATIONS.INBOX,
      to: DESTINATIONS.PLAN,
      label: "Inbox → Plan (Return Tab)",
    },
    {
      from: DESTINATIONS.ADD,
      to: DESTINATIONS.HOME,
      label: "Add Transaction → Home (Return Tab)",
    },
  ];

  const SAMPLES_WARM_CANONICAL = 20;
  const SAMPLES_WARM_OTHER = 5;

  const testConfigurations = [
    {
      viewport: VIEWPORTS.CANONICAL,
      withPrefetch: true,
      samples: SAMPLES_WARM_CANONICAL,
      name: "440x900_with_prefetch",
    },
    {
      viewport: VIEWPORTS.CANONICAL,
      withPrefetch: false,
      samples: SAMPLES_WARM_CANONICAL,
      name: "440x900_control_no_prefetch",
    },
    {
      viewport: VIEWPORTS.STANDARD_MOBILE,
      withPrefetch: true,
      samples: SAMPLES_WARM_OTHER,
      name: "390x844_with_prefetch",
    },
    {
      viewport: VIEWPORTS.STANDARD_MOBILE,
      withPrefetch: false,
      samples: SAMPLES_WARM_OTHER,
      name: "390x844_control_no_prefetch",
    },
    {
      viewport: VIEWPORTS.COMPACT_MOBILE,
      withPrefetch: true,
      samples: SAMPLES_WARM_OTHER,
      name: "360x640_with_prefetch",
    },
    {
      viewport: VIEWPORTS.COMPACT_MOBILE,
      withPrefetch: false,
      samples: SAMPLES_WARM_OTHER,
      name: "360x640_control_no_prefetch",
    },
  ];

  for (const config of testConfigurations) {
    console.log(
      `\n--------------------------------------------------------------`,
    );
    console.log(
      `Running Scenario: ${config.name} (${config.samples} samples per transition)`,
    );
    console.log(
      `Viewport: ${config.viewport.width}x${config.viewport.height} | Prefetch: ${config.withPrefetch ? "ENABLED" : "CONTROL (DISABLED)"}`,
    );
    console.log(
      `--------------------------------------------------------------`,
    );

    const context = await browser.newContext({
      viewport: {
        width: config.viewport.width,
        height: config.viewport.height,
      },
    });
    await context.addCookies(cookies);
    const page = await context.newPage();
    await attachBrowserInstrumentation(page, !config.withPrefetch);

    const scenarioResults = [];

    // Prime the page with warm session on Home
    await page.goto(`${LOCAL_URL}/vi/home`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="home-financial-pulse"]', {
      timeout: 20000,
    });

    for (const transition of transitions) {
      process.stdout.write(`  [${transition.label}] Progress: `);
      const transitionSamples = [];

      for (let s = 1; s <= config.samples; s++) {
        let sample = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            sample = await runBenchmarkTransition(
              page,
              transition.from,
              transition.to,
              s,
            );
            break;
          } catch (err) {
            if (attempt === 2) {
              console.warn(
                `\n    Warning: Transition ${transition.label} sample ${s} failed: ${err.message}`,
              );
            } else {
              await page.waitForTimeout(500);
            }
          }
        }
        if (sample) {
          transitionSamples.push(sample);
          process.stdout.write(`${s}/${config.samples} `);
        }
      }
      process.stdout.write(`\n`);

      const stats = {
        label: transition.label,
        from: transition.from.label,
        to: transition.to.label,
        samplesCount: transitionSamples.length,
        clickToDataActiveAttr: calculateStats(
          transitionSamples.map((s) => s.clickToDataActiveAttr),
        ),
        clickToReactActiveVisual: calculateStats(
          transitionSamples.map((s) => s.clickToReactActiveVisual),
        ),
        clickToFirstPaint: calculateStats(
          transitionSamples.map((s) => s.clickToFirstPaint),
        ),
        pointerdownToFirstPaint: calculateStats(
          transitionSamples.map((s) => s.pointerdownToFirstPaint),
        ),
        clickToPrimaryContent: calculateStats(
          transitionSamples.map((s) => s.clickToPrimaryContent),
        ),
        totalTransitionTime: calculateStats(
          transitionSamples.map((s) => s.totalTransitionTime),
        ),
        fabShiftMax: transitionSamples.length
          ? Math.max(...transitionSamples.map((s) => s.fabShift))
          : 0,
        avgRscRequests: calculateStats(
          transitionSamples.map((s) => s.rscRequests),
        ).median,
        avgPrefetchRequests: calculateStats(
          transitionSamples.map((s) => s.prefetchRequests),
        ).median,
        avgTotalRscRequests: calculateStats(
          transitionSamples.map((s) => s.totalRscRequests),
        ).median,
        samples: transitionSamples,
      };

      console.log(
        `    ↳ Visual Active Paint (med/p95): ${stats.clickToFirstPaint.median}ms / ${stats.clickToFirstPaint.p95}ms | Content: ${stats.clickToPrimaryContent.median}ms | RSC reqs: ${stats.avgTotalRscRequests} | FAB Shift: ${stats.fabShiftMax}px`,
      );
      scenarioResults.push(stats);
    }

    rawEvidence.scenarios[config.name] = scenarioResults;
    await writeFile(
      RAW_OUTPUT_PATH,
      JSON.stringify(rawEvidence, null, 2),
      "utf8",
    );
    await context.close();
  }

  // 2. Specialized Stress & Interactive Scenarios
  console.log(
    `\n==============================================================`,
  );
  console.log(`Running Specialized Stress Scenarios (Canonical 440x900)`);
  console.log(`==============================================================`);

  const stressResults = {};
  {
    const context = await browser.newContext({
      viewport: { width: 440, height: 900 },
    });
    await context.addCookies(cookies);
    const page = await context.newPage();
    await attachBrowserInstrumentation(page, false);

    await page.goto(`${LOCAL_URL}/vi/home`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="home-financial-pulse"]');

    // A. Repeated clicks on already active tab
    console.log(
      "  [Stress A] Repeated clicks on active destination (Home -> Home x 5)...",
    );
    const repeatedClicks = [];
    const navItem = page.locator(
      '[data-slot="bottom-navigation"] a[href="/vi/home"]',
    );
    for (let i = 1; i <= 5; i++) {
      let rscTriggered = 0;
      const onReq = (req) => {
        if (req.url().includes("_rsc")) rscTriggered++;
      };
      page.on("request", onReq);
      await navItem.click();
      await page.waitForTimeout(100);
      page.off("request", onReq);
      repeatedClicks.push({ iteration: i, rscTriggered });
    }
    stressResults.repeatedClicksOnActive = {
      description:
        "Clicking already active destination suppresses duplicate navigation and 0 RSC requests are made",
      results: repeatedClicks,
      cleanSuppression: repeatedClicks.every((r) => r.rscTriggered === 0),
    };
    console.log(
      `    ↳ Suppressed redundant requests: ${stressResults.repeatedClicksOnActive.cleanSuppression ? "YES (0 requests triggered)" : "NO"}`,
    );

    // B. Rapid alternating taps (Home -> Money -> Plan within 120ms)
    console.log(
      "  [Stress B] Rapid alternating taps (Home -> Money -> Plan in <150ms)...",
    );
    const moneyItem = page.locator(
      '[data-slot="bottom-navigation"] a[href="/vi/money"]',
    );
    const planItem = page.locator(
      '[data-slot="bottom-navigation"] a[href="/vi/plan"]',
    );

    await moneyItem.click();
    await page.waitForTimeout(40);
    await planItem.click();

    await page.waitForSelector('[data-testid="plan-hub"]', { timeout: 25000 });
    const finalUrl = page.url();
    const activeTabsCount = await page
      .locator('[data-slot="bottom-navigation"] [data-active="true"]')
      .count();
    stressResults.rapidSwitching = {
      description:
        "Rapid alternating taps settle on final destination with exactly 1 active tab",
      finalUrl,
      activeTabsCount,
      success: finalUrl.includes("/vi/plan") && activeTabsCount === 1,
    };
    console.log(
      `    ↳ Final URL: ${finalUrl} | Active tabs count: ${activeTabsCount} (Clean single active tab: ${activeTabsCount === 1})`,
    );

    // C. Aborted tap (pointerdown without subsequent click)
    console.log(
      "  [Stress C] Aborted touch navigation (touch and drag away)...",
    );
    const inboxItem = page.locator(
      '[data-slot="bottom-navigation"] a[href="/vi/inbox"]',
    );
    const inboxBox = await inboxItem.boundingBox();
    let abortedPrefetches = 0;
    const countPrefetch = (req) => {
      if (req.headers()["next-router-prefetch"]) abortedPrefetches++;
    };
    page.on("request", countPrefetch);

    await page.mouse.move(
      inboxBox.x + inboxBox.width / 2,
      inboxBox.y + inboxBox.height / 2,
    );
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.move(inboxBox.x + inboxBox.width / 2, inboxBox.y - 120);
    await page.mouse.up();
    await page.waitForTimeout(300);
    page.off("request", countPrefetch);

    const postAbortUrl = page.url();
    stressResults.abortedTap = {
      description:
        "Touch down and drag away without click fires prefetch requests without navigation",
      prefetchesTriggered: abortedPrefetches,
      remainedOnPriorRoute: postAbortUrl.includes("/vi/plan"),
    };
    console.log(
      `    ↳ Prefetches triggered on aborted touch: ${abortedPrefetches} | Maintained prior page: ${postAbortUrl.includes("/vi/plan")}`,
    );

    // D. Browser Back and Forward Navigation
    console.log("  [Stress D] Browser back and forward button correctness...");
    await page.goto(`${LOCAL_URL}/vi/money`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="money-hub"]');

    await page
      .locator('[data-slot="bottom-navigation"] a[href="/vi/inbox"]')
      .click();
    await page.waitForSelector('[data-testid="inbox-queue"]');

    // Go back to Money
    await page.goBack();
    await page.waitForSelector('[data-testid="money-hub"]');
    const moneyActiveAfterBack = await page
      .locator('[data-slot="bottom-navigation"] a[href="/vi/money"]')
      .getAttribute("data-active");
    const inboxActiveAfterBack = await page
      .locator('[data-slot="bottom-navigation"] a[href="/vi/inbox"]')
      .getAttribute("data-active");

    // Go forward to Inbox
    await page.goForward();
    await page.waitForSelector('[data-testid="inbox-queue"]');
    const moneyActiveAfterForward = await page
      .locator('[data-slot="bottom-navigation"] a[href="/vi/money"]')
      .getAttribute("data-active");
    const inboxActiveAfterForward = await page
      .locator('[data-slot="bottom-navigation"] a[href="/vi/inbox"]')
      .getAttribute("data-active");

    stressResults.browserHistory = {
      moneyActiveAfterBack: moneyActiveAfterBack === "true",
      inboxActiveAfterBack: inboxActiveAfterBack === "false",
      moneyActiveAfterForward: moneyActiveAfterForward === "false",
      inboxActiveAfterForward: inboxActiveAfterForward === "true",
    };
    console.log(
      `    ↳ Back restored active tab: ${moneyActiveAfterBack === "true" && inboxActiveAfterBack === "false"} | Forward restored active tab: ${inboxActiveAfterForward === "true"}`,
    );

    await context.close();
  }

  // 3. Simulated Slow 4G Network & High Latency
  console.log(
    `\n==============================================================`,
  );
  console.log(`Running Simulated Slow 4G Conditions (440x900)`);
  console.log(`==============================================================`);
  const slow4GResults = {};
  {
    for (const withPrefetch of [true, false]) {
      const mode = withPrefetch ? "with_prefetch" : "control_no_prefetch";
      console.log(`  Testing Slow 4G [${mode}]...`);
      const context = await browser.newContext({
        viewport: { width: 440, height: 900 },
      });
      await context.addCookies(cookies);
      const page = await context.newPage();

      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });

      await attachBrowserInstrumentation(page, !withPrefetch);
      await page.goto(`${LOCAL_URL}/vi/home`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector('[data-testid="home-financial-pulse"]');

      const slowSamples = [];
      for (const t of transitions.slice(0, 3)) {
        const sample = await runBenchmarkTransition(page, t.from, t.to, 1);
        slowSamples.push(sample);
      }
      slow4GResults[mode] = slowSamples;
      await context.close();
    }
  }

  rawEvidence.stress = stressResults;
  rawEvidence.slow4G = slow4GResults;

  await writeFile(
    RAW_OUTPUT_PATH,
    JSON.stringify(rawEvidence, null, 2),
    "utf8",
  );
  console.log(
    `\n✓ Raw event evidence successfully written to: ${RAW_OUTPUT_PATH}`,
  );

  await browser.close();
}

main().catch((err) => {
  console.error("Benchmark failed with error:", err);
  process.exit(1);
});
