'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [errors, setErrors] = useState<any[]>([])

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    const addLog = (type: string, ...args: any[]) => {
      const message = args.map((a) => {
        try {
          return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
        } catch {
          return '[Circular]'
        }
      }).join(' ')
      
      const logEntry = `[${new Date().toLocaleTimeString()}] [${type}] ${message}`
      setLogs((prev) => [...prev, logEntry].slice(-100)) // Keep last 100 logs
    }

    console.log = (...args) => {
      originalLog.apply(console, args)
      addLog('LOG', ...args)
    }

    console.error = (...args) => {
      originalError.apply(console, args)
      addLog('ERROR', ...args)
      setErrors((prev) => [...prev, { time: new Date(), args }].slice(-50))
    }

    console.warn = (...args) => {
      originalWarn.apply(console, args)
      addLog('WARN', ...args)
    }

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      addLog('UNHANDLED_ERROR', event.message, event.error?.stack)
      setErrors((prev) => [...prev, {
        time: new Date(),
        type: 'unhandled_error',
        message: event.message,
        stack: event.error?.stack,
      }].slice(-50))
    })

    window.addEventListener('unhandledrejection', (event) => {
      addLog('UNHANDLED_REJECTION', event.reason)
      setErrors((prev) => [...prev, {
        time: new Date(),
        type: 'unhandled_rejection',
        reason: event.reason,
      }].slice(-50))
    })

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      minHeight: '100vh',
    }}>
      <h1 style={{ color: '#fff', marginBottom: '20px' }}>🔍 Debug Logs</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#f48771', marginBottom: '10px' }}>❌ Errors ({errors.length})</h2>
        <div style={{
          backgroundColor: '#2d2d2d',
          padding: '15px',
          borderRadius: '5px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          {errors.length === 0 ? (
            <div style={{ color: '#858585' }}>No errors captured yet</div>
          ) : (
            errors.slice().reverse().map((error, i) => (
              <div key={i} style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#3d2d2d',
                borderRadius: '3px',
                borderLeft: '3px solid #f48771',
              }}>
                <div style={{ color: '#f48771', marginBottom: '5px' }}>
                  [{error.time.toLocaleTimeString()}] {error.type || 'ERROR'}
                </div>
                <div style={{ color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>
                  {error.message || JSON.stringify(error.args || error.reason, null, 2)}
                </div>
                {error.stack && (
                  <div style={{ color: '#858585', marginTop: '5px', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                    {error.stack}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 style={{ color: '#4ec9b0', marginBottom: '10px' }}>📝 All Logs ({logs.length})</h2>
        <div style={{
          backgroundColor: '#2d2d2d',
          padding: '15px',
          borderRadius: '5px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#858585' }}>No logs captured yet. Open the main app to see logs.</div>
          ) : (
            logs.slice().reverse().map((log, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '5px',
                  whiteSpace: 'pre-wrap',
                  color: log.includes('[ERROR]') ? '#f48771' :
                         log.includes('[WARN]') ? '#dcdcaa' :
                         '#4ec9b0',
                }}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#2d2d2d', borderRadius: '5px' }}>
        <p style={{ color: '#858585', margin: 0 }}>
          💡 Open this page in a separate tab/window, then open your app in another tab to see live logs.
        </p>
        <p style={{ color: '#858585', margin: '10px 0 0 0' }}>
          Or check Vercel logs: <code>vercel logs</code> or in Vercel dashboard.
        </p>
      </div>
    </div>
  )
}

