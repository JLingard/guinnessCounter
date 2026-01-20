import { useState, useCallback, useRef, useEffect } from 'react'
import styles from './CounterButton.module.css'

interface CounterButtonProps {
  userName: string
  onLeaderboard: () => void
}

type FeedbackState = 'idle' | 'success' | 'error'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 
  'https://script.google.com/macros/s/AKfycbwH5BCG_w_Ykohl8JchB9ei6IccC0CVu2Q-QB8sKCH8HpB-l1IYv0wHmeaia7cBgimV/exec'

function CounterButton({ userName, onLeaderboard }: CounterButtonProps) {
  const [count, setCount] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)

  // Fetch initial count from Google Sheets on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINT}?action=getCount&name=${encodeURIComponent(userName)}`
        )
        const data = await response.json()
        setCount(data.count ?? 0)
      } catch {
        // If fetch fails, start from 0
        setCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCount()
  }, [userName])

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
    if (isSubmitting || isLoading) return
    
    setCount((prev) => (prev ?? 0) + 1)
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
      setCount((prev) => Math.max(0, (prev ?? 1) - 1))
      
      const message = error instanceof Error 
        ? error.message 
        : 'Something went wrong'
      
      setErrorMessage(message)
      showFeedback('error', 3000)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, isLoading, userName, showFeedback])

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
        disabled={isSubmitting || isLoading}
        className={buttonClasses}
        aria-label={`Tap for ${userName}. Current count: ${count ?? 0}`}
        aria-live="polite"
      >
        <img 
          src={`${import.meta.env.BASE_URL}guinness.png`}
          alt="" 
          className={styles.pintImage}
          draggable={false}
        />
        
        <div className={styles.countOverlay}>
          <span className={styles.countValue}>
            {isLoading ? '...' : count}
          </span>
        </div>
      </button>

      <div className={styles.userName}>{userName}</div>

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorText}>{errorMessage}</span>
          <span className={styles.retryHint}>Tap to retry</span>
        </div>
      )}

      <button 
        className={styles.leaderboardButton}
        onClick={onLeaderboard}
        aria-label="View leaderboard"
      >
        🏆
      </button>
    </div>
  )
}

export default CounterButton
