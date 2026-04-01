'use client';

interface AdminGrantTooltipProps {
  description: string;
  eligibility?: string | null;
  isVisible: boolean;
}

export function AdminGrantTooltip({ description, eligibility, isVisible }: AdminGrantTooltipProps) {
  return (
    <div
      className="grant-tooltip"
      style={{
        marginTop: '12px',
        padding: isVisible ? '16px' : '0 16px',
        background: 'var(--text-field-bg)',
        border: 'none',
        borderRadius: '8px',
        opacity: isVisible ? 1 : 0,
        maxHeight: isVisible ? '600px' : '0',
        overflowY: isVisible ? 'auto' : 'hidden',
        overflowX: 'hidden',
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        visibility: isVisible ? 'visible' : 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      <div style={{ marginBottom: eligibility ? '12px' : '0' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
          Description
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-wrap', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
          {description}
        </p>
      </div>
      {eligibility && (
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
            Eligibility
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: '1.4', margin: 0, whiteSpace: 'pre-wrap', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
            {eligibility}
          </p>
        </div>
      )}
    </div>
  );
}
