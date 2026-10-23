// Dev-only: full-page screenshots of the explorer against the mock subgraph.
// Usage: node scripts/mock/screenshot.mjs [--base http://localhost:3000] [--only portfolio,orchestrators] [--out DIR]
// Uses the globally installed `playwright` package and the browsers in $PLAYWRIGHT_BROWSERS_PATH.

import { execSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import {
  decodeFunctionData,
  encodeFunctionResult,
  multicall3Abi,
  toFunctionSelector,
} from "viem";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg("base", "http://localhost:3000").replace(/\/$/, "");
const ONLY = arg("only", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const OUT = arg(
  "out",
  "/tmp/claude-0/-home-user-explorer/298d5e51-8f56-5415-945e-f5cba722332b/scratchpad/shots"
);
const MOCK = arg("mock", "http://localhost:4010");
const SETTLE_MS = Number(arg("settle", 800));

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    const root = execSync("npm root -g").toString().trim();
    return require(path.join(root, "playwright"));
  }
}

function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  const dirs = fs.existsSync(base) ? fs.readdirSync(base) : [];
  for (const d of dirs
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort()
    .reverse()) {
    const bin = path.join(base, d, "chrome-linux", "chrome");
    if (fs.existsSync(bin)) return bin;
  }
  return undefined; // let Playwright resolve it
}

const WALLET = "0x22b544d19ffe43c6083327271d9f39020da30c65";
const WATCHED = "0x6a7b132393431e2b83af171b4e6e5bf54c091421";
const ORCH = "0x8b578b413186cd75590372acacb6fac64e9ead12";
const WATCHLIST = [
  { address: WALLET, label: "Main wallet" },
  { address: WATCHED, label: "Cold storage" },
  { address: ORCH, label: "My orchestrator" },
];

// Orchestrator B (where the demo wallet is bonded) comes from the mock itself.
async function demoIds() {
  try {
    const res = await fetch(`${MOCK}/health`);
    return (await res.json()).demo;
  } catch {
    return {
      B: "0xb29178bd5e0da702ab69129048af7b9fcf222026",
      gateway: "0x3f1c7a9e5b2d4c6e8a0b1d3f5e7c9a2b4d6f8e01",
      selfGateway: "0x8424e9f716c4a85cb2ff93b46941e1cc5c9fcdc7",
    };
  }
}

const CONTROLLER = "0xd8e8328501e9645d16cf49539efc04f734606ee4";
const GET_CONTRACT = toFunctionSelector("getContract(bytes32)");
const AGGREGATE3 = toFunctionSelector("aggregate3((address,bool,bytes)[])");
let CONTRACTS = {};
/** Contract name → address (lowercase), for reads beyond the registry. */
let NAMED = {};

const GET_THRESHOLD = toFunctionSelector("getThreshold()");
const BALANCE_OF = toFunctionSelector("balanceOf(address)");
const PROPOSAL_THRESHOLD = toFunctionSelector("proposalThreshold()");
const POLL_CREATION_COST = toFunctionSelector("POLL_CREATION_COST()");
const uint = (n) => "0x" + n.toString(16).padStart(64, "0");
const LPT = 10n ** 18n;
const POLL_CREATOR = "0x8bb50806d60c492c0004dad5d9627daa2d9732e6";

// Pollable LIPs, as /api/governance/lips would read them from GitHub.
const LIPS = {
  commit: "4f3c2a1e9b7d6c5a4f3e2d1c0b9a8f7e6d5c4b3a",
  lips: [
    {
      lip: "103",
      title: "Treasury contribution percentage cap",
      created: "2026-08-14",
      url: "https://github.com/livepeer/LIPS/blob/master/LIPs/LIP-103.md",
    },
    {
      lip: "102",
      title: "Reduce the unbonding period to 5 rounds",
      created: "2026-07-30",
      url: "https://github.com/livepeer/LIPS/blob/master/LIPs/LIP-102.md",
    },
  ],
};
// The watched "Cold storage" wallet is a 2-of-3 Safe (see the mock's Safe
// gateway fixtures).
const SAFE = "0x6a7b132393431e2b83af171b4e6e5bf54c091421";

