import { useState } from 'react'
import type { FormEvent } from 'react'
import styles from './NameEntry.module.css'

interface NameEntryProps {
  onSubmit: (name: string) => void
}

function NameEntry({ onSubmit }: NameEntryProps) {
  const [name, setName] = useState('')
  const [isShaking, setIsShaking] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      return
    }
    
    onSubmit(trimmedName)
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>GUINNESS 2026 Counter</h1>
        <p className={styles.subtitle}>Enter your name to begin</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={`${styles.input} ${isShaking ? styles.shake : ''}`}
            autoFocus
            autoComplete="name"
            autoCapitalize="words"
            aria-label="Your name"
          />
          <button 
            type="submit" 
            className={styles.button}
            aria-label="Continue"
          >
            START
          </button>
        </form>
      </div>
    </div>
  )
}

export default NameEntry
