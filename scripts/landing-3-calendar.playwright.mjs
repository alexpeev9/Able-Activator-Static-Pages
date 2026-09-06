import { chromium } from "playwright";

const base = process.env.LANDING3_URL || "http://localhost:5173/landing-3";
const errors = [];

const assert = (cond, msg) => {
  if (!cond) errors.push(msg);
};

const browser = await chromium.launch();

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator("#calendar").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const start = await page.evaluate(() => {
    const aside = document.querySelector(".cal-aside");
    const split = document.querySelector(".cal-split");
    return {
      asideTop: aside.getBoundingClientRect().top,
      splitBottom: split.getBoundingClientRect().bottom,
      display: getComputedStyle(aside).display,
      sticky: getComputedStyle(aside).position,
    };
  });

  assert(start.display !== "none", `desktop aside should be visible, got display=${start.display}`);
  assert(start.sticky === "sticky", `desktop aside should be position:sticky, got ${start.sticky}`);

  const midY = await page.evaluate(() => {
    const split = document.querySelector(".cal-split");
    const box = split.getBoundingClientRect();
    return window.scrollY + box.top + Math.min(520, box.height * 0.45);
  });
  await page.evaluate((y) => window.scrollTo(0, y), midY);
  await page.waitForTimeout(250);

  const mid = await page.evaluate(() => {
    const aside = document.querySelector(".cal-aside");
    const split = document.querySelector(".cal-split");
    return {
      asideTop: aside.getBoundingClientRect().top,
      splitTop: split.getBoundingClientRect().top,
      splitBottom: split.getBoundingClientRect().bottom,
      scrollY: window.scrollY,
    };
  });

  assert(
    mid.splitTop < 80 && mid.splitBottom > 400,
    `expected to be mid-calendar (splitTop=${mid.splitTop.toFixed(1)}, splitBottom=${mid.splitBottom.toFixed(1)})`
  );
  assert(
    mid.asideTop >= 80 && mid.asideTop <= 110,
    `aside should stick near the header (top=${mid.asideTop.toFixed(1)}, expected ~88)`
  );

  await page.close();
}

{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator("#calendar").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  const day = page.locator('#calendar [role="button"]').first();
  await day.click();
  await page.waitForSelector(".cal-overlay");
  await page.waitForTimeout(200);

  const beforeClose = await page.evaluate(() => window.scrollY);
  const samples = [];
  const collector = setInterval(async () => {}, 0);
  void collector;

  await page.evaluate(() => {
    window.__scrollSamples = [];
    window.__scrollSampler = () => {
      window.__scrollSamples.push(window.scrollY);
    };
    window.addEventListener("scroll", window.__scrollSampler, { passive: true });
  });

  await page.locator(".cal-close").click();
  await page.waitForSelector(".cal-overlay", { state: "detached" });

  for (let i = 0; i < 12; i++) {
    samples.push(await page.evaluate(() => window.scrollY));
    await page.waitForTimeout(40);
  }

  const recorded = await page.evaluate(() => {
    window.removeEventListener("scroll", window.__scrollSampler);
    return window.__scrollSamples || [];
  });
  samples.push(...recorded);

  const afterClose = await page.evaluate(() => window.scrollY);
  const minY = Math.min(...samples, afterClose, beforeClose);
  const jumpToTop = samples.some((y) => y < 80) || afterClose < 80 || minY < 80;

  assert(
    Math.abs(afterClose - beforeClose) < 80,
    `mobile close should keep scroll near ${beforeClose.toFixed(0)}, ended at ${afterClose.toFixed(0)}`
  );
  assert(
    !jumpToTop,
    `mobile close jumped toward the top (before=${beforeClose.toFixed(0)}, min=${minY.toFixed(0)}, samples=${JSON.stringify(samples.slice(0, 20))})`
  );

  await page.close();
}

{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const faq = document.querySelector("#faq");
    window.scrollTo(0, window.scrollY + faq.getBoundingClientRect().top - 220);
  });
  await page.waitForTimeout(200);

  await page.locator('#calendar [role="button"]').last().click();
  await page.waitForSelector(".cal-overlay");
  await page.evaluate(() => {
    const faq = document.querySelector("#faq");
    window.scrollTo(0, window.scrollY + faq.getBoundingClientRect().top - 180);
  });
  await page.waitForTimeout(150);

  const stack = await page.evaluate(() => {
    const sheet = document.querySelector(".cal-sheet");
    const faq = document.querySelector("#faq");
    const header = document.querySelector(".hdr");
    const box = sheet.getBoundingClientRect();
    const headerBox = header ? header.getBoundingClientRect() : { top: 99, bottom: 0 };
    const x = box.left + box.width / 2;
    const y = Math.min(box.top + 36, window.innerHeight - 24);
    const hit = document.elementFromPoint(x, y);
    const headerHit = document.elementFromPoint(24, 20);
    return {
      hit: hit ? (hit.closest(".cal-overlay") ? "overlay" : hit.closest("#faq") ? "faq" : hit.className || hit.tagName) : "none",
      headerHit: headerHit && headerHit.closest(".hdr") ? "header" : (headerHit && headerHit.className) || "none",
      headerTop: headerBox.top,
      headerBottom: headerBox.bottom,
      faqOverlapsSheet: faq.getBoundingClientRect().top < box.bottom,
      overlayParentIsScene: !!document.querySelector("#calendar .cal-overlay"),
      headerDimmed: header && header.classList.contains("cal-hdr-dim"),
    };
  });

  assert(stack.headerTop >= -1 && stack.headerTop <= 2, `header should stay pinned at the top (top=${stack.headerTop})`);
  assert(stack.headerBottom > 40, "header should stay visible while the day sheet is open");
  assert(stack.headerHit === "header", `header should stay above the overlay (hit=${stack.headerHit})`);
  assert(stack.headerDimmed, "header should stay dimmed to match the overlay");
  assert(stack.hit === "overlay", `day sheet should sit above Questions (hit=${stack.hit})`);
  assert(!stack.overlayParentIsScene, "overlay must not live inside the calendar stacking context");

  await page.close();
}

await browser.close();

if (errors.length) {
  console.error("FAIL");
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}

console.log("PASS landing-3 calendar sticky + mobile modal close");
