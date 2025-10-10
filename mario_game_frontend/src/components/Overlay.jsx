 // PUBLIC_INTERFACE
export default function Overlay({ paused, gameOver, onRestart, onTogglePause }) {
  /** Displays overlay for Paused or Game Over states. */
  if (!paused && !gameOver) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-card">
        {gameOver ? (
          <>
            <h2 style={{ margin: '6px 0' }}>Game Over</h2>
            <p style={{ margin: '0 0 12px 0', opacity: .85 }}>Thanks for playing.</p>
            <button className="button" onClick={onRestart}>Restart</button>
          </>
        ) : (
          <>
            <h2 style={{ margin: '6px 0' }}>Paused</h2>
            <p style={{ margin: '0 0 12px 0', opacity: .85 }}>Press P to resume</p>
            <button className="button secondary" onClick={onTogglePause}>Resume</button>
          </>
        )}
      </div>
    </div>
  );
}