/**
 * The only reads served: Controller.getContract(name hash) → address, and
 * the Safe's getThreshold. Everything else fails, as if the RPC were down.
 */
function controllerCall(to, data) {
  const target = to?.toLowerCase();
  if (target === SAFE && data?.startsWith(GET_THRESHOLD))
    return "0x" + "2".padStart(64, "0");
  if (target === POLL_CREATOR && data?.startsWith(POLL_CREATION_COST))
    return uint(100n * LPT);
  if (
    target === NAMED.LivepeerToken &&
    data?.startsWith(BALANCE_OF) &&
    data.slice(34).toLowerCase() === NAMED.Treasury?.slice(2)
  )
    return uint(1_284_512n * LPT);
  // Unstaked LPT in the main wallet, for the portfolio's delegate prompt.
  if (
    target === NAMED.LivepeerToken &&
    data?.startsWith(BALANCE_OF) &&
    data.slice(34).toLowerCase() === WALLET.slice(2)
  )
    return uint(1_240n * LPT);
  if (target === NAMED.LivepeerGovernor && data?.startsWith(PROPOSAL_THRESHOLD))
    return uint(100n * LPT);
  if (target !== CONTROLLER || !data?.startsWith(GET_CONTRACT)) return null;
  const addr = CONTRACTS["0x" + data.slice(10, 74)];
  return addr ? "0x" + addr.slice(2).padStart(64, "0") : null;
}

const COINGECKO = {
  livepeer: { usd: 6.42, usd_24h_change: 1.8 },
  ethereum: { usd: 3120.5 },
};

