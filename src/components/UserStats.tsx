import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBeer, 
  faClock, 
  faCalendarDay, 
  faTrophy, 
  faCalendar, 
  faFire, 
  faBolt, 
  faChartLine, 
  faGlassCheers,
  faCakeCandles
} from '@fortawesome/free-solid-svg-icons'
import styles from './UserStats.module.css'
import { API_ENDPOINT } from '../config'

interface UserStatsProps {
  userName: string
  onBack: () => void
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatHour(hour: number): string {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Stats {
  total: number
  mostGuinnessyHour: { hour: number; count: number } | null
  mostGuinnessyDay: { day: string; count: number } | null
  mostGuinnessySingleDay: { date: string; count: number } | null
  mostGuinnessyMonth: { month: string; count: number } | null
  firstGuinness: string | null
  latestGuinness: string | null
  averagePerDrinkingDay: number
  weekendVsWeekday: { weekend: number; weekday: number }
  currentStreak: number
  longestStreak: number
}

function calculateStats(timestamps: string[]): Stats {
  if (timestamps.length === 0) {
    return {
      total: 0,
      mostGuinnessyHour: null,
      mostGuinnessyDay: null,
      mostGuinnessySingleDay: null,
      mostGuinnessyMonth: null,
      firstGuinness: null,
      latestGuinness: null,
      averagePerDrinkingDay: 0,
      weekendVsWeekday: { weekend: 0, weekday: 0 },
      currentStreak: 0,
      longestStreak: 0,
    }
  }

  const dates = timestamps.map(ts => new Date(ts)).sort((a, b) => a.getTime() - b.getTime())
  
  // Hour counts
  const hourCounts: Record<number, number> = {}
  // Day of week counts
  const dayOfWeekCounts: Record<number, number> = {}
  // Single day counts (by date string)
  const singleDayCounts: Record<string, number> = {}
  // Month counts
  const monthCounts: Record<number, number> = {}
  // Weekend vs weekday
  let weekend = 0
  let weekday = 0

  dates.forEach(date => {
    const hour = date.getHours()
    const dayOfWeek = date.getDay()
    const dateKey = date.toISOString().split('T')[0]
    const month = date.getMonth()

    hourCounts[hour] = (hourCounts[hour] || 0) + 1
    dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
    singleDayCounts[dateKey] = (singleDayCounts[dateKey] || 0) + 1
    monthCounts[month] = (monthCounts[month] || 0) + 1

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekend++
    } else {
      weekday++
    }
  })

  // Find maximums
  const maxHour = Object.entries(hourCounts).reduce((max, [hour, count]) => 
    count > (max?.count || 0) ? { hour: parseInt(hour), count } : max, null as { hour: number; count: number } | null)

  const maxDay = Object.entries(dayOfWeekCounts).reduce((max, [day, count]) =>
    count > (max?.count || 0) ? { day: DAYS[parseInt(day)], count } : max, null as { day: string; count: number } | null)

  const maxSingleDay = Object.entries(singleDayCounts).reduce((max, [date, count]) =>
    count > (max?.count || 0) ? { date, count } : max, null as { date: string; count: number } | null)

  const maxMonth = Object.entries(monthCounts).reduce((max, [month, count]) =>
    count > (max?.count || 0) ? { month: MONTHS[parseInt(month)], count } : max, null as { month: string; count: number } | null)

  // Calculate streaks
  const uniqueDays = [...new Set(dates.map(d => d.toISOString().split('T')[0]))].sort()
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  // Check if streak is active (had a guinness today or yesterday)
  const lastDrinkingDay = uniqueDays[uniqueDays.length - 1]
  const streakIsActive = lastDrinkingDay === today || lastDrinkingDay === yesterday

  for (let i = 1; i < uniqueDays.length; i++) {
    const prevDate = new Date(uniqueDays[i - 1])
    const currDate = new Date(uniqueDays[i])
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / 86400000)
    
    if (diffDays === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)
  currentStreak = streakIsActive ? tempStreak : 0

  // Average per drinking day
  const drinkingDays = Object.keys(singleDayCounts).length
  const averagePerDrinkingDay = drinkingDays > 0 ? timestamps.length / drinkingDays : 0

  return {
    total: timestamps.length,
    mostGuinnessyHour: maxHour,
    mostGuinnessyDay: maxDay,
    mostGuinnessySingleDay: maxSingleDay,
    mostGuinnessyMonth: maxMonth,
    firstGuinness: dates[0]?.toISOString() || null,
    latestGuinness: dates[dates.length - 1]?.toISOString() || null,
    averagePerDrinkingDay,
    weekendVsWeekday: { weekend, weekday },
    currentStreak,
    longestStreak,
  }
}

function UserStats({ userName, onBack }: UserStatsProps) {
  const [timestamps, setTimestamps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINT}?action=getUserTimestamps&name=${encodeURIComponent(userName)}`
        )
        const data = await response.json()
        setTimestamps(data.timestamps ?? [])
      } catch {
        setError('Failed to load your data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [userName])

  const stats = useMemo(() => calculateStats(timestamps), [timestamps])

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your Guinnesses...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button className={styles.backButton} onClick={onBack}>
          <FontAwesomeIcon icon={faBeer} />
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Guinnesses</h1>
      <p className={styles.subtitle}>{userName}'s drinking diary</p>

      {stats.total === 0 ? (
        <div className={styles.empty}>
          <p>No Guinnesses logged yet!</p>
          <p className={styles.emptyHint}>Tap that pint to get started</p>
        </div>
      ) : (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><FontAwesomeIcon icon={faBeer} /></span>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Guinnesses</span>
          </div>

          {stats.mostGuinnessyHour && (
            <div className={styles.statCard}>
              <span className={styles.statIcon}><FontAwesomeIcon icon={faClock} /></span>
              <span className={styles.statValue}>{formatHour(stats.mostGuinnessyHour.hour)}</span>
              <span className={styles.statLabel}>Peak Hour</span>
              <span className={styles.statDetail}>{stats.mostGuinnessyHour.count} pints</span>
            </div>
          )}

          {stats.mostGuinnessyDay && (
            <div className={styles.statCard}>
              <span className={styles.statIcon}><FontAwesomeIcon icon={faCalendarDay} /></span>
              <span className={styles.statValue}>{stats.mostGuinnessyDay.day}</span>
              <span className={styles.statLabel}>Favourite Day</span>
              <span className={styles.statDetail}>{stats.mostGuinnessyDay.count} pints</span>
            </div>
          )}

          {stats.mostGuinnessySingleDay && (
            <div className={styles.statCard}>
              <span className={styles.statIcon}><FontAwesomeIcon icon={faTrophy} /></span>
              <span className={styles.statValue}>{stats.mostGuinnessySingleDay.count}</span>
              <span className={styles.statLabel}>Record Day</span>
              <span className={styles.statDetail}>{formatDate(stats.mostGuinnessySingleDay.date)}</span>
            </div>
          )}

          {stats.mostGuinnessyMonth && (
            <div className={styles.statCard}>
              <span className={styles.statIcon}><FontAwesomeIcon icon={faCalendar} /></span>
              <span className={styles.statValue}>{stats.mostGuinnessyMonth.month}</span>
              <span className={styles.statLabel}>Best Month</span>
              <span className={styles.statDetail}>{stats.mostGuinnessyMonth.count} pints</span>
            </div>
          )}

          <div className={styles.statCard}>
            <span className={styles.statIcon}><FontAwesomeIcon icon={faFire} /></span>
            <span className={styles.statValue}>{stats.currentStreak}</span>
            <span className={styles.statLabel}>Current Streak</span>
            <span className={styles.statDetail}>days in a row</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statIcon}><FontAwesomeIcon icon={faBolt} /></span>
            <span className={styles.statValue}>{stats.longestStreak}</span>
            <span className={styles.statLabel}>Longest Streak</span>
            <span className={styles.statDetail}>days in a row</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statIcon}><FontAwesomeIcon icon={faChartLine} /></span>
            <span className={styles.statValue}>{stats.averagePerDrinkingDay.toFixed(1)}</span>
            <span className={styles.statLabel}>Avg Per Session</span>
            <span className={styles.statDetail}>pints per day out</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statIcon}><FontAwesomeIcon icon={faGlassCheers} /></span>
            <span className={styles.statValue}>
              {stats.weekendVsWeekday.weekend > stats.weekendVsWeekday.weekday ? 'Weekend' : 'Weekday'}
            </span>
            <span className={styles.statLabel}>Warrior</span>
            <span className={styles.statDetail}>
              {stats.weekendVsWeekday.weekend} vs {stats.weekendVsWeekday.weekday}
            </span>
          </div>

          {stats.firstGuinness && (
            <div className={styles.statCard}>
              <span className={styles.statIcon}><FontAwesomeIcon icon={faCakeCandles} /></span>
              <span className={styles.statValue}>{formatDate(stats.firstGuinness)}</span>
              <span className={styles.statLabel}>First Guinness</span>
              <span className={styles.statDetail}>the one that started it all</span>
            </div>
          )}
        </div>
      )}

      <button className={styles.backButton} onClick={onBack}>
        <FontAwesomeIcon icon={faBeer} />
      </button>
    </div>
  )
}

export default UserStats

