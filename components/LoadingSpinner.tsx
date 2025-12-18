'use client';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export function LoadingSpinner({ size = 28, color = 'var(--primary)' }: LoadingSpinnerProps) {
  return (
    <span 
      className="material-icons"
      style={{
        fontSize: `${size}px`,
        color,
        display: 'inline-block',
        animation: 'spin 1s linear infinite'
      }}
    >
      refresh
    </span>
  );
}











