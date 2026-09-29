import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Upload, Check } from 'lucide-react';
import type { Event, EventFormData } from '../types';
import { eventService } from '../services/events';

interface EventFormModalProps {
  isOpen: boolean;
  event: Event | null; // null for create, Event for edit
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
}

const CATEGORIES = [
  'Technical',
  'Workshop',
  'Hackathon',
  'Cultural',
  'Sports',
  'Literary',
  'Gaming',
  'Career',
  'Seminar',
  'Competition',
];

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  event,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    category: 'Technical',
    eventDate: '',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    venue: '',
    featured: false,
    registrationOpen: true,
    imageUrl: '',
    maxCapacity: 100,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        featured: event.featured,
        registrationOpen: event.registrationOpen,
        imageUrl: event.imageUrl || '',
        maxCapacity: event.maxCapacity || 100,
      });
    } else {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const dateStr = nextWeek.toISOString().split('T')[0];

      setFormData({
        title: '',
        description: '',
        category: 'Technical',
        eventDate: dateStr,
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        venue: '',
        featured: false,
        registrationOpen: true,
        imageUrl: '',
        maxCapacity: 100,
      });
    }
    setFormErrors({});
    setErrorMessage(null);
    setUploadError(null);
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const uploadedUrl = await eventService.uploadEventImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload to Supabase Storage');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Event title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.eventDate) errors.eventDate = 'Event date is required';
    if (!formData.startTime.trim()) errors.startTime = 'Start time is required';
    if (!formData.endTime.trim()) errors.endTime = 'End time is required';
    if (!formData.venue.trim()) errors.venue = 'Venue is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog event-form-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {event ? 'Edit Event' : 'Create New Club Event'}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="event-form-wrapper">
          <div className="modal-body">
            {errorMessage && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Event Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.title ? 'error' : ''}`}
                placeholder="e.g. Nexus Annual Hackathon 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
              />
              {formErrors.title && <span className="form-error">{formErrors.title}</span>}
            </div>

            <div className="form-row-2">
              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={isSubmitting}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Date */}
              <div className="form-group">
                <label className="form-label">
                  Event Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${formErrors.eventDate ? 'error' : ''}`}
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  disabled={isSubmitting}
                />
                {formErrors.eventDate && <span className="form-error">{formErrors.eventDate}</span>}
              </div>
            </div>

            <div className="form-row-2">
              {/* Start Time */}
              <div className="form-group">
                <label className="form-label">
                  Start Time <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${formErrors.startTime ? 'error' : ''}`}
                  placeholder="e.g. 10:00 AM"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  disabled={isSubmitting}
                />
                {formErrors.startTime && <span className="form-error">{formErrors.startTime}</span>}
              </div>

              {/* End Time */}
              <div className="form-group">
                <label className="form-label">
                  End Time <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${formErrors.endTime ? 'error' : ''}`}
                  placeholder="e.g. 04:30 PM"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  disabled={isSubmitting}
                />
                {formErrors.endTime && <span className="form-error">{formErrors.endTime}</span>}
              </div>
            </div>

            {/* Venue */}
            <div className="form-group">
              <label className="form-label">
                Venue / Location <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.venue ? 'error' : ''}`}
                placeholder="e.g. Main Auditorium, Block C"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                disabled={isSubmitting}
              />
              {formErrors.venue && <span className="form-error">{formErrors.venue}</span>}
            </div>

            {/* Image URL & Capacity */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">
                  Cover Image Banner
                </label>
                <div className="image-upload-field">
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://... or upload"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    disabled={isSubmitting || isUploadingImage}
                  />
                  <label
                    className="btn btn-secondary btn-sm upload-btn"
                    title="Upload image file directly to Supabase Storage"
                  >
                    {isUploadingImage ? <Loader2 size={14} className="pulse" /> : <Upload size={14} />}
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      disabled={isSubmitting || isUploadingImage}
                    />
                  </label>
                </div>
                {uploadError && <span className="form-error">{uploadError}</span>}
                {formData.imageUrl && (
                  <div className="image-preview-bar">
                    <img
                      src={formData.imageUrl}
                      alt="Banner Preview"
                      className="preview-thumbnail"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <small className="preview-status"><Check size={12} /> Image set</small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Max Participant Capacity</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 150"
                  value={formData.maxCapacity || ''}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value, 10) || undefined })}
                  disabled={isSubmitting}
                />
                <span className="form-help">Leave empty for unlimited seats</span>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                Full Description <span className="required">*</span>
              </label>
              <textarea
                className={`form-textarea ${formErrors.description ? 'error' : ''}`}
                rows={4}
                placeholder="Describe what students will learn, participate in, prerequisites, prizes, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
              {formErrors.description && <span className="form-error">{formErrors.description}</span>}
            </div>

            {/* Toggles */}
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  disabled={isSubmitting}
                />
                <span>Set as Featured Event (Spotlight on Homepage)</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.registrationOpen}
                  onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
                  disabled={isSubmitting}
                />
                <span>Registration Open for Students</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="pulse" />
                  Saving...
                </>
              ) : event ? (
                'Update Event'
              ) : (
                'Publish Event'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .event-form-dialog {
          max-width: 680px;
        }

        .event-form-wrapper {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
        }

        .image-upload-field {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .upload-btn {
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .image-preview-bar {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .preview-thumbnail {
          width: 52px;
          height: 32px;
          object-fit: cover;
          border-radius: var(--radius-sm);
          border: 1px solid var(--gray-300);
        }

        .preview-status {
          color: var(--success);
          font-weight: 600;
          font-size: 0.775rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .checkbox-row {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-top: 0.5rem;
          padding: 1.15rem 1.25rem;
          background-color: var(--gray-50);
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          font-size: 0.925rem;
          font-weight: 500;
          color: var(--navy-800);
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--primary);
        }
      `}</style>
    </div>
  );
};
