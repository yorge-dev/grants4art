'use client';

import { useRef } from 'react';

interface DatePickerProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function DatePicker({ 
  id, 
  name, 
  value, 
  onChange, 
  required = false,
  min,
  max,
  className = '',
  style = {},
  disabled = false
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCalendarClick = () => {
    if (!disabled) {
      inputRef.current?.showPicker?.();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="date"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
        className={`aol-input ${className}`}
        style={{ 
          width: '100%',
          paddingRight: '32px',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
          ...style
        }}
      />
      <button
        type="button"
        onClick={handleCalendarClick}
        disabled={disabled}
        style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--foreground)',
          opacity: disabled ? 0.3 : 0.7
        }}
        aria-label="Open calendar"
        title="Open calendar"
      >
        <span className="material-icons" style={{ fontSize: '18px' }}>
          calendar_today
        </span>
      </button>
    </div>
  );
}

