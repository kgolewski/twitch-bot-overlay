import PropTypes from 'prop-types';
import DuelParticipant, { duelParticipantShape } from './DuelParticipant.jsx';
import ConnectionBadge from './ConnectionBadge.jsx';
import '../styles/overlay.css';

function DuelOverlay({ duel, connectionStatus }) {
  const isActive = duel?.active;

  return (
    <div className="overlay">
      <ConnectionBadge status={connectionStatus} />
      {isActive ? (
        <div className="duel-card">
          <header className="duel-card__header">
            <span className="duel-card__title">Duel in progress</span>
            <span className="duel-card__round">Round {duel.round}</span>
          </header>
          <section className="duel-card__body">
            <DuelParticipant
              player={duel.challenger}
              alignment="left"
            />
            <div className="duel-card__vs">
              <span>VS</span>
            </div>
            <DuelParticipant
              player={duel.opponent}
              alignment="right"
            />
          </section>
          <footer className="duel-card__footer">
            <p className="duel-card__log-entry">
              {duel.lastAction || 'Awaiting next move...'}
            </p>
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
};

DuelOverlay.defaultProps = {
  duel: null,
  connectionStatus: 'idle',
};

export default DuelOverlay;
