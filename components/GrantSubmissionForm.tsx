'use client';

import { useState } from 'react';
import { GRANT_CATEGORIES } from '@/lib/constants';

export function GrantSubmissionForm() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    location: '',
    description: '',
    eligibility: '',
    amount: '',
    amountMin: '',
    amountMax: '',
    deadline: '',
    applicationUrl: '',
    category: '',
    honeypot: '' // Bot protection
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/grants/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          organization: formData.organization,
          location: formData.location,
          description: formData.description,
          eligibility: formData.eligibility,
          amount: formData.amount || null,
          amountMin: formData.amountMin || null,
          amountMax: formData.amountMax || null,
          deadline: formData.deadline || null,
          applicationUrl: formData.applicationUrl || null,
          category: formData.category || null,
          honeypot: formData.honeypot || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Grant submitted successfully! It will be reviewed by an admin.' });
        // Reset form
        setFormData({
          title: '',
          organization: '',
          location: '',
          description: '',
          eligibility: '',
          amount: '',
          amountMin: '',
          amountMax: '',
          deadline: '',
          applicationUrl: '',
          category: '',
          honeypot: ''
        });
        // Auto-collapse after 3 seconds
        setTimeout(() => {
          setIsExpanded(false);
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit grant. Please try again.' });
      }
    } catch (error) {
      console.error('Error submitting grant:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aol-box" style={{ 
      width: '100%',
      maxWidth: '100%',
      padding: '16px',
      height: 'fit-content',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="aol-heading" style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          Submit Grant
          <span style={{
            fontSize: '8px',
            padding: '1px 3px',
            background: 'var(--inset-bg)',
            border: '1px solid var(--secondary)',
            borderRadius: '12px',
            color: 'var(--foreground)',
            opacity: 0.7,
            fontWeight: 'normal',
            textTransform: 'none',
            letterSpacing: '0'
          }}>
            Coming Soon
          </span>
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--foreground)',
            opacity: 0.7,
            transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={(e) => { e.preventDefault(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Honeypot field (hidden) */}
          <input
            type="text"
            name="honeypot"
            value={formData.honeypot}
            onChange={handleChange}
            disabled
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Message display */}
          {message && (
            <div className="aol-box-inset" style={{ 
              padding: '8px', 
              background: message.type === 'success' ? 'var(--inset-bg)' : 'var(--inset-bg)',
              borderColor: message.type === 'success' ? 'var(--color-saddle-brown-700)' : '#d32f2f'
            }}>
              <p style={{ 
                fontSize: '11px', 
                color: message.type === 'success' ? 'var(--foreground)' : '#d32f2f', 
                fontWeight: 'bold', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span className="material-icons" style={{ fontSize: '14px' }}>
                  {message.type === 'success' ? 'check_circle' : 'error'}
                </span>
                {message.text}
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled
              readOnly
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* Organization */}
          <div>
            <label htmlFor="organization" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Organization *
            </label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              required
              disabled
              readOnly
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="City, State"
              disabled
              readOnly
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Funding Source
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
            >
              <option value="">Select category</option>
              {GRANT_CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Amount Range
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                id="amountMin"
                name="amountMin"
                value={formData.amountMin}
                onChange={handleChange}
                placeholder="Min"
                min="0"
                disabled
                readOnly
                className="aol-input"
                style={{ width: '50%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--foreground)', opacity: 0.5 }}>-</span>
              <input
                type="number"
                id="amountMax"
                name="amountMax"
                value={formData.amountMax}
                onChange={handleChange}
                placeholder="Max"
                min="0"
                disabled
                readOnly
                className="aol-input"
                style={{ width: '50%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {/* Amount (alternative) */}
          <div>
            <label htmlFor="amount" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Amount (or text)
            </label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g., $5,000 or Varies"
              disabled
              readOnly
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Deadline
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              disabled
              readOnly
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* Application URL */}
          <div>
            <label htmlFor="applicationUrl" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Application URL
            </label>
            <input
              type="url"
              id="applicationUrl"
              name="applicationUrl"
              value={formData.applicationUrl}
              onChange={handleChange}
              placeholder="https://..."
              disabled
              readOnly
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              disabled
              readOnly
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', resize: 'none', fontFamily: 'inherit', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* Eligibility */}
          <div>
            <label htmlFor="eligibility" className="block compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Eligibility *
            </label>
            <textarea
              id="eligibility"
              name="eligibility"
              value={formData.eligibility}
              onChange={handleChange}
              required
              rows={3}
              disabled
              readOnly
              className="aol-input"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', resize: 'none', fontFamily: 'inherit', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={true}
            className="aol-button"
            style={{
              width: '100%',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'not-allowed',
              opacity: 0.5,
              marginTop: '8px'
            }}
          >
            Submit Grant
          </button>

          <p style={{ fontSize: '10px', color: 'var(--foreground)', opacity: 0.6, margin: 0, textAlign: 'center' }}>
            * Required fields
          </p>
        </form>
      )}
    </div>
  );
}
