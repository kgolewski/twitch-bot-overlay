import DuelOverlay from './components/DuelOverlay.jsx';
import useDuelSocket from './hooks/useDuelSocket.js';

function App() {
  const { duel, connectionStatus } = useDuelSocket();

  return (
    <div className="app-shell">
      <DuelOverlay duel={duel} connectionStatus={connectionStatus} />
    </div>
  );
}

export default App;