async function main() {
  const { chromium } = loadPlaywright();
  const { B, gateway, selfGateway } = await demoIds();
  CONTRACTS = await fetch(`${MOCK}/contracts`)
    .then((r) => r.json())
    .catch(() => ({}));
  NAMED = await fetch(`${MOCK}/contracts?names=1`)
    .then((r) => r.json())
    .catch(() => ({}));

  const pages = [
    { name: "portfolio", path: "/", watchlist: true },
    { name: "onboarding", path: "/", watchlist: false },
    { name: "account", path: `/accounts/${WATCHED}`, watchlist: true },
    { name: "orchestrators", path: "/orchestrators", watchlist: true },
    { name: "orchestrator", path: `/orchestrators/${B}`, watchlist: true },
    { name: "gateways", path: "/gateways", watchlist: true },
    { name: "gateway", path: `/gateways/${gateway}`, watchlist: true },
    {
      name: "gateway-self",
      path: `/gateways/${selfGateway}`,
      watchlist: true,
    },
    { name: "network", path: "/network", watchlist: true },
    { name: "governance", path: "/governance", watchlist: true },
    { name: "poll-new", path: "/governance/polls/new", watchlist: true },
    {
      name: "proposal-new",
      path: "/governance/proposals/new",
      watchlist: true,
    },
    { name: "activity", path: "/activity", watchlist: true },
    // The unstaked-LPT prompt's dialog, pre-filled with the idle balance.
    {
      name: "delegate-idle",
      path: "/",
      watchlist: true,
      click: /^Delegate to /,
    },
  ];
  const variants = [
    {
      key: "desktop-dark",
      viewport: { width: 1440, height: 900 },
      theme: "dark",
    },
    {
      key: "desktop-light",
      viewport: { width: 1440, height: 900 },
      theme: "light",
    },
    {
      key: "mobile-dark",
      viewport: { width: 390, height: 844 },
      theme: "dark",
      mobile: true,
      pages: [
        "portfolio",
        "orchestrators",
        "gateways",
        "gateway",
        "activity",
        "network",
      ],
    },
  ];

  const jobs = [];
  for (const v of variants) {
    for (const p of pages) {
      if (v.pages && !v.pages.includes(p.name)) continue;
      const id = `${p.name}-${v.key}`;
      if (ONLY.length && !ONLY.some((o) => id.includes(o))) continue;
      jobs.push({ id, page: p, variant: v });
    }
  }

  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: findChromium(),
    headless: true,
  });
  const report = [];

  for (const { id, page: p, variant: v } of jobs) {
    const context = await browser.newContext({
      viewport: v.viewport,
      deviceScaleFactor: v.mobile ? 2 : 1,
      isMobile: Boolean(v.mobile),
      hasTouch: Boolean(v.mobile),
      colorScheme: v.theme,
    });
    await context.addInitScript(
      ({ theme, watchlist }) => {
        try {
          if (!sessionStorage.getItem("__seeded")) {
            localStorage.clear();
            localStorage.setItem("theme", theme);
            if (watchlist)
              localStorage.setItem(
                "livepeer-explorer.watchlist",
                JSON.stringify(watchlist)
              );
            sessionStorage.setItem("__seeded", "1");
          }
        } catch {}
        // Hide the Next.js dev-tools badge; it overlaps the sidebar footer.
        document.addEventListener("DOMContentLoaded", () => {
          const style = document.createElement("style");
          style.textContent = "nextjs-portal { display: none !important; }";
          document.head.appendChild(style);
        });
      },
      { theme: v.theme, watchlist: p.watchlist ? WATCHLIST : null }
    );

    const blockedHosts = new Set();
    const baseHost = new URL(BASE).host;
    const mockHost = new URL(MOCK).host;
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      // Safe's Client Gateway, answered by the mock.
      if (url.host === "safe-client.safe.global") {
        const res = await fetch(`${MOCK}/safe${url.pathname}`);
        return route.fulfill({
          status: res.status,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: await res.text(),
        });
      }
      // Arbitrum RPC: only the Controller lookups the explorer needs to
      // recognise Livepeer contracts; every other call fails as before.
      if (url.host === "arb1.arbitrum.io") {
        const body = JSON.parse(route.request().postData() ?? "null");
        const answer = (r) => {
          const c = r?.params?.[0];
          if (r?.method === "eth_chainId")
            return { jsonrpc: "2.0", id: r.id, result: "0xa4b1" };
          if (r?.method === "eth_call" && c?.data) {
            // Reads arrive batched through Multicall3's aggregate3.
            if (c.data.startsWith(AGGREGATE3)) {
              const { args } = decodeFunctionData({
                abi: multicall3Abi,
                data: c.data,
              });
              const results = args[0].map((x) => {
                const out = controllerCall(x.target, x.callData);
                return {
                  success: Boolean(out),
                  returnData: out ?? "0x",
                };
              });
              return {
                jsonrpc: "2.0",
                id: r.id,
                result: encodeFunctionResult({
                  abi: multicall3Abi,
                  functionName: "aggregate3",
                  result: results,
                }),
              };
            }
            const out = controllerCall(c.to, c.data);
            if (out) return { jsonrpc: "2.0", id: r.id, result: out };
          }
          return {
            jsonrpc: "2.0",
            id: r?.id ?? null,
            error: { code: -32000, message: "mock rpc: not served" },
          };
        };
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify(
            Array.isArray(body) ? body.map(answer) : answer(body)
          ),
        });
      }
      if (url.host === baseHost && url.pathname === "/api/governance/lips") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(LIPS),
        });
      }
      if (url.host === "api.coingecko.com") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify(COINGECKO),
        });
      }
      if (
        url.host === baseHost ||
        url.host === mockHost ||
        url.protocol === "data:" ||
        url.protocol === "blob:"
      ) {
        return route.continue();
      }
      blockedHosts.add(url.host);
      return route.abort("blockedbyclient");
    });

    const page = await context.newPage();
    const consoleErrors = [];
    const failed = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      // Noise from our own external-host block.
      if (text.includes("ERR_BLOCKED_BY_CLIENT")) return;
      consoleErrors.push(text.slice(0, 300));
    });
    page.on("pageerror", (err) =>
      consoleErrors.push(`pageerror: ${err.message.slice(0, 300)}`)
    );
    page.on("requestfailed", (req) => {
      const url = req.url();
      const reason = req.failure()?.errorText ?? "";
      if (reason.includes("BLOCKED_BY_CLIENT")) return; // our own external-host block
      // Navigations/prefetches cancelled by the router, not real failures.
      if (
        reason.includes("ERR_ABORTED") &&
        ["HEAD", "GET"].includes(req.method()) &&
        !url.includes("/graphql")
      )
        return;
      failed.push(`${req.method()} ${url.slice(0, 140)} ${reason}`);
    });
    page.on("response", (res) => {
      if (res.status() >= 400)
        failed.push(`${res.status()} ${res.url().slice(0, 140)}`);
    });

    let status = null;
    const t0 = Date.now();
    try {
      const res = await page.goto(BASE + p.path, {
        waitUntil: "networkidle",
        timeout: 90_000,
      });
      status = res?.status() ?? null;
    } catch (err) {
      consoleErrors.push(`goto: ${err.message.split("\n")[0]}`);
    }
    await page.waitForTimeout(SETTLE_MS);
    try {
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
    } catch {}

    if (p.click) {
      try {
        await page.getByRole("button", { name: p.click }).first().click();
        await page.waitForTimeout(800);
      } catch (err) {
        consoleErrors.push(`click: ${err.message.split("\n")[0]}`);
      }
    }

    // Cheap layout/content probes.
    const probe = await page
      .evaluate(() => {
        const doc = document.documentElement;
        const text = document.body?.innerText ?? "";
        const wide = [];
        if (doc.scrollWidth > doc.clientWidth)
          for (const el of document.querySelectorAll("body *")) {
            const r = el.getBoundingClientRect();
            if (
              r.right > doc.clientWidth + 1 &&
              r.width > 0 &&
              getComputedStyle(el).position !== "fixed"
            ) {
              wide.push(
                `${el.tagName.toLowerCase()}.${String(el.className)
                  .split(" ")
                  .slice(0, 3)
                  .join(".")} right=${Math.round(r.right)}`
              );
              if (wide.length >= 5) break;
            }
          }
        return {
          theme: doc.dataset.theme,
          horizontalOverflow: doc.scrollWidth > doc.clientWidth,
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          nan: (text.match(/\bNaN\b|Infinity|undefined/g) ?? []).length,
          skeletons: document.querySelectorAll(
            '[data-slot="skeleton"], .animate-pulse'
          ).length,
          wide,
          title: document.title,
        };
      })
      .catch((e) => ({ error: e.message }));

    const file = path.join(OUT, `${id}.png`);
    await page
      .screenshot({ path: file, fullPage: true })
      .catch((e) => consoleErrors.push(`screenshot: ${e.message}`));
    // Long pages are unreadable when downscaled: also keep the first screenful.
    const height = await page
      .evaluate(() => document.documentElement.scrollHeight)
      .catch(() => 0);
    if (height > v.viewport.height * 2.5) {
      await page
        .screenshot({ path: file.replace(/\.png$/, ".top.png") })
        .catch(() => {});
    }
    report.push({
      blockedHosts: [...blockedHosts],
      id,
      url: p.path,
      status,
      ms: Date.now() - t0,
      file,
      probe,
      consoleErrors,
      failed,
    });
    await context.close();

    const flags = [
      status && status >= 400 ? `HTTP ${status}` : null,
      probe.horizontalOverflow
        ? `h-overflow ${probe.scrollWidth}>${probe.clientWidth}`
        : null,
      probe.nan ? `NaN/undefined x${probe.nan}` : null,
      probe.skeletons ? `skeletons x${probe.skeletons}` : null,
      consoleErrors.length ? `console errors x${consoleErrors.length}` : null,
      failed.length ? `failed requests x${failed.length}` : null,
    ].filter(Boolean);
    console.log(
      `${flags.length ? "!!" : "ok"} ${id.padEnd(30)} ${String(status).padEnd(
        4
      )} ${String(Date.now() - t0).padStart(6)}ms ${flags.join(", ")}`
    );
    for (const e of consoleErrors.slice(0, 6))
      console.log(`     console: ${e}`);
    for (const e of failed.slice(0, 6)) console.log(`     request: ${e}`);
    for (const w of probe.wide ?? []) console.log(`     overflow: ${w}`);
    if (blockedHosts.size)
      console.log(`     blocked hosts: ${[...blockedHosts].join(", ")}`);
  }

  await browser.close();
  fs.writeFileSync(
    path.join(OUT, "report.json"),
    JSON.stringify(report, null, 2)
  );
  console.log(
    `\n${report.length} screenshots in ${OUT} (report.json alongside)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
