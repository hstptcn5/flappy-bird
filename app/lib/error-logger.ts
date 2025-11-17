/**
 * Client-side error logging utility
 * Sends errors to server and displays in console
 */

interface ErrorInfo {
  error: string
  stack?: string
  url?: string
  userAgent?: string
  fid?: number | string
  context?: Record<string, any>
}

export function logError(errorInfo: ErrorInfo) {
  // Always log to console
  console.error('🚨 ERROR:', errorInfo.error)
  if (errorInfo.stack) {
    console.error('Stack:', errorInfo.stack)
  }
  if (errorInfo.context) {
    console.error('Context:', errorInfo.context)
  }

  // Try to send to server (don't block if it fails)
  if (typeof window !== 'undefined') {
    const logData = {
      ...errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    // Send asynchronously - don't await
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    }).catch((err) => {
      console.warn('Failed to send error to server:', err)
    })
  }
}

/**
 * Setup global error handlers
 */
export function setupErrorHandlers() {
  if (typeof window === 'undefined') return

  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logError({
      error: event.message || 'Unknown error',
      stack: event.error?.stack,
      url: event.filename,
      context: {
        lineno: event.lineno,
        colno: event.colno,
        type: 'unhandled_error',
      },
    })
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    logError({
      error: reason?.message || String(reason) || 'Unhandled promise rejection',
      stack: reason?.stack,
      context: {
        type: 'unhandled_rejection',
        reason: String(reason),
      },
    })
  })

  // Override console.error to capture more info
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args)
    
    // Try to extract error info
    const errorArg = args.find((arg) => arg instanceof Error)
    if (errorArg) {
      logError({
        error: errorArg.message,
        stack: errorArg.stack,
        context: {
          type: 'console_error',
          args: args.map((a) => {
            try {
              return typeof a === 'object' ? JSON.stringify(a) : String(a)
            } catch {
              return '[Circular or non-serializable]'
            }
          }),
        },
      })
    }
  }
}

