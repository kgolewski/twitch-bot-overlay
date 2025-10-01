import PropTypes from 'prop-types';
import classNames from 'classnames';

export const duelParticipantShape = PropTypes.shape({
  username: PropTypes.string.isRequired,
  hp: PropTypes.number.isRequired,
  maxHp: PropTypes.number.isRequired,
  skin: PropTypes.string,
  damageDealt: PropTypes.number,
  combo: PropTypes.number,
});

function DuelParticipant({ player, alignment }) {
  if (!player) {
    return (
      <div className={classNames('duel-participant', `duel-participant--${alignment}`)}>
        <div className="duel-participant__avatar placeholder" />
        <div className="duel-participant__info">
          <span className="duel-participant__name">Waiting...</span>
          <span className="duel-participant__hp">HP: --</span>
        </div>
      </div>
    );
  }

  const { username, hp, maxHp, skin, damageDealt, combo } = player;
  const hpPercent = maxHp ? Math.max(0, Math.round((hp / maxHp) * 100)) : 0;

  return (
    <div
      className={classNames(
        'duel-participant',
        `duel-participant--${alignment}`,
        `duel-participant--skin-${skin || 'default'}`
      )}
    >
      <div className="duel-participant__avatar" aria-hidden="true">
        <div className="duel-participant__portrait" />
      </div>
      <div className="duel-participant__info">
        <div className="duel-participant__header">
          <span className="duel-participant__name">{username}</span>
          <span className="duel-participant__hp">
            {hp} / {maxHp}
          </span>
        </div>
        <div className="duel-participant__hp-bar" role="progressbar" aria-valuenow={hpPercent} aria-valuemin={0} aria-valuemax={100}>
          <span className="duel-participant__hp-bar-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        <div className="duel-participant__stats">
          <span className="duel-participant__damage">Damage dealt: {damageDealt ?? 0}</span>
          {combo ? <span className="duel-participant__combo">Combo x{combo}</span> : null}
        </div>
      </div>
    </div>
  );
}

DuelParticipant.propTypes = {
  player: duelParticipantShape,
  alignment: PropTypes.oneOf(['left', 'right']).isRequired,
};

DuelParticipant.defaultProps = {
  player: null,
};
export default DuelParticipant;
