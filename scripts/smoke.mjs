// End-to-end smoke test: serves the built site (out/) with the Pages Function
// through `wrangler pages dev`, then loads every screen in headless Chrome at
// four viewports and checks what a person would notice first:
//
// - the page title matches the screen (catches title races)
// - no horizontal overflow
// - no uncaught exceptions or console errors
// - the creator credit is visible without scrolling and not covered
// - each screen's key content is present (step progress, finish link, ...)
//
// Usage: npm run smoke            (builds first)
//        node scripts/smoke.mjs   (uses the existing out/)
//        options: --recipe <url>  --shots <dir>  --keep-going
//
// Recipe screens fetch a live recipe site through the real function, so a
// failure can be the site's fault: the report says which screen and why.
// Dependency-free: Node built-ins and a locally installed Chrome (set
// CHROME_PATH if it isn't found).

import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createConnection, createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const RECIPE =
  option("--recipe") ?? "https://www.recipetineats.com/chicken-chasseur/";
const SHOTS = option("--shots");
const KEEP_GOING = args.includes("--keep-going");

const VIEWPORTS = {
  "narrow phone": {
    width: 360,
    height: 640,
    deviceScaleFactor: 2,
    mobile: true,
  },
  "large phone": {
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    mobile: true,
  },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
};

const r = `url=${encodeURIComponent(RECIPE)}`;
const SCREENS = {
  home: { path: "/", ready: `!!document.querySelector('input[name="url"]')` },
  overview: { path: `/?${r}` },
  cook: { path: `/?${r}&view=cook&step=2` },
  finish: { path: `/?${r}&view=done` },
  // The API answers this one with a 422 on purpose (NO_RECIPE_FOUND), which
  // the browser logs as a failed request.
  error: {
    path: `/?url=${encodeURIComponent("https://example.com/")}`,
    expectedErrors: /status of 422 .*\/api\/recipe\?/,
  },
};

// Runs in the page. Returns a list of problems (empty means pass).
const CHECKS = {
  home: `[
    document.title === "Cook Mode" || "title is " + JSON.stringify(document.title),
  ]`,
  overview: `[
    / · Cook Mode$/.test(document.title) && !/^(Loading|Error)/.test(document.title)
      || "title is " + JSON.stringify(document.title),
    creditVisible() || "creator credit not fully visible without scrolling",
  ]`,
  cook: `[
    /^Step 2 · .+ · Cook Mode$/.test(document.title) || "title is " + JSON.stringify(document.title),
    !!document.querySelector('[aria-label^="Step 2 of "]') || "no 'Step 2 of N' region",
  ]`,
  finish: `[
    / · Cook Mode$/.test(document.title) || "title is " + JSON.stringify(document.title),
    document.body.innerText.includes("Enjoyed it?") || "no 'Enjoyed it?' heading",
    [...document.querySelectorAll("a")].some((a) => a.href.startsWith(${JSON.stringify(RECIPE.split("?")[0])}))
      || "no link back to the original recipe",
  ]`,
  error: `[
    /^Error: /.test(document.title) || "title is " + JSON.stringify(document.title),
    [...document.querySelectorAll("a")].some((a) => a.textContent.includes("Open the original page"))
      || "no 'Open the original page' link",
  ]`,
};
const SHARED = `
  function creditVisible() {
    const link = [...document.querySelectorAll("a")].find((a) =>
      a.textContent.includes("View the original recipe"));
    if (!link) return false;
    const box = link.getBoundingClientRect();
    if (box.top < 0 || box.bottom > innerHeight) return false;
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!hit && link.contains(hit);
  }`;
const OVERFLOW = `document.documentElement.scrollWidth - document.documentElement.clientWidth`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  return candidates.find((path) => path && existsSync(path));
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// Windows lets a second server bind a port that's already in use, and the
// old one keeps answering, so check nothing is listening before starting.
function portInUse(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

// Stops a process and everything it started (wrangler spawns workerd and
// esbuild, which outlive a plain kill on Windows).
function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
}

