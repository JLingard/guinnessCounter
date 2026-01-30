import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faBeer, faClock, faTrophy, faChartSimple, faPercent } from '@fortawesome/free-solid-svg-icons'
import styles from './RulesModal.module.css'

interface RulesModalProps {
  onClose: () => void
}

function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
        
        <h2 className={styles.title}>How It Works</h2>
        
        <div className={styles.rules}>
          <div className={styles.rule}>
            <span className={styles.ruleIcon}><FontAwesomeIcon icon={faBeer} /></span>
            <div className={styles.ruleContent}>
              <h3>Tap to Log</h3>
              <p>Each tap adds one Guinness to your tally</p>
            </div>
          </div>
          
          <div className={styles.rule}>
            <span className={styles.ruleIcon}><FontAwesomeIcon icon={faClock} /></span>
            <div className={styles.ruleContent}>
              <h3>Hold to Remove</h3>
              <p>Made a mistake? Hold the pint for a moment to remove the last one</p>
            </div>
          </div>

          <div className={styles.rule}>
            <span className={`${styles.ruleIcon} ${styles.halfPintIcon}`}><FontAwesomeIcon icon={faBeer} /></span>
            <div className={styles.ruleContent}>
              <h3>Half Pint Mode</h3>
              <p>Tap the pint icon in the menu to switch between full pint (1) and half pint (0.5)</p>
            </div>
          </div>
          
          <div className={styles.rule}>
            <span className={styles.ruleIcon}><FontAwesomeIcon icon={faTrophy} /></span>
            <div className={styles.ruleContent}>
              <h3>Leaderboard</h3>
              <p>See how you stack up against everyone else</p>
            </div>
          </div>
          
          <div className={styles.rule}>
            <span className={styles.ruleIcon}><FontAwesomeIcon icon={faChartSimple} /></span>
            <div className={styles.ruleContent}>
              <h3>Your Stats</h3>
              <p>Track your drinking habits with fun insights</p>
            </div>
          </div>

          <div className={styles.rule}>
            <span className={styles.ruleIcon}><FontAwesomeIcon icon={faPercent} /></span>
            <div className={styles.ruleContent}>
              <h3>0% Counts Too!</h3>
              <p>Guinness 0.0 is still Guinness. Log it with pride!</p>
            </div>
          </div>
        </div>
        
        <p className={styles.footer}>
          Drink responsibly. Sláinte! 🍀
        </p>
      </div>
    </div>
  )
}

export default RulesModal

