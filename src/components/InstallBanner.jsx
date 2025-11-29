import { useEffect, useState } from 'react'
import './InstallBanner.css'

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return // already installed

    function onBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // If iOS and not standalone, show the instructions banner
    if (isIos() && !isInStandaloneMode()) {
      setVisible(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  async function handleInstallClick() {
    if (!deferredPrompt) {
      // nothing to prompt; hide if iOS fallback instructions already shown
      setVisible(false)
      return
    }
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    // Optionally handle accepted/ dismissed
    // console.log('userChoice', choice)
    setDeferredPrompt(null)
    setVisible(false)
  }

  function handleClose() {
    setVisible(false)
  }

  if (!visible) return null

  const ios = isIos() && !isInStandaloneMode()

  return (
    <div className="install-banner" role="dialog" aria-label="Install app banner">
      <div className="install-content">
        <div className="install-text">
          {ios ? (
            <>
              Install this app: <strong>Tap Share → Add to Home Screen</strong>
            </>
          ) : (
            <>Install this app for a better experience.</>
          )}
        </div>

        <div className="install-actions">
          {!ios && (
            <button className="install-btn" onClick={handleInstallClick} aria-label="Install app">Install App</button>
          )}
          <button className="install-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>
      </div>
    </div>
  )
}
