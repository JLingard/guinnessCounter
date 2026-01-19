import { useState, useCallback, useRef } from 'react'
import styles from './CounterButton.module.css'

interface CounterButtonProps {
  userName: string
}

type FeedbackState = 'idle' | 'success' | 'error'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 
  'https://script.google.com/macros/s/AKfycbwH5BCG_w_Ykohl8JchB9ei6IccC0CVu2Q-QB8sKCH8HpB-l1IYv0wHmeaia7cBgimV/exec'

function CounterButton({ userName }: CounterButtonProps) {
  const [count, setCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = null
    }
  }, [])

  const showFeedback = useCallback((state: FeedbackState, duration = 1500) => {
    clearFeedbackTimeout()
    setFeedback(state)
    
    if (state !== 'idle') {
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback('idle')
        if (state === 'error') {
          setErrorMessage(null)
        }
      }, duration)
    }
  }, [clearFeedbackTimeout])

  const handleTap = useCallback(async () => {
    if (isSubmitting) return
    
    setCount((prev) => prev + 1)
    setIsSubmitting(true)
    setErrorMessage(null)
    
    try {
      if (!API_ENDPOINT) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        showFeedback('success')
        return
      }

      // Google Apps Script requires special handling for CORS
      await fetch(API_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ name: userName }),
      })

      // With no-cors mode, we can't read the response status
      // but if we got here without throwing, the request was sent
      showFeedback('success')
    } catch (error) {
      setCount((prev) => Math.max(0, prev - 1))
      
      const message = error instanceof Error 
        ? error.message 
        : 'Something went wrong'
      
      setErrorMessage(message)
      showFeedback('error', 3000)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, userName, showFeedback])

  const buttonClasses = [
    styles.button,
    isSubmitting ? styles.submitting : '',
    feedback === 'success' ? styles.success : '',
    feedback === 'error' ? styles.error : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={handleTap}
        disabled={isSubmitting}
        className={buttonClasses}
        aria-label={`Tap for ${userName}. Current count: ${count}`}
        aria-live="polite"
      >
        <img 
          src="/guinness.png" 
          alt="" 
          className={styles.pintImage}
          draggable={false}
        />
        
        <div className={styles.countOverlay}>
          <span className={styles.countValue}>{count}</span>
        </div>
      </button>

      <div className={styles.userName}>{userName}</div>

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorText}>{errorMessage}</span>
          <span className={styles.retryHint}>Tap to retry</span>
        </div>
      )}
    </div>
  )
}

export default CounterButton
