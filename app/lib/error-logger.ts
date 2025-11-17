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
    // Ignore wallet provider errors - these are expected in Farcaster when no wallet is connected
    const errorMessage = event.message || ''
    if (
      errorMessage.includes('sender_getProviderState') ||
      errorMessage.includes('No account exist') ||
      errorMessage.includes('Failed to get initial state')
    ) {
      // These are expected errors from wallet providers when no account exists
      // Don't log them as they're not actual bugs
      if (process.env.NODE_ENV === 'development') {
        console.warn('Wallet provider error (expected when no wallet connected):', errorMessage)
      }
      return
    }

    logError({
      error: errorMessage,
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
    const errorMessage = reason?.message || String(reason) || 'Unhandled promise rejection'
    
    // Ignore wallet provider errors
    if (
      errorMessage.includes('sender_getProviderState') ||
      errorMessage.includes('No account exist') ||
      errorMessage.includes('Failed to get initial state') ||
      (typeof reason === 'object' && reason !== null && 'error' in reason && 
       String(reason.error).includes('No account exist'))
    ) {
      // Expected wallet provider errors - don't log
      if (process.env.NODE_ENV === 'development') {
        console.warn('Wallet provider rejection (expected):', errorMessage)
      }
      return
    }

    logError({
      error: errorMessage,
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
    
    // Check if this is a wallet provider error (expected, don't log)
    const errorString = args.map(a => String(a)).join(' ')
    if (
      errorString.includes('sender_getProviderState') ||
      errorString.includes('No account exist') ||
      errorString.includes('Failed to get initial state')
    ) {
      // Expected wallet provider error - don't log
      return
    }
    
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

  // Suppress wallet provider errors globally to prevent crashes
  // These errors are expected when no wallet is connected
  const originalWindowError = window.onerror
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = String(message || '')
    if (
      errorMessage.includes('sender_getProviderState') ||
      errorMessage.includes('No account exist') ||
      errorMessage.includes('Failed to get initial state')
    ) {
      // Suppress wallet provider errors - return true to prevent default error handling
      return true
    }
    
    // Call original handler for other errors
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error)
    }
    return false
  }
}

