import React, { useState } from 'react';
import { X, Calendar, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Event, RegistrationFormData } from '../types';
import { registrationService } from '../services/registrations';
import { ApiError } from '../services/api';

interface RegistrationModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    college: '',
    year: '1st Year',
    phone: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !event) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.college.trim()) {
      errors.college = 'College/University name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-()\s]{7,20}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid contact phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await registrationService.registerForEvent(event.id, formData);
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to complete registration. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    setFormErrors({});
    setFormData({
      name: '',
      email: '',
      college: '',
      year: '1st Year',
      phone: '',
    });
    onClose();
  };

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-dialog registration-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {isSuccess ? 'Registration Complete' : 'Register for Event'}
            </h3>
            {!isSuccess && <p className="modal-subtitle">{event.title}</p>}
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="modal-body registration-success-view">
            <div className="success-icon-wrap">
              <CheckCircle size={48} className="success-icon" />
            </div>
            <h2 className="success-heading">Registration Confirmed!</h2>
            <p className="success-text">
              You have secured a spot for:
            </p>
            <div className="success-event-box">
              <h4>{event.title}</h4>
              <div className="success-meta-row">
                <span>📅 {formattedDate}</span>
                <span>📍 {event.venue}</span>
              </div>
            </div>
            <p className="success-subtext">
              A confirmation has been recorded in the roster. Please arrive 15 minutes before {event.startTime} at the venue.
            </p>
            <button onClick={handleClose} className="btn btn-primary btn-lg success-done-btn">
              Done & Return to Events
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="modal-form-wrapper">
            <div className="modal-body">
              {/* Event Quick Info Banner */}
              <div className="modal-event-banner">
                <div className="modal-event-meta">
                  <span className="meta-pill">
                    <Calendar size={14} /> {formattedDate} ({event.startTime})
                  </span>
                  <span className="meta-pill">
                    <MapPin size={14} /> {event.venue}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="alert alert-danger">
                  <AlertCircle size={18} className="alert-icon" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Student Name */}
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>

              {/* Student Email */}
              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  placeholder="e.g. rahul@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                />
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                <span className="form-help">Only one registration per email is allowed for this event.</span>
              </div>

              {/* College / University */}
              <div className="form-group">
                <label className="form-label">
                  College / University <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${formErrors.college ? 'error' : ''}`}
                  placeholder="e.g. Institute of Technology"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  disabled={isSubmitting}
                />
                {formErrors.college && <span className="form-error">{formErrors.college}</span>}
              </div>

              <div className="form-row-2">
                {/* Academic Year */}
                <div className="form-group">
                  <label className="form-label">
                    Academic Year <span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    disabled={isSubmitting}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label className="form-label">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`form-input ${formErrors.phone ? 'error' : ''}`}
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isSubmitting}
                  />
                  {formErrors.phone && <span className="form-error">{formErrors.phone}</span>}
                </div>
              </div>
            </div>

            {/* Action Buttons in proper footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
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
                    Registering...
                  </>
                ) : (
                  'Confirm Registration'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .registration-modal-dialog {
          max-width: 600px;
        }

        .modal-form-wrapper {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
        }

        .modal-subtitle {
          font-size: 0.85rem;
          color: var(--primary);
          font-weight: 600;
          margin-top: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 480px;
        }

        .modal-event-banner {
          background-color: var(--primary-light);
          border: 1px solid var(--primary-border);
          border-radius: var(--radius-md);
          padding: 0.85rem 1.15rem;
          margin-bottom: 1.5rem;
        }

        .modal-event-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--navy-800);
        }

        .registration-success-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 3rem 2rem;
        }

        .success-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-full);
          background-color: var(--success-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          border: 1px solid var(--success-border);
        }

        .success-icon {
          color: var(--success);
        }

        .success-heading {
          font-size: 1.5rem;
          color: var(--navy-900);
          margin-bottom: 0.5rem;
        }

        .success-text {
          font-size: 0.95rem;
          color: var(--gray-500);
          margin-bottom: 1.25rem;
        }

        .success-event-box {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
          width: 100%;
          text-align: left;
        }

        .success-event-box h4 {
          font-size: 1.05rem;
          color: var(--navy-900);
          margin-bottom: 0.4rem;
        }

        .success-meta-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.85rem;
          color: var(--gray-600);
          flex-wrap: wrap;
        }

        .success-subtext {
          font-size: 0.875rem;
          color: var(--gray-500);
          line-height: 1.55;
          margin-bottom: 2rem;
          max-width: 440px;
        }

        .success-done-btn {
          min-width: 220px;
        }
      `}</style>
    </div>
  );
};
