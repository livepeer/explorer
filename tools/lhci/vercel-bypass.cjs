/**
 * Lighthouse CI `puppeteerScript` that gets the browser past Vercel
 * Deployment Protection on preview URLs. Without it, every audit lands on
 * the Vercel login page instead of the app.
 *
 * It opens the preview once with the "Protection Bypass for Automation"
 * secret and asks Vercel to set its bypass cookie. Lighthouse does not clear
 * cookies between runs, so every audit after that reaches the app. The
 * secret is only used in this navigation and never in the Lighthouse
 * settings, so it stays out of the reports, which are uploaded to public
 * storage. (`settings.extraHeaders` would be copied into every report and
 * sent to every third-party origin the app calls.)
 *
 * The job fails if the secret is missing or the cookie does not work, so it
 * can't quietly go back to auditing the login page.
 */

// A small static file served on every deployment, so setting the cookie
// doesn't warm the cache of a page that is about to be measured.
const COOKIE_PATH = "/manifest.json";

const SECRET_ENV = "VERCEL_AUTOMATION_BYPASS_SECRET";

const bypassedOrigins = new Set();

/**
 * @param {import('puppeteer-core').Browser} browser
 * @param {{url: string}} context
 */
module.exports = async (browser, { url }) => {
  const { origin } = new URL(url);
  if (bypassedOrigins.has(origin)) return;

  const secret = process.env[SECRET_ENV];
  if (!secret) {
    throw new Error(
      `${SECRET_ENV} is not set. Lighthouse would only audit the Vercel login page. ` +
        "Add the project's Protection Bypass for Automation secret to the repo's " +
        "Actions and Dependabot secrets (PRs from forks can't read it)."
    );
  }

  const page = await browser.newPage();
  try {
    const bypassUrl = new URL(COOKIE_PATH, origin);
    bypassUrl.searchParams.set("x-vercel-protection-bypass", secret);
    bypassUrl.searchParams.set("x-vercel-set-bypass-cookie", "true");
    try {
      await page.goto(bypassUrl.href);
    } catch (error) {
      // Navigation errors include the URL, which includes the secret.
      throw new Error(
        `Could not open ${origin}${COOKIE_PATH} to set the Vercel bypass cookie: ` +
          String(error.message).split(secret).join("***")
      );
    }

    // Check the cookie alone gets through, without the secret in the URL.
    const checkUrl = new URL(COOKIE_PATH, origin).href;
    const response = await page.goto(checkUrl);
    const landed = new URL(page.url());
    if (landed.origin !== origin || !response || !response.ok()) {
      const status = response ? response.status() : "none";
      throw new Error(
        `Vercel bypass cookie did not work: ${checkUrl} ended at ` +
          `${landed.origin}${landed.pathname} (HTTP ${status}). ` +
          `Check that ${SECRET_ENV} matches the project's Protection Bypass for Automation secret.`
      );
    }
  } finally {
    await page.close();
  }

  bypassedOrigins.add(origin);
  console.log(`Vercel bypass cookie set for ${origin}`);
};
