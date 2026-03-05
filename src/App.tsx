import { useState, useEffect } from 'react'
import NameEntry from './components/NameEntry'
import CounterButton from './components/CounterButton'
import Leaderboard from './components/Leaderboard'
import UserStats from './components/UserStats'
import HistorySummary from './components/HistorySummary'
import RulesModal from './components/RulesModal'

const STORAGE_KEY = 'tap-counter-user-name'

type Screen = 'counter' | 'leaderboard' | 'stats' | 'history'

function App() {
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState<Screen>('counter')
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    const storedName = localStorage.getItem(STORAGE_KEY)
    setUserName(storedName)
    setIsLoading(false)
  }, [])

  const handleNameSubmit = (name: string) => {
    localStorage.setItem(STORAGE_KEY, name)
    setUserName(name)
  }

  if (isLoading) {
    return null
  }

  if (!userName) {
    return <NameEntry onSubmit={handleNameSubmit} />
  }

  if (currentScreen === 'leaderboard') {
    return (
      <Leaderboard 
        onBack={() => setCurrentScreen('counter')} 
        currentUser={userName}
      />
    )
  }

  if (currentScreen === 'stats') {
    return (
      <UserStats
        userName={userName}
        onBack={() => setCurrentScreen('counter')}
        onHistory={() => setCurrentScreen('history')}
      />
    )
  }

  if (currentScreen === 'history') {
    return (
      <HistorySummary
        userName={userName}
        onBack={() => setCurrentScreen('stats')}
      />
    )
  }

  return (
    <>
      <CounterButton 
        userName={userName} 
        onLeaderboard={() => setCurrentScreen('leaderboard')}
        onStats={() => setCurrentScreen('stats')}
        onRules={() => setShowRules(true)}
      />
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </>
  )
}

export default App
