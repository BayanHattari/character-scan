import React, { useState, useEffect, useRef } from 'react'
import './index.css'
import uniLogo from './assets/uni_logo.png'
import techHubLogo from './assets/TechHublogo.png'
import FaultyTerminal from './FaultyTerminal'
import Background from './Background'
import cameraIcon from './assets/camera-icon.png'
import Video from './assets/Instructions_Video.mp4'
import FacePaintCanvas from './FacePaintCanvas';

const App = () => {
  const [screen, setScreen] = useState("home")
  const [capturedImage, setCapturedImage] = useState(null)
  
  const inactivityTimerRef = useRef(null)
  const lastHandDetectedRef = useRef(Date.now())
  const canvasRef = useRef(null)

  const handleCapture = async () => {
    if (canvasRef.current) {
      const imageBlob = await canvasRef.current.exportImage()
      
      if (imageBlob) {
        const imageUrl = URL.createObjectURL(imageBlob)
        setCapturedImage(imageUrl)
        setScreen("success")
      }
    }
  }

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

    if (screen !== "camera") {
      window.addEventListener("click", resetTimer)
      window.addEventListener("touchstart", resetTimer)
      window.addEventListener("mousemove", resetTimer)
      window.addEventListener("keydown", resetTimer)

      if (screen !== "home") {
        startTimer()
      }
    }

    if (screen === "camera") {
      lastHandDetectedRef.current = Date.now()
      startTimer()

      const interval = setInterval(() => {
        const now = Date.now()

       /* if (now - lastHandDetectedRef.current > 60000) {
          setScreen("home")
        }*/
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

  return (
    <>
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

      {screen === "home" && (
      <div className="hero-section">
        <Background />
        <h1>Character Scan</h1>
        <p>Lighten up the Wall</p>
        <div className="hero-btn">
          <button className='btn btn--outline btn--large' onClick={() => setScreen("instructions")}>
            Get Started
          </button>
        </div>
      </div>
      )}

      {screen === "instructions" && (
        <div className="instructions-screen">
          <Background />
          <div className="instructions-container split-layout">

            <div className="instructions-left">
              <h2>How It Works</h2>
              <ul>
                <li>🎯 <strong>Left Hand (Index Finger)</strong><br /> Acts as your laser pointer / cursor.</li>
                <li>🤏 <strong>Right Hand (Pinch)</strong><br /> Draw on the canvas or click UI buttons.</li>
                <li>✋ <strong>Right Hand (Open Palm)</strong><br /> Swipe to erase lines.</li>
                <li>✌️ <strong>Peace Sign</strong><br /> Hold 5 frames to lock drawing surface.</li>
                <li>↩️ <strong>Undo</strong><br /> Hover + pinch to remove last stroke.</li>
                <li>🎨 <strong>Color Wheel</strong><br /> Hover to preview, pinch to select.</li>
              </ul>

              <div className="instructions-buttons">
                <button className="btn btn--outline btn--large" onClick={() => setScreen("home")}>Back</button>
                <button className="btn btn--primary btn--large" onClick={() => setScreen("consent")}>Next</button>
              </div>
            </div>

            <div className="instructions-right">
              <video 
                src={Video} alt="Video Instructions"
                autoPlay loop muted className="instruction-video"
              />
            </div>
          </div>
        </div>
      )}

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
              <button className="btn btn--outline btn--large" onClick={() => setScreen("instructions")}>Back</button>
              <button className="btn btn--primary btn--large" onClick={() => setScreen("camera")}>Accept</button>
            </div>
          </div>
        </div>
      )}

      {screen === "camera" && (
        <div className="camera-screen" style={{ 
            position: 'relative', 
            width: '100vw', 
            height: 'calc(100vh - 80px)',
            overflow: 'hidden' 
        }}>          
          <FacePaintCanvas ref={canvasRef} onCapture={handleCapture} />

          <div className="camera-controls" style={{ 
              position: 'absolute', 
              bottom: '100px', 
              left: '50%',
              transform: 'translateX(-50%)', 
              display: 'flex', 
              alignItems: 'center',
              zIndex: 9999 
            }}>
            
            <button 
              className="air-btn" 
              data-action="capture"
              onClick={handleCapture}
              style={{
                background: 'white',
                border: '4px solid #ccc',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img src={cameraIcon} alt="Camera" style={{ width: '40px', height: '40px', pointerEvents: 'none' }} />
            </button>
            
          </div>
        </div>
      )}

      {screen === "success" && (
        <div className="instructions-screen">
          <Background />
          <div className="instructions-container consent-layout">
            <div className="consent-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2>Success ✔</h2>
              <p>The image was successfully saved.</p>

              {capturedImage && (
                <img 
                  src={capturedImage} 
                  alt="Your Artwork" 
                  style={{ width: '300px', borderRadius: '12px', marginTop: '15px', border: '2px solid white' }} 
                />
              )}

              <button 
                className="btn btn--primary btn--large" 
                style={{ marginTop: '30px' }}
                onClick={() => setScreen("home")}
              >
                Start New Session
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default App
