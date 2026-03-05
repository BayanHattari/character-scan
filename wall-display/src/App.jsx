import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [photos, setPhotos] = useState([]);
  
  // Backend server endpoint provided by the team
  const API_URL = "https://memorial-wall-backend.onrender.com/photos"; 

  // Function to fetch visitor photos from the server
  const fetchPhotos = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  };

  useEffect(() => {
    fetchPhotos();
    // Auto-refresh the wall every 5 seconds to load new visitors
    const interval = setInterval(fetchPhotos, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="wall-container">
      {/* Static photo grid that expands automatically with new content */}
      <div className="photo-grid">
        {photos.map((photo) => (
          <img 
            key={photo.id} 
            src={photo.url} 
            className="visitor-photo" 
            alt="Visitor" 
          />
        ))}
      </div>

      {/* Main Techub logo centered on the screen */}
      <img 
        src="https://i.postimg.cc/Fsz36s0G/f2e875cb-e556-4f1b-9c06-372df59f83b5.png" 
        className="logo-overlay" 
        alt="Techub Logo" 
      />
    </div>
  );
}

export default App;
