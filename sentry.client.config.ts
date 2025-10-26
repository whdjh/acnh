import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

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
    const error = hint.originalException || hint.syntheticException;
    const errorMessage = error?.message || event.message || "";

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
});
