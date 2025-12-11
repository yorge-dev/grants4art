'use client';

interface Grant {
  id: string;
  title: string;
  organization: string;
  amount?: string | null;
  amountMin?: number | null;
  amountMax?: number | null;
  deadline?: Date | string | null;
  location: string;
  description: string;
  tags?: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
}

interface GrantStatsProps {
  totalGrants: number;
  totalAmount: number;
}

export function GrantStats({ totalGrants, totalAmount }: GrantStatsProps) {

  // Format the total amount with appropriate rounding
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  };

  return (
    <div style={{ padding: '16px 0', marginBottom: '16px' }}>
      <div className="grid grid-cols-2 gap-4" style={{ gap: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div className="aol-heading" style={{ fontSize: '24px', color: 'var(--primary)' }}>
            {totalGrants}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Grants
          </div>
        </div>
        <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div className="aol-heading" style={{ fontSize: '24px', color: 'var(--secondary)' }}>
            {formatAmount(totalAmount)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Award Amount
          </div>
        </div>
      </div>
    </div>
  );
}
