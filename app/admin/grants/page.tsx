'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Grant {
  id: string;
  title: string;
  organization: string;
  location: string;
  amount?: string | null;
  deadline?: Date | string | null;
  createdAt: Date | string;
}

export default function AdminGrantsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      fetchGrants();
    }
  }, [status, router]);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100'
      });
      const response = await fetch(`/api/grants?${params}`);
      const data = await response.json();
      setGrants(data.grants || []);
    } catch (error) {
      console.error('Error fetching grants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (grantId: string) => {
    if (!confirm('Are you sure you want to delete this grant?')) {
      return;
    }

    try {
      const response = await fetch(`/api/grants/${grantId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setGrants(prev => prev.filter(g => g.id !== grantId));
      }
    } catch (error) {
      console.error('Error deleting grant:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="flex items-center justify-center" style={{ minHeight: '200px' }}>
            <div className="text-center aol-box-inset" style={{ padding: '16px' }}>
            <LoadingSpinner size={28} />
            <p className="compact-mt" style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 'bold' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      
      <main className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginTop: '8px' }}>
        <div className="flex items-center justify-between compact-mb" style={{ marginBottom: '8px', margin: '0 8px 16px 8px' }}>
          <div>
            <h1 className="aol-heading-large compact-mb" style={{ fontSize: '23px', marginBottom: '2px' }}>All Grants</h1>
            <p style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 'bold' }}>
              {grants.length} total grants
            </p>
          </div>
        </div>

        <div className="aol-box" style={{ overflow: 'auto', margin: '0 8px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '12px', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'var(--inset-bg)' }}>
                <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)' }}>
                  Grant
                </th>
                <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)' }}>
                  Amount
                </th>
                <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'left', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)' }}>
                  Deadline
                </th>
                <th className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', color: 'var(--foreground)', borderBottom: '2px inset var(--border-color)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant, idx) => (
                <tr key={grant.id} style={{ background: idx % 2 === 0 ? 'var(--card-bg)' : 'var(--inset-bg)' }}>
                  <td className="compact-px compact-py" style={{ padding: '4px 6px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--foreground)' }}>{grant.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--foreground)' }}>{grant.organization}</div>
                    <div style={{ fontSize: '9px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-icons" style={{ fontSize: '10px' }}>location_on</span> {grant.location}
                    </div>
                  </td>
                  <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '12px', color: 'var(--foreground)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>
                    {grant.amount || '-'}
                  </td>
                  <td className="compact-px compact-py" style={{ padding: '4px 6px', fontSize: '12px', color: 'var(--foreground)', borderBottom: '1px solid var(--border-color)' }}>
                    {grant.deadline ? format(new Date(grant.deadline), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="compact-px compact-py" style={{ padding: '4px 6px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>
                    <Link
                      href={`/admin/grants/${grant.id}`}
                      className="aol-button-secondary"
                      style={{ textDecoration: 'none', fontSize: '10px', padding: '2px 6px', marginRight: '4px' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(grant.id)}
                      className="aol-button-secondary"
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: 'linear-gradient(to bottom, var(--color-saddle-brown-600), var(--color-saddle-brown-700))'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}




