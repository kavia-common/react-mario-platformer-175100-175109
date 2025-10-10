 // PUBLIC_INTERFACE
export default function HUD({ score = 0, lives = 3 }) {
  /** Displays top HUD with score and lives. */
  return (
    <div className="hud">
      <div className="slot">
        <span className="lives" aria-label="Lives">❤️ x {lives}</span>
      </div>
      <div className="slot" style={{ textAlign: 'center' }}>
        <span className="score" aria-label="Score">Score: {score}</span>
      </div>
      <div className="slot" style={{ width: 80 }} />
    </div>
  );
}
