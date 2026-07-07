/* Fuzely marketing site — runtime configuration.
 *
 * One plain global object, loaded BEFORE script.js. No framework, no build
 * step, no env tooling. Centralizes URLs/endpoints so nothing gets hardcoded
 * in behavior code. Nothing here fires a network request on its own.
 *
 * To wire the beta waitlist later, set `betaEndpoint` to your POST URL — see
 * docs/beta-form.md. To enable analytics later, flip `analytics.enabled` to
 * true and implement the forward in the track() shim in script.js.
 */
window.FUZELY_CONFIG = {
  // Future login destination (the Fuzely app). Centralized here so a future
  // header/mobile-menu login link reads its href from one place. No login
  // markup ships today — see docs/future-routes.md.
  appUrl: "https://app.fuzely.ai",

  // Waitlist submit endpoint. NULL today → the beta form shows an honest
  // "not connected yet" message and never implies a successful signup.
  // Set to a POST URL to enable a real submit + genuine success state.
  betaEndpoint: null,

  // Analytics is OFF today. track() is a no-op until this is flipped true
  // AND a provider forward is implemented in script.js.
  analytics: { enabled: false },

  // Reserved for later, documented in docs/future-routes.md — intentionally
  // absent today so no code accidentally depends on them:
  //   pricingUrl:  null,   // future pricing page
  //   checkoutUrl: null,   // future payment/checkout flow
  //   docsUrl:     null,   // future docs/help hub
};
