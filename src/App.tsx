import { useState, useEffect } from 'react'
import NameEntry from './components/NameEntry'
import CounterButton from './components/CounterButton'
import Leaderboard from './components/Leaderboard'

const STORAGE_KEY = 'tap-counter-user-name'

type Screen = 'counter' | 'leaderboard'

function App() {
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState<Screen>('counter')

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

  return (
    <CounterButton 
      userName={userName} 
      onLeaderboard={() => setCurrentScreen('leaderboard')}
    />
  )
}

export default App
