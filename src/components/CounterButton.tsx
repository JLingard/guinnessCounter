import { useState, useCallback, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faChartSimple, faCircleInfo, faBeer } from '@fortawesome/free-solid-svg-icons'
import styles from './CounterButton.module.css'
import { API_ENDPOINT } from '../config'

interface CounterButtonProps {
  userName: string
  onLeaderboard: () => void
  onStats: () => void
  onRules: () => void
}

type FeedbackState = 'idle' | 'success' | 'error' | 'decrement'

const LONG_PRESS_DURATION = 600 // ms
const HALF_PINT_STORAGE_KEY = 'guinness-half-pint-mode'

function CounterButton({ userName, onLeaderboard, onStats, onRules }: CounterButtonProps) {
  const [count, setCount] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasApiError, setHasApiError] = useState(false)
  const [isHalfPint, setIsHalfPint] = useState(() => {
    return localStorage.getItem(HALF_PINT_STORAGE_KEY) === 'true'
  })
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const feedbackTimeoutRef = useRef<number | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const isLongPressRef = useRef(false)

  const toggleHalfPint = useCallback(() => {
    setIsHalfPint(prev => {
      const newValue = !prev
      localStorage.setItem(HALF_PINT_STORAGE_KEY, String(newValue))
      return newValue
    })
  }, [])

  // Fetch initial count from Google Sheets on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINT}?action=getCount&name=${encodeURIComponent(userName)}`
        )
        if (!response.ok) {
          setHasApiError(true)
          return
        }
        const data = await response.json()
        if (data.error) {
          setHasApiError(true)
          return
        }
        setCount(data.count ?? 0)
      } catch {
        setHasApiError(true)
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
    
    const amount = isHalfPint ? 0.5 : 1
    setCount((prev) => (prev ?? 0) + amount)
    setIsSubmitting(true)
    setErrorMessage(null)
    
    try {
      await fetch(API_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ name: userName, amount }),
      })
      showFeedback('success')
    } catch (error) {
      setCount((prev) => Math.max(0, (prev ?? amount) - amount))
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setErrorMessage(message)
      showFeedback('error', 3000)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, isLoading, isHalfPint, userName, showFeedback])

  const handleDecrement = useCallback(async () => {
    if (isSubmitting || isLoading || (count ?? 0) <= 0) return
    
    // We don't know the amount of the last entry, so we'll let the API handle it
    // and just re-fetch the count after
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
      // Re-fetch count since we don't know how much was removed
      const response = await fetch(
        `${API_ENDPOINT}?action=getCount&name=${encodeURIComponent(userName)}`
      )
      const data = await response.json()
      setCount(data.count ?? 0)
      showFeedback('decrement')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setErrorMessage(message)
      showFeedback('error', 3000)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, isLoading, count, userName, showFeedback])

  const handlePressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Prevent default to stop context menu on mobile
    if ('touches' in e) {
      e.preventDefault()
    }
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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault() // Prevent right-click/long-press context menu
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
    isHalfPint ? styles.halfPint : '',
  ].filter(Boolean).join(' ')

  if (hasApiError) {
    return (
      <div className={styles.container}>
        <div className={styles.apiError}>
          <span className={styles.apiErrorEmoji}>😬</span>
          <h2 className={styles.apiErrorTitle}>Oops!</h2>
          <p className={styles.apiErrorMessage}>
            Sorry, looks like I've broken the app.
          </p>
          <p className={styles.apiErrorHint}>
            Let me know if you see this!
          </p>
        </div>
        <div className={styles.userName}>{userName}</div>
      </div>
    )
  }

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
        onContextMenu={handleContextMenu}
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

      <div className={styles.buttonBar}>
        <button 
          className={styles.navButton}
          onClick={onStats}
          aria-label="View your stats"
        >
          <FontAwesomeIcon icon={faChartSimple} />
        </button>

        <button 
          className={`${styles.navButton} ${styles.pintToggle} ${isHalfPint ? styles.active : ''}`}
          onClick={toggleHalfPint}
          aria-label={isHalfPint ? "Switch to full pint" : "Switch to half pint"}
        >
          <FontAwesomeIcon icon={faBeer} className={isHalfPint ? styles.halfPintIcon : styles.fullPintIcon} />
        </button>

        <button 
          className={styles.navButton}
          onClick={onRules}
          aria-label="View rules"
        >
          <FontAwesomeIcon icon={faCircleInfo} />
        </button>

        <button 
          className={styles.navButton}
          onClick={onLeaderboard}
          aria-label="View leaderboard"
        >
          <FontAwesomeIcon icon={faTrophy} />
        </button>
      </div>
    </div>
  )
}

export default CounterButton
