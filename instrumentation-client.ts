// PostHog, armed only when a key is configured for this deployment.
// Every site reports into the agency's one shared project; the site label
// is what the agency dashboard slices by. Events go straight to PostHog's
// host — this repo stays a single dropped-in file with no config changes.
// The admin/owner surface is untracked so the owner's own clicks never
// count as visitors.
//
// The library is imported after the window load event: statically imported
// it made up two thirds of the main client chunk (~100 KB compressed) and
// delayed every page's load event. Initialising later still records the
// initial pageview.

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (key && !window.location.pathname.startsWith('/admin')) {
  const start = () => {
    void import('posthog-js').then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: 'https://us.i.posthog.com',
        ui_host: 'https://us.posthog.com',
        defaults: '2025-05-24',
      })
      posthog.register({
        site: process.env.NEXT_PUBLIC_POSTHOG_SITE || window.location.hostname,
      })
    })
  }

  if (document.readyState === 'complete') {
    start()
  } else {
    window.addEventListener('load', start, { once: true })
  }
}
