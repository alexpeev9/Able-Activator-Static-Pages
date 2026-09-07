import { chromium } from "playwright";

const base = process.env.LANDING4_URL || "http://localhost:5173/landing-4";
const errors = [];
const assert = (cond, msg) => {
  if (!cond) errors.push(msg);
};

const nearCenter = (el, viewportW, label) => {
  const dx = Math.abs(el.midX - viewportW / 2);
  assert(dx <= 28, `${label} should be horizontally centered (midX=${el.midX.toFixed(1)}, viewport=${viewportW}, dx=${dx.toFixed(1)})`);
};

const measure = async (page, selector) =>
  page.$eval(selector, (node) => {
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: r.width,
      height: r.height,
      midX: r.left + r.width / 2,
      paddingTop: parseFloat(cs.paddingTop),
      paddingBottom: parseFloat(cs.paddingBottom),
      paddingLeft: parseFloat(cs.paddingLeft),
      paddingRight: parseFloat(cs.paddingRight),
    };
  });

const browser = await chromium.launch();

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector(".hero h1");

  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert(bg === "rgb(247, 251, 253)", `desktop body should be light canvas, got ${bg}`);

  const header = await measure(page, "header.hdr");
  const hero = await measure(page, ".hero");
  assert(header.top <= 1, `sticky header should sit at top, top=${header.top}`);
  assert(hero.height + 4 >= 800 - header.height, `hero+header should fill 100vh (hero=${hero.height.toFixed(1)}, header=${header.height.toFixed(1)})`);
  const heroPad = await measure(page, ".hero-in");
  assert(heroPad.paddingLeft >= 16 && heroPad.paddingRight >= 16, `desktop hero horizontal padding too tight (${heroPad.paddingLeft}/${heroPad.paddingRight})`);
  const heroSvgs = await page.locator(".hero svg").count();
  assert(heroSvgs === 0, `hero should not use decorative SVG, found ${heroSvgs}`);

  const navVisible = await page.locator(".nav").evaluate((n) => getComputedStyle(n).display !== "none");
  assert(navVisible, "desktop nav should be visible");

  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  await page.locator('.hero-actions a[href="#modules"]').click();
  await page.waitForFunction(() => {
    const el = document.querySelector("#modules");
    if (!el) return false;
    const top = el.getBoundingClientRect().top;
    return top >= 70 && top <= 160;
  });
  const modulesTop = await page.locator("#modules").evaluate((n) => n.getBoundingClientRect().top);
  assert(modulesTop >= 70 && modulesTop <= 160, `clicking Read the program should land on modules (top=${modulesTop.toFixed(1)})`);

  const faqBtn = page.locator("#faq button").first();
  const expandedBefore = await faqBtn.getAttribute("aria-expanded");
  await faqBtn.click();
  await page.waitForTimeout(200);
  const expandedAfter = await faqBtn.getAttribute("aria-expanded");
  assert(expandedBefore !== "true", "first FAQ should start collapsed or at least toggle");
  assert(expandedAfter === "true", `FAQ should expand, aria-expanded=${expandedAfter}`);

  const expandAll = page.getByRole("button", { name: /Expand all|Collapse all/i });
  await expandAll.scrollIntoViewIfNeeded();
  const expandLabel = (await expandAll.innerText()).trim();
  if (/Expand all/i.test(expandLabel)) await expandAll.click();
  await page.waitForTimeout(250);
  const openCount = await page.locator('.mod-head[aria-expanded="true"]').count();
  assert(openCount >= 6, `modules expand-all should open items, openCount=${openCount}`);

  assert(consoleErrors.length === 0, `desktop page errors: ${consoleErrors.join(" | ")}`);
  await page.close();
}

{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector(".hero h1");

  const navHidden = await page.locator(".nav").evaluate((n) => getComputedStyle(n).display === "none");
  assert(navHidden, "mobile nav links should hide");

  const headerCluster = await page.evaluate(() => {
    const inbar = document.querySelector(".hdr-in");
    const brand = document.querySelector(".brand");
    const cta = document.querySelector(".hdr .cta");
    const ir = inbar.getBoundingClientRect();
    const br = brand.getBoundingClientRect();
    const cr = cta.getBoundingClientRect();
    return {
      barMid: ir.left + ir.width / 2,
      brandMid: br.left + br.width / 2,
      ctaMid: cr.left + cr.width / 2,
      pairMid: (br.left + cr.right) / 2,
      vw: window.innerWidth,
    };
  });
  const pairDx = Math.abs(headerCluster.pairMid - headerCluster.vw / 2);
  assert(pairDx <= 24, `mobile header cluster should be centered (dx=${pairDx.toFixed(1)})`);

  nearCenter(await measure(page, ".hero-meta"), 390, "mobile hero meta");
  nearCenter(await measure(page, ".hero-title"), 390, "mobile hero title");
  nearCenter(await measure(page, ".hero-cards"), 390, "mobile hero cards");
  nearCenter(await measure(page, ".hero-actions"), 390, "mobile hero CTAs");

  const ctaBox = await measure(page, ".hero-actions a");
  assert(ctaBox.width >= 300, `mobile primary CTA should be full-width-ish, width=${ctaBox.width.toFixed(1)}`);

  await page.locator("#program").scrollIntoViewIfNeeded();
  nearCenter(await measure(page, "#program h2"), 390, "mobile program heading");

  await page.locator("#faq h2").scrollIntoViewIfNeeded();
  nearCenter(await measure(page, "#faq h2"), 390, "mobile FAQ heading");

  const heroIn = await measure(page, ".hero-in");
  assert(heroIn.paddingLeft >= 16 && heroIn.paddingRight >= 16, `mobile hero padding too tight (${heroIn.paddingLeft}/${heroIn.paddingRight})`);
  assert(Math.abs(heroIn.paddingLeft - heroIn.paddingRight) <= 1, "mobile hero padding should be equal");

  await page.close();
}

await browser.close();

if (errors.length) {
  console.error("FAIL\n" + errors.map((e) => "- " + e).join("\n"));
  process.exit(1);
}
console.log("PASS landing-4 desktop + mobile checks");
