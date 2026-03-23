import { useState } from 'react';
import { useToast } from '../../../hooks/useToast';
import { stravaApi } from '../../../api/strava';
import './EventEditModal.css';

const EventEditModal = ({ event, onClose, onUpdateSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...event });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await stravaApi.updateEvent(event.id, formData);
      showSuccess(`Event "${formData.title}" updated successfully.`);
      onUpdateSuccess(formData);
      onClose();
    } catch (error) {
      showError('Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card edit-modal fade-in scale-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Edit Event</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body scrollable-body">
            <div className="form-group">
              <label htmlFor="title">Event Title</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={formData.category} onChange={handleChange}>
                  <option value="Road">Road</option>
                  <option value="MTB">MTB</option>
                  <option value="Gravel">Gravel</option>
                  <option value="Climbing">Climbing</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="difficulty">Difficulty</label>
                <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="distance">Distance (km)</label>
                <input type="text" id="distance" name="distance" value={formData.distance} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="elevationGain">Elevation Gain (m)</label>
                <input type="text" id="elevationGain" name="elevationGain" value={formData.elevationGain} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="segmentName">Strava Segment Name</label>
              <input type="text" id="segmentName" name="segmentName" value={formData.segmentName} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="4" required></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary hover-glow" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEditModal;
