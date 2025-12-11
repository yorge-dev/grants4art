import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatTagName } from '@/lib/tag-utils';

async function getGrant(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/grants/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching grant:', error);
    return null;
  }
}

export default async function GrantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grant = await getGrant(id);

  if (!grant) {
    notFound();
  }

  const deadline = grant.deadline ? new Date(grant.deadline) : null;
  const isExpired = deadline && deadline < new Date();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginBottom: '24px' }}>
        <header className="aol-box mb-2" style={{ margin: '16px 8px 0 8px' }}>
          <div className="px-4 py-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link
              href="/"
              className="aol-button-secondary"
              style={{ textDecoration: 'none', fontSize: '12px', padding: '4px 12px' }}
            >
              ← Back to all grants
            </Link>
            <ThemeToggle />
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px' }}>
        <article className="aol-box" style={{ margin: '0 8px', padding: '20px' }}>
          {/* Header */}
          <div className="compact-mb" style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '3px inset var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <h1 className="aol-heading-large compact-mb" style={{ fontSize: '25px', marginBottom: '8px' }}>
                {grant.title}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 'bold' }}>
                {grant.organization}
              </p>
            </div>
            {grant.applicationUrl && (
              <a
                href={grant.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="aol-button"
                style={{ 
                  textDecoration: 'none', 
                  fontSize: '13px', 
                  padding: '4px 12px', 
                  display: 'inline-block', 
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  marginLeft: '8px'
                }}
              >
                {isExpired ? 'View Application' : 'Apply'} <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '4px' }}>link</span>
              </a>
            )}
          </div>

          {/* Key Info */}
          {grant.amount && (
            <div className="compact-mb" style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '3px inset var(--secondary)' }}>
              <div className="aol-box-inset" style={{ 
                padding: '20px', 
                background: 'linear-gradient(135deg, var(--amount-card-bg-start) 0%, var(--amount-card-bg-end) 100%)',
                border: '2px outset var(--secondary)',
                borderRadius: '8px'
              }}>
                <h3 className="compact-mb" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grant Amount</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--secondary)', margin: 0 }}>{grant.amount}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 compact-mb" style={{ gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '3px inset var(--secondary)' }}>
            <div className="aol-box-inset" style={{ padding: '12px', background: 'var(--text-field-bg)' }}>
              <h3 className="compact-mb" style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '4px' }}>Location</h3>
              <p style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-icons" style={{ fontSize: '16px' }}>location_on</span> {grant.location}
              </p>
            </div>

            {deadline && (
              <div className="aol-box-inset" style={{ padding: '12px', background: 'var(--text-field-bg)' }}>
                <h3 className="compact-mb" style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '4px' }}>Deadline</h3>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: isExpired ? '#d32f2f' : 'var(--foreground)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isExpired ? (
                      <>
                        <span className="material-icons" style={{ fontSize: '16px' }}>warning</span> Expired - 
                      </>
                    ) : (
                      <span className="material-icons" style={{ fontSize: '16px' }}>calendar_today</span>
                    )}
                    {format(deadline, 'MMMM d, yyyy')}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="compact-mb" style={{ marginBottom: '20px' }}>
            <h2 className="aol-heading compact-mb" style={{ fontSize: '18px', marginBottom: '12px' }}>Description</h2>
            <div className="aol-box-inset" style={{ padding: '20px', background: 'var(--text-field-bg)' }}>
              <p style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{grant.description}</p>
            </div>
          </div>

          {/* Eligibility */}
          {grant.eligibility && (
            <div className="compact-mb" style={{ marginBottom: '20px' }}>
              <h2 className="aol-heading compact-mb" style={{ fontSize: '18px', marginBottom: '12px' }}>Eligibility</h2>
              <div className="aol-box-inset" style={{ padding: '20px', background: 'var(--text-field-bg)' }}>
                <p style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{grant.eligibility}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {grant.tags && grant.tags.length > 0 && (
            <div className="compact-mt" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '3px inset var(--secondary)' }}>
              <h3 className="compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '8px' }}>Categories</h3>
              <div className="flex flex-wrap gap-1" style={{ gap: '2px' }}>
                {grant.tags.map((tagRelation: any) => (
                  <span
                    key={tagRelation.tag.slug}
                    style={{
                      padding: '2px 6px',
                      fontSize: '12px',
                      background: 'var(--color-camel-800)',
                      color: 'var(--color-charcoal-brown-500)',
                      border: '1px solid var(--secondary)',
                      borderRadius: '6px',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatTagName(tagRelation.tag.name)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}

