import { useEffect, useMemo, useRef, useState } from 'react';

const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};

const DEFAULT_SOCKET_URL = import.meta.env.VITE_OVERLAY_WS_URL ?? 'ws://localhost:7071';
const CHANNEL_FILTER = (import.meta.env.VITE_OVERLAY_CHANNEL || '').trim().toLowerCase();
const RECONNECT_BASE_DELAY = 3000;
const MAX_RECONNECT_DELAY = 15000;

function safeParseJSON(message) {
  try {
    return JSON.parse(message);
  } catch (error) {
    console.warn('Overlay socket received invalid JSON:', message, error);
    return null;
  }
}

function matchesChannel(eventChannel) {
  if (!CHANNEL_FILTER) return true;
  if (!eventChannel) return false;
  const normalized = eventChannel.replace(/^#/, '').toLowerCase();
  const desired = CHANNEL_FILTER.replace(/^#/, '');
  return normalized === desired;
}

function useDuelSocket() {
  const [duel, setDuel] = useState(null);
  const [battleLog, setBattleLog] = useState(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATES.DISCONNECTED);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      try {
        setConnectionStatus(CONNECTION_STATES.CONNECTING);
        const socket = new WebSocket(DEFAULT_SOCKET_URL);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          reconnectAttemptsRef.current = 0;
          setConnectionStatus(CONNECTION_STATES.CONNECTED);
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          const payload = safeParseJSON(event.data);
          if (!payload) return;

          if (!matchesChannel(payload.channel)) {
            return;
          }

          if (payload.type === 'duel_state' && payload.duel) {
            setDuel(payload.duel);
            setBattleLog(null);
            setCurrentTurnIndex(0);
          } else if (payload.type === 'duel_battle_log' && payload.duel) {
            setBattleLog(payload.duel);
            setDuel({
              id: payload.duel.id,
              status: payload.duel.status,
              active: false,
              round: payload.duel.rounds,
              lastAction: payload.duel.log[payload.duel.log.length - 1]?.description ?? '',
              challenger: payload.duel.combatants?.challenger ?? null,
              opponent: payload.duel.combatants?.opponent ?? null,
              result: {
                winner: payload.duel.winner,
                loser: payload.duel.loser,
                gold: payload.duel.reward?.gold ?? 0,
                exp: payload.duel.reward?.exp ?? 0,
              },
            });
            setCurrentTurnIndex(0);
          } else if (payload.type === 'connection' && payload.status === 'connected') {
            setConnectionStatus(CONNECTION_STATES.CONNECTED);
          }
        };

        socket.onerror = (err) => {
          console.error('Overlay socket error', err);
          if (!isMounted) return;
          setConnectionStatus(CONNECTION_STATES.ERROR);
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setConnectionStatus(CONNECTION_STATES.DISCONNECTED);
          setDuel((current) => (current?.active ? { ...current, active: false } : current));

          const attempt = reconnectAttemptsRef.current + 1;
          reconnectAttemptsRef.current = attempt;
          const delay = Math.min(RECONNECT_BASE_DELAY * attempt, MAX_RECONNECT_DELAY);

          reconnectTimeoutRef.current = setTimeout(connect, delay);
        };
      } catch (error) {
        console.error('Failed to initialize overlay socket', error);
        setConnectionStatus(CONNECTION_STATES.ERROR);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (error) {
          console.warn('Error closing overlay socket', error);
        }
        socketRef.current = null;
      }
      setConnectionStatus(CONNECTION_STATES.DISCONNECTED);
    };
  }, []);

  const send = useMemo(() => {
    return (type, payload) => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        console.warn('Attempted to send through closed socket', type, payload);
        return;
      }

      socketRef.current.send(
        JSON.stringify({
          type,
          payload,
        })
      );
    };
  }, []);

  return {
    duel,
    connectionStatus,
    battleLog,
    currentTurnIndex,
    setCurrentTurnIndex,
    send,
  };
}

export default useDuelSocket;
