import React, { useState, useEffect, useRef } from 'react'
import './index.css'
import uniLogo from './assets/uni_logo.png'
import techHubLogo from './assets/TechHublogo.png'
import FaultyTerminal from './FaultyTerminal'
import Background from './Background'
import cameraIcon from './assets/camera-icon.png'
import Video from './assets/Instructions_Video.mp4'

const App = () => {

  const [screen, setScreen] = useState("home")

  const countdownRef = useRef(null)

  const timerRef = useRef(null)

const inactivityTimerRef = useRef(null)
const lastHandDetectedRef = useRef(Date.now())

useEffect(() => {

  const startTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    inactivityTimerRef.current = setTimeout(() => {
      setScreen("home")
    }, 60000)
  }

  const resetTimer = () => {
    if (screen !== "home" && screen !== "camera") {
      startTimer()
    }
  }

  // -------- NORMAL SCREENS --------
  if (screen !== "camera") {
    window.addEventListener("click", resetTimer)
    window.addEventListener("touchstart", resetTimer)
    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("keydown", resetTimer)

    if (screen !== "home") {
      startTimer()
    }
  }

  // -------- CAMERA SCREEN --------
  if (screen === "camera") {
    lastHandDetectedRef.current = Date.now()
    startTimer()

    const interval = setInterval(() => {
      const now = Date.now()

      if (now - lastHandDetectedRef.current > 60000) {
        setScreen("home")
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(inactivityTimerRef.current)
    }
  }

  return () => {
    clearTimeout(inactivityTimerRef.current)

    window.removeEventListener("click", resetTimer)
    window.removeEventListener("touchstart", resetTimer)
    window.removeEventListener("mousemove", resetTimer)
    window.removeEventListener("keydown", resetTimer)
  }

}, [screen])

useEffect(() => {
  if (screen === "success") {
    let time = 8

    if (countdownRef.current) {
      countdownRef.current.textContent = time
    }

    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      time--

      if (time <= 0) {
        if (countdownRef.current) {
          countdownRef.current.textContent = 0
        }

        clearInterval(timerRef.current)
        timerRef.current = null
        setScreen("home")
        return
      }

      if (countdownRef.current) {
        countdownRef.current.textContent = time
      }
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }
}, [screen])

  return (
    <>
    
      {/* Black Navigation Bar With Logos */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo-left">
            <img src={techHubLogo} alt="TechHub Logo" />
          </div>
          <div className="logo-right">
            <img src={uniLogo} alt="University Logo" />
          </div>
        </div>
      </nav>

      {/* Home Screen */}
      {screen === "home" && (
      <div className="hero-section">
        <Background />
        <h1>Character Scan</h1>
        <p>Lighten up the Wall</p>
        <div className = "hero-btn">
          <button className = 'btn btn--outline btn--large' onClick={() => setScreen("instructions")} 
            >Get Started</button>
        </div>
      </div>
      )}

      {/* Instructions Screen */}
      {screen === "instructions" && (
  <div className="instructions-screen">
    <Background />
    <div className="instructions-container split-layout">

      {/* Instructions Text on the Left */}
      <div className="instructions-left">
        
        <h2>How It Works</h2>

        <ul>
          <li>🎯 <strong>Left Hand (Index Finger)</strong><br />
            Acts as your laser pointer / cursor.
          </li>

          <li>🤏 <strong>Right Hand (Pinch)</strong><br />
            Draw on the canvas or click UI buttons.
          </li>

          <li>✋ <strong>Right Hand (Open Palm)</strong><br />
            Swipe to erase lines.
          </li>

          <li>✌️ <strong>Peace Sign</strong><br />
            Hold 5 frames to lock drawing surface.
          </li>

          <li>↩️ <strong>Undo</strong><br />
            Hover + pinch to remove last stroke.
          </li>

          <li>🎨 <strong>Color Wheel</strong><br />
            Hover to preview, pinch to select.
          </li>
        </ul>

        {/* Buttons on the Instruction Screen */}
        <div className="instructions-buttons">
          <button 
            className="btn btn--outline btn--large"
            onClick={() => setScreen("home")}
          >
            Back
          </button>

          <button 
            className="btn btn--primary btn--large"
            onClick={() => setScreen("consent")}
          >
            Next
          </button>
        </div>
      </div>

      {/* Instruction Video on the Right */}
      <div className="instructions-right">
        <video 
          src={Video} alt="Video Instructions"
          autoPlay
          loop
          muted
          className="instruction-video"
        />
      </div>

    </div>
  </div>
)}

  {/* Consent Screen */}
{screen === "consent" && (
  <div className="instructions-screen">
    <Background />

    <div className="instructions-container consent-layout">

      <div className="consent-text">
        <h2>Consent</h2>
        <p>
          By continuing, you agree that the image you create
          will be displayed publicly on the interactive wall.
          <br /><br />
          If you do not wish your artwork to appear on the wall,
          please go back and exit the experience.
        </p>
      </div>


      <div className="consent-buttons">
        <button
          className="btn btn--outline btn--large"
          onClick={() => setScreen("instructions")}
        >
          Back
        </button>

        <button
          className="btn btn--primary btn--large"
          onClick={() => setScreen("camera")}
        >
          Accept
        </button>
      </div>
    </div>
  </div>
)}

{/* Camera Screen */}
{screen === "camera" && (
  <div className="camera-screen">

    <div className="camera-controls">
      <button
        className="back-btn"
        onClick={() => setScreen("consent")}>
        Back
      </button>

      <button
        className="camera-btn"
        onClick={() => setScreen("success")}>
        <img src={cameraIcon} alt="Camera" />
      </button>
    </div>

  </div>
)}

{/* Success Screen */}
{screen === "success" && (
  <div className="instructions-screen">
    <Background />

    <div className="instructions-container consent-layout">

      <p className="consent-text">
        <h2>Success ✔</h2>
        The image was successfully saved.
        <br />
        Returning to home in <span ref={countdownRef}>8</span> seconds...
      </p>

    </div>
  </div>
)}

    </>
  )
}

export default App   