import PropTypes from 'prop-types';
import classNames from 'classnames';

const STATUS_LABELS = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Live',
  idle: 'Idle',
  error: 'Error',
};

function ConnectionBadge({ status }) {
  return (
    <div className={classNames('connection-badge', `connection-badge--${status}`)}>
      <span className="connection-badge__dot" aria-hidden="true" />
      <span className="connection-badge__label">{STATUS_LABELS[status] ?? 'Unknown'}</span>
    </div>
  );
}

ConnectionBadge.propTypes = {
  status: PropTypes.oneOf(['disconnected', 'connecting', 'connected', 'idle', 'error'])
    .isRequired,
};

export default ConnectionBadge;
