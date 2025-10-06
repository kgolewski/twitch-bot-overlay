import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import DuelParticipant, { duelParticipantShape } from './DuelParticipant.jsx';
import ConnectionBadge from './ConnectionBadge.jsx';
import '../styles/overlay.css';

const turnShape = PropTypes.shape({
  turn: PropTypes.number.isRequired,
  attacker: PropTypes.string.isRequired,
  defender: PropTypes.string.isRequired,
  attackType: PropTypes.string.isRequired,
  damage: PropTypes.number.isRequired,
  crit: PropTypes.bool,
  defenderHpAfter: PropTypes.number.isRequired,
  attackerHpAfter: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
});

function DuelOverlay({
  duel = null,
  connectionStatus = 'idle',
  battleLog = null,
  currentTurnIndex = 0,
  setCurrentTurnIndex,
}) {
  const hasBattleLog = Boolean(battleLog?.log?.length);
  const turns = battleLog?.log ?? [];
  const totalTurns = turns.length;
  const safeTurnIndex = hasBattleLog ? Math.min(Math.max(currentTurnIndex, 0), totalTurns - 1) : -1;
  const activeTurn = hasBattleLog && safeTurnIndex >= 0 ? turns[safeTurnIndex] : null;

  useEffect(() => {
    if (!hasBattleLog) return undefined;
    if (safeTurnIndex >= totalTurns - 1) return undefined;
    if (typeof setCurrentTurnIndex !== 'function') return undefined;

    const timer = window.setTimeout(() => {
      setCurrentTurnIndex((idx) => {
        if (typeof idx !== 'number') return safeTurnIndex + 1;
        return Math.min(idx + 1, totalTurns - 1);
      });
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [hasBattleLog, safeTurnIndex, totalTurns, setCurrentTurnIndex]);

  const computedParticipants = useMemo(() => {
    if (hasBattleLog) {
      const roles = battleLog.roles ?? {};
      const participants = battleLog.participants ?? {};
      const combatants = battleLog.combatants ?? {};
      const challengerKey = roles.challenger ?? combatants.challenger?.username;
      const opponentKey = roles.opponent ?? combatants.opponent?.username;

      let challengerHp = participants[challengerKey]?.hpStart
        ?? combatants.challenger?.hp
        ?? duel?.challenger?.hp
        ?? duel?.challenger?.maxHp
        ?? 100;
      let opponentHp = participants[opponentKey]?.hpStart
        ?? combatants.opponent?.hp
        ?? duel?.opponent?.hp
        ?? duel?.opponent?.maxHp
        ?? 100;
      let challengerDamage = 0;
      let opponentDamage = 0;

      if (safeTurnIndex >= 0) {
        for (let i = 0; i <= safeTurnIndex; i += 1) {
          const turn = turns[i];
          if (!turn) continue;
          if (turn.attacker === challengerKey) {
            challengerDamage += turn.damage;
            opponentHp = turn.defenderHpAfter;
            challengerHp = turn.attackerHpAfter;
          } else if (turn.attacker === opponentKey) {
            opponentDamage += turn.damage;
            challengerHp = turn.defenderHpAfter;
            opponentHp = turn.attackerHpAfter;
          }
        }
      }

      const challengerBase = combatants.challenger ?? duel?.challenger ?? null;
      const opponentBase = combatants.opponent ?? duel?.opponent ?? null;

      return {
        challenger: challengerBase
          ? {
              ...challengerBase,
              username: challengerKey ?? challengerBase.username,
              hp: challengerHp,
              maxHp:
                participants[challengerKey]?.maxHp
                ?? challengerBase.maxHp
                ?? duel?.challenger?.maxHp
                ?? 100,
              damageDealt: challengerDamage,
            }
          : null,
        opponent: opponentBase
          ? {
              ...opponentBase,
              username: opponentKey ?? opponentBase.username,
              hp: opponentHp,
              maxHp:
                participants[opponentKey]?.maxHp
                ?? opponentBase.maxHp
                ?? duel?.opponent?.maxHp
                ?? 100,
              damageDealt: opponentDamage,
            }
          : null,
      };
    }

    return {
      challenger: duel?.challenger ?? null,
      opponent: duel?.opponent ?? null,
    };
  }, [battleLog, duel, hasBattleLog, safeTurnIndex, turns]);

  const headerTitle = useMemo(() => {
    if (hasBattleLog) {
      if (safeTurnIndex < totalTurns - 1) {
        return `Turn ${safeTurnIndex + 1} of ${totalTurns}`;
      }
      return 'Battle concluded';
    }

    const status = duel?.status ?? 'idle';
    switch (status) {
      case 'pending':
        return 'Duel challenge pending';
      case 'in_progress':
        return 'Duel in progress';
      case 'completed':
        return 'Duel concluded';
      case 'declined':
        return 'Duel declined';
      case 'expired':
        return 'Duel expired';
      default:
        return 'Recent duel';
    }
  }, [duel, hasBattleLog, safeTurnIndex, totalTurns]);

  const roundLabel = useMemo(() => {
    if (hasBattleLog) {
      return totalTurns ? `${totalTurns} rounds simulated` : 'Preparing battle log';
    }
    if (!duel) return '';
    const status = duel.status ?? 'idle';
    switch (status) {
      case 'pending':
        return 'Awaiting response';
      case 'completed':
        return `Final round ${duel.round ?? 0}`;
      case 'declined':
      case 'expired':
        return 'No rounds fought';
      default:
        return `Round ${duel.round ?? 0}`;
    }
  }, [duel, hasBattleLog, totalTurns]);

  const summary = useMemo(() => {
    if (!hasBattleLog || safeTurnIndex < totalTurns - 1) return null;
    return {
      winner: battleLog?.winner,
      loser: battleLog?.loser,
      reward: battleLog?.reward,
    };
  }, [battleLog, hasBattleLog, safeTurnIndex, totalTurns]);

  const renderedTurns = useMemo(() => {
    if (!hasBattleLog) return [];
    return turns.slice(0, safeTurnIndex + 1);
  }, [hasBattleLog, turns, safeTurnIndex]);

  const duelExists = hasBattleLog || Boolean(duel);
  const logEntry = activeTurn?.description || duel?.lastAction || 'Awaiting next move...';

  return (
    <div className="overlay">
      <ConnectionBadge status={connectionStatus} />
      {duelExists ? (
        <div className={`duel-card${hasBattleLog ? ' duel-card--animated' : ''}`}>
          <header className="duel-card__header">
            <span className="duel-card__title">{headerTitle}</span>
            {roundLabel && <span className="duel-card__round">{roundLabel}</span>}
          </header>
          <section className="duel-card__body">
            <DuelParticipant
              player={computedParticipants.challenger}
              alignment="left"
            />
            <div className="duel-card__vs">
              <span>VS</span>
            </div>
            <DuelParticipant
              player={computedParticipants.opponent}
              alignment="right"
            />
          </section>
          <footer className="duel-card__footer">
            <p className="duel-card__log-entry">{logEntry}</p>
            {hasBattleLog ? (
              <div className="duel-card__timeline">
                {renderedTurns.map((turn) => (
                  <div
                    key={turn.turn}
                    className={`duel-card__timeline-entry${turn.turn === activeTurn?.turn ? ' is-active' : ''}`}
                  >
                    <span className="duel-card__timeline-turn">Turn {turn.turn}</span>
                    <span className="duel-card__timeline-text">{turn.description}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {summary ? (
              <div className="duel-card__summary">
                <span className="duel-card__summary-winner">Winner: {summary.winner}</span>
                <span className="duel-card__summary-reward">
                  +{summary.reward?.gold ?? 0} gold / +{summary.reward?.exp ?? 0} XP
                </span>
              </div>
            ) : null}
          </footer>
        </div>
      ) : (
        <div className="overlay__idle">
          <h2>No duel in progress</h2>
          <p>Waiting for the next challenge...</p>
        </div>
      )}
    </div>
  );
}

DuelOverlay.propTypes = {
  duel: PropTypes.shape({
    active: PropTypes.bool,
    round: PropTypes.number,
    lastAction: PropTypes.string,
    challenger: duelParticipantShape,
    opponent: duelParticipantShape,
  }),
  connectionStatus: PropTypes.oneOf([
    'disconnected',
    'connecting',
    'connected',
    'idle',
    'error',
  ]),
  battleLog: PropTypes.shape({
    id: PropTypes.number,
    status: PropTypes.string,
    winner: PropTypes.string,
    loser: PropTypes.string,
    rounds: PropTypes.number,
    reward: PropTypes.shape({
      gold: PropTypes.number,
      exp: PropTypes.number,
    }),
    roles: PropTypes.shape({
      challenger: PropTypes.string,
      opponent: PropTypes.string,
    }),
    combatants: PropTypes.shape({
      challenger: duelParticipantShape,
      opponent: duelParticipantShape,
    }),
    participants: PropTypes.objectOf(
      PropTypes.shape({
        hpStart: PropTypes.number,
        hpEnd: PropTypes.number,
        maxHp: PropTypes.number,
        level: PropTypes.number,
        skin: PropTypes.string,
      })
    ),
    log: PropTypes.arrayOf(turnShape),
  }),
  currentTurnIndex: PropTypes.number,
  setCurrentTurnIndex: PropTypes.func,
};

DuelOverlay.defaultProps = {
  duel: null,
  connectionStatus: 'idle',
  battleLog: null,
  currentTurnIndex: 0,
  setCurrentTurnIndex: undefined,
};

export default DuelOverlay;
