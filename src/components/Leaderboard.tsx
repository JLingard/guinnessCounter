import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBeer } from '@fortawesome/free-solid-svg-icons'
import styles from './Leaderboard.module.css'
import { API_ENDPOINT } from '../config'

interface LeaderboardEntry {
  name: string
  count: number
}

interface LeaderboardProps {
  onBack: () => void
  currentUser: string
}

function Leaderboard({ onBack, currentUser }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINT}?action=getLeaderboard&limit=10`
        )
        const data = await response.json()
        setEntries(data.leaderboard ?? [])
      } catch {
        setError('Failed to load leaderboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return null
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Leaderboard</h1>
      
      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : entries.length === 0 ? (
          <div className={styles.empty}>No entries yet</div>
        ) : (
          entries.map((entry, index) => (
            <div 
              key={entry.name} 
              className={`${styles.entry} ${entry.name === currentUser ? styles.currentUser : ''}`}
            >
              <span className={styles.rank}>
                {getMedalEmoji(index) ?? `${index + 1}`}
              </span>
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.count}>{entry.count}</span>
            </div>
          ))
        )}
      </div>

      <button 
        className={styles.backButton} 
        onClick={onBack}
        aria-label="Back to counter"
      >
        <FontAwesomeIcon icon={faBeer} />
      </button>
    </div>
  )
}

export default Leaderboard

