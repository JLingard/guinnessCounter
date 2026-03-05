import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBeer } from '@fortawesome/free-solid-svg-icons'
import styles from './HistorySummary.module.css'
import { API_ENDPOINT } from '../config'

interface HistorySummaryProps {
  userName: string
  onBack: () => void
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Use local date parts throughout to avoid UTC-vs-local timezone mismatches
function localMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDayLabel(dateKey: string): string {
  // Construct with explicit parts to avoid UTC-offset shifts
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface MonthBar {
  key: string   // YYYY-MM
  label: string // e.g. "Jan 26"
  count: number
  isCurrent: boolean
}

interface DayEntry {
  dateKey: string // YYYY-MM-DD
  label: string
  count: number
}

function processData(timestamps: string[]): { months: MonthBar[]; days: DayEntry[] } {
  if (timestamps.length === 0) return { months: [], days: [] }

  const currentMonthKey = localMonthKey(new Date())

  const monthCounts: Record<string, number> = {}
  const dayCounts: Record<string, number> = {}

  timestamps.forEach(ts => {
    const date = new Date(ts)
    const mKey = localMonthKey(date)
    const dKey = localDateKey(date)
    monthCounts[mKey] = (monthCounts[mKey] || 0) + 1
    dayCounts[dKey] = (dayCounts[dKey] || 0) + 1
  })

  const months: MonthBar[] = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [year, month] = key.split('-')
      const label = `${MONTH_ABBR[parseInt(month) - 1]} ${year.slice(2)}`
      return { key, label, count, isCurrent: key === currentMonthKey }
    })

  const days: DayEntry[] = Object.entries(dayCounts)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, count]) => ({
      dateKey,
      label: formatDayLabel(dateKey),
      count,
    }))

  return { months, days }
}

const MIN_BAR_HEIGHT_PX = 14
const MAX_BAR_HEIGHT_PX = 140
// Only hint at scroll when there are enough bars to overflow a typical mobile screen
const SCROLL_THRESHOLD = 4

function HistorySummary({ userName, onBack }: HistorySummaryProps) {
  const [timestamps, setTimestamps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINT}?action=getUserTimestamps&name=${encodeURIComponent(userName)}`,
          { signal: controller.signal }
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        setTimestamps(data.timestamps ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Failed to load your history')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    return () => controller.abort()
  }, [userName])

  const { months, days } = useMemo(() => processData(timestamps), [timestamps])

  const maxMonthCount = useMemo(
    () => months.reduce((max, m) => Math.max(max, m.count), 0),
    [months]
  )

  const isScrollable = months.length > SCROLL_THRESHOLD

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your history...</div>
        <button className={styles.backButton} onClick={onBack} aria-label="Back to stats">
          <FontAwesomeIcon icon={faBeer} />
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button className={styles.backButton} onClick={onBack} aria-label="Back to stats">
          <FontAwesomeIcon icon={faBeer} />
        </button>
      </div>
    )
  }

  if (timestamps.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>History</h1>
        <div className={styles.empty}>
          <p>No Guinnesses logged yet!</p>
          <p className={styles.emptyHint}>Tap that pint to get started</p>
        </div>
        <button className={styles.backButton} onClick={onBack} aria-label="Back to stats">
          <FontAwesomeIcon icon={faBeer} />
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>History</h1>
      <p className={styles.subtitle}>{userName}'s full record</p>

      {/* Monthly bar chart */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>By Month</p>
        <div
          className={`${styles.chartWrapper} ${isScrollable ? styles.chartWrapperScrollable : ''}`}
          role="img"
          aria-label={`Monthly pints chart: ${months.map(m => `${m.label} ${m.count} pint${m.count !== 1 ? 's' : ''}`).join(', ')}`}
        >
          <div className={styles.chart}>
            {months.map(m => {
              const heightPx = maxMonthCount > 0
                ? Math.max(MIN_BAR_HEIGHT_PX, Math.round((m.count / maxMonthCount) * MAX_BAR_HEIGHT_PX))
                : MIN_BAR_HEIGHT_PX
              return (
                <div key={m.key} className={styles.barCol}>
                  <span className={styles.barCount}>{m.count}</span>
                  <div
                    className={`${styles.bar} ${m.isCurrent ? styles.barCurrent : ''}`}
                    style={{ height: `${heightPx}px` }}
                  />
                  <span className={styles.barLabel}>{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Daily log */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Daily Log</p>
        <div className={styles.dayList}>
          {days.map(d => (
            <div key={d.dateKey} className={styles.dayEntry}>
              <span className={styles.dayDate}>{d.label}</span>
              <span className={styles.dayCount}>
                <FontAwesomeIcon icon={faBeer} className={styles.dayIcon} />
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.backButton} onClick={onBack} aria-label="Back to stats">
        <FontAwesomeIcon icon={faBeer} />
      </button>
    </div>
  )
}

export default HistorySummary
