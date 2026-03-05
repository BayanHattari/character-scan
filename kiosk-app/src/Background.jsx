import React from 'react'
import './index.css'
import FaultyTerminal from './FaultyTerminal'

const Background = () => (
  <div className="faulty-terminal-container">
            <FaultyTerminal
              scale={1.8}
              gridMul={[2, 1]}
              digitSize={1.4}
              timeScale={1.1}
              pause={false}
              scanlineIntensity={0.5}
              glitchAmount={1}
              flickerAmount={1}
              noiseAmp={1}
              chromaticAberration={0}
              dither={0}
              curvature={0.04}
              tint="#3d5ab3"
              mouseReact
              mouseStrength={0.5}
              pageLoadAnimation
              brightness={0.6}
            />
          </div>
)

export default Background