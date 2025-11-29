import { useEffect, useState } from 'react'
import './Splash.css'
import banner from '../assets/baner-header.png'

export default function Splash() {
  const [visible, setVisible] = useState(true)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    let hideTimer = null

    function tryHide() {
      // start fade-out
      setFade(true)
      // remove after animation
      hideTimer = setTimeout(() => setVisible(false), 450)
    }

    // Prefer the window load event; fallback to short timeout
    if (document.readyState === 'complete') {
      tryHide()
    } else {
      window.addEventListener('load', tryHide)
      // Safety timeout in case load doesn't fire in dev
      const fallback = setTimeout(tryHide, 800)

      return () => {
        window.removeEventListener('load', tryHide)
        clearTimeout(fallback)
        clearTimeout(hideTimer)
      }
    }

    return () => clearTimeout(hideTimer)
  }, [])

  if (!visible) return null

  return (
    <div className={`app-splash ${fade ? 'fade' : ''}`} role="status" aria-live="polite">
      <div className="splash-inner">
        <img src={banner} alt="Skydale DryFruits" className="splash-logo" />
        <div className="splash-title">Skydale DryFruits</div>
      </div>
    </div>
  )
}
