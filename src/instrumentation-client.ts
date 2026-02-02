// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://a99eaeb7111b6bbadc5ed0eb16a24895@o4510194511446016.ingest.us.sentry.io/4510194520752128",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Filter out browser extension errors and other known non-critical errors
  ignoreErrors: [
    // Browser extension errors
    "runtime.sendMessage",
    "chrome.runtime",
    "browser.runtime",
    "Extension context invalidated",
    "Non-Error promise rejection captured",
    // Network errors that are not actionable
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    // Ad blocker related
    "AdBlock",
    "blocked",
    // Third-party script errors
    "Script error",
    "Javascript error: Do not have Permission",
  ],

  // Filter errors before sending to Sentry
  beforeSend(event, hint) {
    const error = hint.originalException || hint.syntheticException
    const errorMessage =
      (error instanceof Error ? error.message : String(error || "")) ||
      event.message ||
      ""

    // Ignore browser extension related errors
    if (
      errorMessage.includes("runtime.sendMessage") ||
      errorMessage.includes("Extension context") ||
      errorMessage.includes("chrome.runtime") ||
      errorMessage.includes("browser.runtime")
    ) {
      return null; // Don't send to Sentry
    }

    // Ignore errors from browser extensions (check stack trace)
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.stacktrace?.frames) {
          for (const frame of exception.stacktrace.frames) {
            // Check if error originates from chrome-extension:// or moz-extension://
            if (
              frame.filename?.includes("chrome-extension://") ||
              frame.filename?.includes("moz-extension://") ||
              frame.filename?.includes("safari-extension://")
            ) {
              return null; // Don't send to Sentry
            }
          }
        }
      }
    }

    return event; // Send other errors normally
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart