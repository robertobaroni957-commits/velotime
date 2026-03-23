import { useToast } from '../../../hooks/useToast';
import { stravaApi } from '../../../api/strava';
import './EventDeleteModal.css';

const EventDeleteModal = ({ event, onClose, onDeleteSuccess }) => {
  const { showSuccess, showError } = useToast();

  const handleDelete = async () => {
    try {
      await stravaApi.deleteEvent(event.id);
      showSuccess(`Event "${event.title}" deleted successfully.`);
      onDeleteSuccess(event.id);
      onClose();
    } catch (error) {
      showError('Failed to delete event.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card delete-modal fade-in scale-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Delete Event</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>{event.title}</strong>? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger hover-glow" onClick={handleDelete}>Delete Event</button>
        </div>
      </div>
    </div>
  );
};

export default EventDeleteModal;
