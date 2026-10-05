
export default function UIOverlay({
  fishCount,
  onSpawnFish,
  onFeedAll,
  onClearAll,
  waterClarity,
  setWaterClarity,
  timeOfDay,
  setTimeOfDay,
  temperature,
  setTemperature
}) {
  // Convert timeOfDay value (0 to 1) to a readable string
  const getTimeString = () => {
    if (timeOfDay < 0.3) return 'Night'
    if (timeOfDay > 0.7) return 'Sunset'
    return 'Daylight'
  }

  // Calculate dynamic pH based on temperature and clarity
  const calculatedPH = (7.2 + (waterClarity / 100) * 0.4 - (temperature - 24) * 0.05).toFixed(1)

  return (
    <div className="ui-overlay-container">
      {/* Header Panel */}
      <div className="hud-card glass-panel header-hud animate-fade-in">
        <h1>AquaWebGL</h1>
        <p className="status-indicator">
          <span className="pulse-dot"></span> System Live • R3F Renderer
        </p>
      </div>

      {/* Control Panel (Sidebar) */}
      <div className="hud-card glass-panel control-hud animate-slide-in-right">
        <h2>Aquarium Control</h2>
        
        {/* Spawn Buttons */}
        <div className="control-section">
          <h3>Spawn Species</h3>
          <div className="btn-grid">
            <button className="btn btn-clown" onClick={() => onSpawnFish('clownfish')}>
              Spawn Clownfish
            </button>
            <button className="btn btn-blue" onClick={() => onSpawnFish('bluetang')}>
              Spawn Blue Tang
            </button>
            <button className="btn btn-gold" onClick={() => onSpawnFish('goldfish')}>
              Spawn Goldfish
            </button>
            <button className="btn btn-shark" onClick={() => onSpawnFish('shark')}>
              Spawn Shark
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="control-section">
          <h3>Quick Actions</h3>
          <div className="btn-flex">
            <button className="btn btn-action" onClick={onFeedAll}>
              Feed All Flakes
            </button>
            <button className="btn btn-danger" onClick={onClearAll}>
              Reset Tank
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="control-section">
          <h3>Parameters</h3>
          
          <div className="slider-group">
            <div className="slider-label">
              <span>Water Clarity</span>
              <span className="value-badge">{waterClarity}%</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="100" 
              value={waterClarity} 
              onChange={(e) => setWaterClarity(Number(e.target.value))} 
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Time of Day</span>
              <span className="value-badge">{getTimeString()}</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.05"
              value={timeOfDay} 
              onChange={(e) => setTimeOfDay(Number(e.target.value))} 
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Temperature</span>
              <span className="value-badge">{temperature}°C</span>
            </div>
            <input 
              type="range" 
              min="18" 
              max="32" 
              step="0.5"
              value={temperature} 
              onChange={(e) => setTemperature(Number(e.target.value))} 
            />
          </div>
        </div>
      </div>

      {/* Stats Dashboard (Bottom HUD) */}
      <div className="hud-card glass-panel stats-hud animate-slide-in-bottom">
        <h2>Live Telemetry</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Fish Population</span>
            <span className="stat-value text-glowing">{fishCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Water Temperature</span>
            <span className={`stat-value ${temperature > 28 || temperature < 20 ? 'text-warn' : 'text-success'}`}>
              {temperature}°C
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">pH Level</span>
            <span className="stat-value">{calculatedPH}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Filter Status</span>
            <span className="stat-value text-success">98% (Optimal)</span>
          </div>
        </div>
      </div>

      {/* Guide/Controls HUD */}
      <div className="hud-card glass-panel guide-hud animate-fade-in">
        <h3>Interactions</h3>
        <ul>
          <li>🖱️ <strong>Drag</strong> to Rotate Camera</li>
          <li>🔍 <strong>Scroll</strong> to Zoom in/out</li>
          <li>🌊 <strong>Click Water Surface</strong> to Drop Food</li>
          <li>🐟 <strong>Click a Fish</strong> to Scare it!</li>
        </ul>
      </div>
    </div>
  )
}
