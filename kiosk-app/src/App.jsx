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
  const [capturedImage, setCapturedImage] = useState(null); // Added state for the image
  
  const inactivityTimerRef = useRef(null)
  const lastHandDetectedRef = useRef(Date.now())
  const canvasRef = useRef(null); // Added ref for the canvas

  // --- Handlers ---
  const handleCapture = async () => {
    if (canvasRef.current) {
      // Call the exportImage function exposed via useImperativeHandle
      const imageBlob = await canvasRef.current.exportImage();
      
      if (imageBlob) {
        // Convert the blob to a local URL so we can display it later
        const imageUrl = URL.createObjectURL(imageBlob);
        setCapturedImage(imageUrl);
        <FacePaintCanvas ref={canvasRef} onCapture={handleCapture} />
        // Move to the success screen
        setScreen("success");
      }
    }
  };

  // --- Effects ---
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

  
  // --- Render ---
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
                <li>🎯 <strong>Left Hand (Index Finger)</strong><br /> Acts as your laser pointer / cursor.</li>
                <li>🤏 <strong>Right Hand (Pinch)</strong><br /> Draw on the canvas or click UI buttons.</li>
                <li>✋ <strong>Right Hand (Open Palm)</strong><br /> Swipe to erase lines.</li>
                <li>✌️ <strong>Peace Sign</strong><br /> Hold 5 frames to lock drawing surface.</li>
                <li>↩️ <strong>Undo</strong><br /> Hover + pinch to remove last stroke.</li>
                <li>🎨 <strong>Color Wheel</strong><br /> Hover to preview, pinch to select.</li>
              </ul>

              {/* Buttons on the Instruction Screen */}
              <div className="instructions-buttons">
                <button className="btn btn--outline btn--large" onClick={() => setScreen("home")}>Back</button>
                <button className="btn btn--primary btn--large" onClick={() => setScreen("consent")}>Next</button>
              </div>
            </div>

            {/* Instruction Video on the Right */}
            <div className="instructions-right">
              <video 
                src={Video} alt="Video Instructions"
                autoPlay loop muted className="instruction-video"
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
              <button className="btn btn--outline btn--large" onClick={() => setScreen("instructions")}>Back</button>
              <button className="btn btn--primary btn--large" onClick={() => setScreen("camera")}>Accept</button>
            </div>
          </div>
        </div>
      )}

    {/* Camera Screen */}
      {screen === "camera" && (
<div className="camera-screen" style={{ 
    position: 'relative', 
    width: '100vw', 
    height: 'calc(100vh - 80px)', // خصمنا مساحة الهيدر التقريبية
    overflow: 'hidden' 
}}>          
     {/* Mount the Canvas Component here */}
<FacePaintCanvas ref={canvasRef} onCapture={handleCapture} />

          {/* Controls layered over the canvas */}
          {/* Controls layered over the canvas */}
          <div className="camera-controls" style={{ 
              position: 'absolute', 
              bottom: '100px', /* رفعنا الزر للأعلى ليكون واضحاً في الشاشة */
              left: '50%',
              transform: 'translateX(-50%)', 
              display: 'flex', 
              alignItems: 'center',
              zIndex: 9999 
            }}>
            
            {/* الزر بعد ترقيته ليقرأ حركة اليد */}
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
              {/* أضفنا pointerEvents: 'none' لكي لا تعيق الصورة حركة الإصبع */}
              <img src={cameraIcon} alt="Camera" style={{ width: '40px', height: '40px', pointerEvents: 'none' }} />
            </button>
            
          </div>
        </div>
      )}

    {/* Success Screen */}
      {screen === "success" && (
        <div className="instructions-screen">
          <Background />
          <div className="instructions-container consent-layout">
            <div className="consent-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2>Success ✔</h2>
              <p>The image was successfully saved.</p>

              {/* Show a preview of the drawing */}
              {capturedImage && (
                <img 
                  src={capturedImage} 
                  alt="Your Artwork" 
                  style={{ width: '300px', borderRadius: '12px', marginTop: '15px', border: '2px solid white' }} 
                />
              )}

              {/* Reset Button */}
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