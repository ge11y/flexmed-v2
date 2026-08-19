import posthog from 'posthog-js'

// PostHog, armed only when a key is configured for this deployment.
// Every site reports into the agency's one shared project; the site label
// is what the agency dashboard slices by. Events go straight to PostHog's
// host — this repo stays a single dropped-in file with no config changes.
// The admin/owner surface is untracked so the owner's own clicks never
// count as visitors.

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (key && !window.location.pathname.startsWith('/admin')) {
  posthog.init(key, {
    api_host: 'https://us.i.posthog.com',
    ui_host: 'https://us.posthog.com',
    defaults: '2025-05-24',
  })
  posthog.register({
    site: process.env.NEXT_PUBLIC_POSTHOG_SITE || window.location.hostname,
  })
}
