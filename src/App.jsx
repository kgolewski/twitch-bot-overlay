import DuelOverlay from './components/DuelOverlay.jsx';
import useDuelSocket from './hooks/useDuelSocket.js';

function App() {
  const {
    duel,
    connectionStatus,
    battleLog,
    currentTurnIndex,
    setCurrentTurnIndex,
  } = useDuelSocket();

  return (
    <div className="app-shell">
      <DuelOverlay
        duel={duel}
        connectionStatus={connectionStatus}
        battleLog={battleLog}
        currentTurnIndex={currentTurnIndex}
        setCurrentTurnIndex={setCurrentTurnIndex}
      />
    </div>
  );
}

export default App;