async function startServer() {
  const port = await freePort();
  if (await portInUse(port)) throw new Error(`port ${port} is already in use`);
  const child = spawn(
    "npm",
    ["run", "pages:dev", "--", "--port", String(port)],
    {
      shell: process.platform === "win32",
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 180; i++) {
    if (child.exitCode !== null) break;
    try {
      if ((await fetch(base, { signal: AbortSignal.timeout(2000) })).ok)
        return { child, base };
    } catch {}
    await sleep(500);
  }
  killTree(child);
  throw new Error(
    `wrangler didn't start serving on ${base}:\n${log.slice(-2000)}`,
  );
}

async function startChrome(path) {
  const port = await freePort();
  const profile = mkdtempSync(join(tmpdir(), "cookmode-smoke-"));
  const child = spawn(
    path,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let page;
  for (let i = 0; i < 100 && !page; i++) {
    try {
      const targets = await (
        await fetch(`http://127.0.0.1:${port}/json`)
      ).json();
      page = targets.find((t) => t.type === "page");
    } catch {}
    if (!page) await sleep(200);
  }
  if (!page) throw new Error("Chrome didn't start");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      errors.push(
        `uncaught: ${d.exception?.description ?? d.text}`.slice(0, 300),
      );
    } else if (
      msg.method === "Runtime.consoleAPICalled" &&
      msg.params.type === "error"
    ) {
      errors.push(
        `console.error: ${msg.params.args.map((a) => a.value ?? a.description).join(" ")}`.slice(
          0,
          300,
        ),
      );
    } else if (
      msg.method === "Log.entryAdded" &&
      msg.params.entry.level === "error"
    ) {
      errors.push(
        `${msg.params.entry.source}: ${msg.params.entry.text} ${msg.params.entry.url ?? ""}`.slice(
          0,
          300,
        ),
      );
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, (msg) =>
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result),
      );
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const evaluate = async (expression) =>
    (await send("Runtime.evaluate", { expression, returnByValue: true })).result
      .value;

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  // Best-effort: Chrome can hold files in the profile for a moment after
  // exiting, and a leftover temp folder isn't worth failing the run over.
  const close = async () => {
    ws.close();
    if (child.exitCode === null) {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      child.kill();
      await Promise.race([exited, sleep(3000)]);
    }
    try {
      rmSync(profile, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });
    } catch {}
  };
  return { send, evaluate, errors, close };
}

// A screen is ready once the loading skeleton (aria-busy) has gone and a
// <main> is on the page, or once its own marker exists. Readiness doesn't
// look at the title, so a wrong title is reported as such.
async function waitReady(browser, screen) {
  const ready =
    screen.ready ??
    `!document.querySelector('[aria-busy="true"]') && !!document.querySelector("main")`;
  for (let i = 0; i < 60; i++) {
    if (
      await browser.evaluate(`document.readyState === "complete" && (${ready})`)
    ) {
      await sleep(600);
      return true;
    }
    await sleep(500);
  }
  return false;
}

async function main() {
  if (!existsSync(join("out", "index.html"))) {
    console.error(
      "No build in out/. Run `npm run smoke` (which builds) or `npm run build` first.",
    );
    process.exit(1);
  }
  const chromePath = findChrome();
  if (!chromePath) {
    console.error(
      "Chrome not found. Set CHROME_PATH to a Chrome or Chromium binary.",
    );
    process.exit(1);
  }
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });

  const server = await startServer();
  let browser;
  try {
    browser = await startChrome(chromePath);
  } catch (error) {
    killTree(server.child);
    throw error;
  }
  // The server goes first: a stray wrangler keeps the port and serves a
  // stale build to whoever starts the next one.
  const cleanup = async () => {
    killTree(server.child);
    await browser.close();
  };
  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(130);
  });

  const failures = [];
  try {
    console.log(`Smoke test against ${server.base} (recipe: ${RECIPE})\n`);
    outer: for (const [viewport, metrics] of Object.entries(VIEWPORTS)) {
      await browser.send("Emulation.setDeviceMetricsOverride", metrics);
      for (const [name, screen] of Object.entries(SCREENS)) {
        browser.errors.length = 0;
        await browser.send("Page.navigate", { url: server.base + screen.path });
        const problems = [];
        if (!(await waitReady(browser, screen))) {
          problems.push(
            `still loading after 30s (title: ${JSON.stringify(await browser.evaluate("document.title"))})`,
          );
        } else {
          const results = await browser.evaluate(
            `(() => { ${SHARED}; return ${CHECKS[name]}; })()`,
          );
          problems.push(...results.filter((x) => x !== true));
          const overflow = await browser.evaluate(OVERFLOW);
          if (overflow > 0) problems.push(`${overflow}px horizontal overflow`);
        }
        problems.push(
          ...browser.errors.filter((e) => !screen.expectedErrors?.test(e)),
        );
        if (SHOTS) {
          const shot = await browser.send("Page.captureScreenshot", {
            format: "png",
          });
          writeFileSync(
            join(SHOTS, `${viewport.replace(" ", "-")}-${name}.png`),
            Buffer.from(shot.data, "base64"),
          );
        }
        const label = `${viewport.padEnd(12)} ${name.padEnd(9)}`;
        if (problems.length) {
          console.log(`FAIL  ${label}`);
          for (const p of problems) console.log(`        - ${p}`);
          failures.push(label);
          if (!KEEP_GOING) break outer;
        } else {
          console.log(`ok    ${label}`);
        }
      }
    }
  } finally {
    await cleanup();
  }

  if (failures.length) {
    console.log(
      `\n${failures.length} screen(s) failed.${KEEP_GOING ? "" : " Stopped at the first failure; pass --keep-going to see all."}`,
    );
    process.exit(1);
  }
  console.log(
    `\nAll ${Object.keys(VIEWPORTS).length * Object.keys(SCREENS).length} screens passed.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
