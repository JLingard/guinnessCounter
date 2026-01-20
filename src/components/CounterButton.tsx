import { useState, useCallback, useRef, useEffect } from 'react'
import styles from './CounterButton.module.css'

interface CounterButtonProps {
  userName: string
  onLeaderboard: () => void
}

type FeedbackState = 'idle' | 'success' | 'error' | 'decrement'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 
  'https://script.google.com/macros/s/AKfycbwH5BCG_w_Ykohl8JchB9ei6IccC0CVu2Q-QB8sKCH8HpB-l1IYv0wHmeaia7cBgimV/exec'

const LONG_PRESS_DURATION = 600 // ms

function CounterButton({ userName, onLeaderboard }: CounterButtonProps) {
  const [count, setCount] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const isLongPressRef = useRef(false)

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

  const handleIncrement = useCallback(async () => {
    if (isSubmitting || isLoading) return
    
    setCount((prev) => (prev ?? 0) + 1)
    setIsSubmitting(true)
    setErrorMessage(null)
    
    try {
      await fetch(API_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ name: userName }),
      })
      showFeedback('success')
    } catch (error) {
      setCount((prev) => Math.max(0, (prev ?? 1) - 1))
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setErrorMessage(message)
      showFeedback('error', 3000)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, isLoading, userName, showFeedback])

  const handleDecrement = useCallback(async () => {
    if (isSubmitting || isLoading || (count ?? 0) <= 0) return
    
    setCount((prev) => Math.max(0, (prev ?? 1) - 1))
    setIsSubmitting(true)
    setErrorMessage(null)
    
    try {
      await fetch(API_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ name: userName, action: 'deleteLastEntry' }),
      })
      showFeedback('decrement')
    } catch (error) {
      setCount((prev) => (prev ?? 0) + 1) // Revert on error
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setErrorMessage(message)
      showFeedback('error', 3000)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, isLoading, count, userName, showFeedback])

  const handlePressStart = useCallback(() => {
    isLongPressRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true
      handleDecrement()
    }, LONG_PRESS_DURATION)
  }, [handleDecrement])

  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleClick = useCallback(() => {
    // Only increment if it wasn't a long press
    if (!isLongPressRef.current) {
      handleIncrement()
    }
    isLongPressRef.current = false
  }, [handleIncrement])

  const buttonClasses = [
    styles.button,
    isSubmitting ? styles.submitting : '',
    feedback === 'success' ? styles.success : '',
    feedback === 'error' ? styles.error : '',
    feedback === 'decrement' ? styles.decrement : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={handleClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        disabled={isSubmitting || isLoading}
        className={buttonClasses}
        aria-label={`Tap for ${userName}. Current count: ${count ?? 0}. Hold to remove.`}
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
