// Render the 1200×630 social preview cards in /og from each page's own hero art.
//
//   cd tools && npm i --no-save playwright-core && node og.mjs
//
// Needs Google Chrome installed (set CHROME=/path/to/chrome to override).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CARDS = [
  { out: "home", page: "/", art: ".hero-fig svg", tag: "CH. 01 · Localhost", title: "What is localhost?", sub: "Your computer, talking to itself — and how a request travels from 127.0.0.1 to the cloud." },
  { out: "ports", page: "/localhost-ports.html", art: "#knock svg", tag: "CH. 02 · Ports", title: "Localhost ports, explained", sub: "What :3000, :5173 and :8080 really mean — and which programs live behind them." },
  { out: "troubleshoot", page: "/localhost-not-working.html", art: ".hero figure svg", tag: "CH. 03 · Troubleshooting", title: "Localhost not working?", sub: "Fix “refused to connect” and every common localhost error, step by step." },
  { out: "cloud", page: "/what-is-the-cloud.html", art: null, tag: "CH. 04 · The cloud", title: "What is the cloud, actually?", sub: "A planet-sized computer you can rent by the second." },
  { out: "deploy", page: "/deploy-guide.html", art: ".term", tag: "CH. 05 · Deploy", title: "Deploy in one sentence", sub: "From localhost to a live URL with an AI agent — or the platform of your choice." },
];
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "dark" });
const page = await ctx.newPage();
fs.mkdirSync(path.join(root, "og"), { recursive: true });
for (const c of CARDS) {
  await page.goto(base + c.page, { waitUntil: "networkidle" });
  const defs = await page.evaluate(() => document.querySelector('svg[width="0"]').outerHTML);
  const art = c.art ? await page.evaluate((s) => document.querySelector(s).outerHTML, c.art) : '<div class="globe-wrap"><canvas data-globe="labels"></canvas></div>';
  const logo = await page.evaluate(() => document.querySelector(".masthead .logo").outerHTML);
  await page.setContent(`<!doctype html><html lang="en" class="js" data-theme="dark"><head><meta charset="utf-8">
    <link rel="stylesheet" href="${base}/styles.css"><script src="${base}/script.js" defer></script>
    <style>
      body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
      .og { position: relative; display: grid; grid-template-columns: 560px 1fr; gap: 24px; align-items: center; height: 630px; padding: 0 56px 0 64px; box-sizing: border-box; }
      .og h1 { font-size: 68px; margin: 22px 0 18px; }
      .og .lede { font-size: 24px; margin: 0; }
      .og .foot { position: absolute; left: 64px; bottom: 44px; display: flex; align-items: center; gap: 16px; font: 500 15px/1 var(--font-mono); letter-spacing: .12em; color: var(--ink-3); text-transform: uppercase; }
      .og .foot .logo { font: 600 22px/1 var(--font-display); letter-spacing: -.02em; text-transform: none; } .og .foot .logo svg { width: 36px; height: 36px; }
      .og .art { display: grid; place-items: center; max-height: 560px; }
      .og .art > svg { width: 100%; max-height: 540px; }
      .og .art .term { width: 100%; font-size: 15px; }
      .og .art .globe-wrap { width: 500px; }
      .og::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: linear-gradient(90deg, var(--blue), var(--signal)); }
    </style></head><body>${defs}
    <div class="og"><div><p class="kicker"><span class="tag">${c.tag.split(" · ")[0]}</span>${c.tag.split(" · ")[1]}</p><h1>${c.title}</h1><p class="lede">${c.sub}</p></div><div class="art">${art}</div>
    <div class="foot">${logo}<span>A field guide from 127.0.0.1 to the cloud</span></div></div></body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(c.art ? 400 : 1200);
  await page.screenshot({ path: path.join(root, "og", `${c.out}.png`) });
  console.log("og/" + c.out + ".png");
}
await browser.close();
server.close();
