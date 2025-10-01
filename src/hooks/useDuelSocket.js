import { useEffect, useMemo, useRef, useState } from 'react';

const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};

const SAMPLE_DUEL = {
  active: true,
  round: 3,
  lastAction: 'MageFox dealt 24 damage with Fireball!',
  challenger: {
    username: 'MageFox',
    hp: 56,
    maxHp: 120,
    skin: 'arcane',
    damageDealt: 142,
    combo: 2,
  },
  opponent: {
    username: 'ShadowWolf',
    hp: 32,
    maxHp: 130,
    skin: 'shadow',
    damageDealt: 98,
    combo: null,
  },
};

function useDuelSocket() {
  const [duel, setDuel] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATES.DISCONNECTED);
  const socketRef = useRef(null);

  useEffect(() => {
    setConnectionStatus(CONNECTION_STATES.CONNECTING);

    const timeout = setTimeout(() => {
      setConnectionStatus(CONNECTION_STATES.CONNECTED);
      setDuel(SAMPLE_DUEL);
    }, 800);

    return () => {
      clearTimeout(timeout);
      if (socketRef.current) {
        socketRef.current.close?.();
        socketRef.current = null;
      }
      setConnectionStatus(CONNECTION_STATES.DISCONNECTED);
    };
  }, []);

  const send = useMemo(() => {
    return (type, payload) => {
      if (!socketRef.current || connectionStatus !== CONNECTION_STATES.CONNECTED) {
        console.warn('Attempted to send through closed socket', type, payload);
        return;
      }
      socketRef.current.send(JSON.stringify({ type, payload }));
    };
  }, [connectionStatus]);

  return { duel, connectionStatus, send };
}

export default useDuelSocket;
