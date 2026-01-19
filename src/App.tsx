import { useState, useEffect } from 'react'
import NameEntry from './components/NameEntry'
import CounterButton from './components/CounterButton'

const STORAGE_KEY = 'tap-counter-user-name'

function App() {
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  return <CounterButton userName={userName} />
}

export default App
