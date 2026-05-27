const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

const AUTH = "http://localhost:9000";              // server.js
const APP  = "http://localhost:9000/headless.html"; // served by server.js (public/)
const STAY_MS = parseInt(process.env.STAY_MS || "60000", 10);

async function getToken() {
  const r = await fetch(`${AUTH}/get-token`);
  if (!r.ok) throw new Error(`get-token ${r.status}`);
  return (await r.json()).token;
}

async function createMeeting(token) {
  const r = await fetch(`${AUTH}/create-meeting/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, region: "sg001" }),
  });
  if (!r.ok) throw new Error(`create-meeting ${r.status}`);
  const data = await r.json();
  return data.roomId || data.meetingId;
}

(async () => {
  const token = await getToken();
  const meetingId = process.argv[2] || (await createMeeting(token));
  console.log("meetingId:", meetingId);

  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === "0" ? false : "new",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

  const page = await browser.newPage();
  page.on("console", (msg) => console.log("page>", msg.text()));
  page.on("pageerror", (err) => console.error("page-error>", err.message));

  const url = `${APP}?meetingId=${encodeURIComponent(meetingId)}&token=${encodeURIComponent(token)}&mic=1&cam=0&name=puppeteer-bot`;
  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.waitForFunction(
    () => document.getElementById("status")?.textContent?.startsWith("joined"),
    { timeout: 30_000 }
  );
  console.log(`bot is in the call — staying for ${STAY_MS}ms`);

  await new Promise((r) => setTimeout(r, STAY_MS));
  await page.evaluate(() => window.__meeting?.leave());
  await browser.close();
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
