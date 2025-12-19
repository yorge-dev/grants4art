'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DatePicker } from '@/components/DatePicker';
import { GRANT_CATEGORIES } from '@/lib/constants';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function EditGrantPage({ params }: { params: Promise<{ id: string }> }) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [grantId, setGrantId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    amount: '',
    amountMin: '',
    amountMax: '',
    deadline: '',
    location: '',
    eligibility: '',
    description: '',
    applicationUrl: '',
    category: '',
    tags: ''
  });

  useEffect(() => {
    const initializeGrant = async () => {
      const resolvedParams = await params;
      setGrantId(resolvedParams.id);
    };
    initializeGrant();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && grantId) {
      fetchGrant();
    }
  }, [status, router, grantId]);

  const fetchGrant = async () => {
    try {
      const response = await fetch(`/api/grants/${grantId}`);
      const grant = await response.json();
      
      setFormData({
        title: grant.title || '',
        organization: grant.organization || '',
        amount: grant.amount || '',
        amountMin: grant.amountMin?.toString() || '',
        amountMax: grant.amountMax?.toString() || '',
        deadline: grant.deadline ? new Date(grant.deadline).toISOString().split('T')[0] : '',
        location: grant.location || '',
        eligibility: grant.eligibility || '',
        description: grant.description || '',
        applicationUrl: grant.applicationUrl || '',
        category: grant.category || '',
        tags: grant.tags?.map((t: any) => t.tag.name).join(', ') || ''
      });
    } catch (error) {
      console.error('Error fetching grant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const response = await fetch(`/api/grants/${grantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amountMin: formData.amountMin ? parseInt(formData.amountMin) : null,
          amountMax: formData.amountMax ? parseInt(formData.amountMax) : null,
          deadline: formData.deadline || null,
          tags
        })
      });

      if (response.ok) {
        router.push('/admin/dashboard');
      } else {
        alert('Error updating grant');
      }
    } catch (error) {
      console.error('Error updating grant:', error);
      alert('Error updating grant');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGenerateTags = async () => {
    if (!formData.description || !formData.eligibility) {
      alert('Please fill in Description and Eligibility requirements first.');
      return;
    }

    setGeneratingTags(true);
    try {
      const response = await fetch('/api/grants/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          eligibility: formData.eligibility
        })
      });

      const data = await response.json();

      if (response.ok && data.tags) {
        const currentTags = formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);
        
        // Append new tags, avoiding duplicates
        const newTags = [...currentTags];
        data.tags.forEach((tag: string) => {
          if (!newTags.includes(tag)) {
            newTags.push(tag);
          }
        });

        setFormData(prev => ({
          ...prev,
          tags: newTags.join(', ')
        }));
      } else {
        alert('Failed to generate tags. Please try again.');
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      alert('Error generating tags.');
    } finally {
      setGeneratingTags(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="flex items-center justify-center" style={{ minHeight: '200px' }}>
          <div className="text-center aol-box-inset" style={{ padding: '16px' }}>
            <span className="material-icons" style={{ fontSize: '28px', color: 'var(--primary)', display: 'inline-block', animation: 'spin 1s linear infinite' }}>refresh</span>
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
        <div className="compact-mb" style={{ marginBottom: '16px', margin: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="aol-heading-large compact-mb" style={{ fontSize: '23px', marginBottom: '2px' }}>Edit Grant</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                background: 'var(--secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-grant-form"
              disabled={saving}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <form id="edit-grant-form" onSubmit={handleSubmit} className="aol-box" style={{ margin: '0 8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Grant Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="organization" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Organization *
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="location" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g., Houston, Texas"
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="amount" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Amount (display text)
              </label>
              <input
                type="text"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g., $5,000 or $1,000-$10,000"
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Deadline
              </label>
              <DatePicker
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="amountMin" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Min Amount ($)
              </label>
              <input
                type="number"
                id="amountMin"
                name="amountMin"
                value={formData.amountMin}
                onChange={handleChange}
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="amountMax" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Max Amount ($)
              </label>
              <input
                type="number"
                id="amountMax"
                name="amountMax"
                value={formData.amountMax}
                onChange={handleChange}
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '8px' }}>
                Funding Source (Category)
              </label>
              <input
                type="hidden"
                name="category"
                value={formData.category}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, category: '' }));
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: formData.category === '' ? 'var(--primary)' : 'transparent',
                    color: formData.category === '' ? '#fff' : 'var(--foreground)',
                    border: '1.5px solid var(--secondary)',
                    opacity: formData.category === '' ? 1 : 0.5,
                    fontWeight: formData.category === '' ? '600' : 'normal',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  <span style={{ flex: 1 }}>None</span>
                  {formData.category === '' && (
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        flexShrink: 0
                      }}
                    />
                  )}
                </button>
                {GRANT_CATEGORIES.map((category) => {
                  const isSelected = formData.category === category.slug;
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: category.slug }));
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: isSelected ? category.color : 'transparent',
                        color: isSelected ? '#fff' : 'var(--foreground)',
                        border: '1.5px solid var(--secondary)',
                        opacity: isSelected ? 1 : 0.5,
                        fontWeight: isSelected ? '600' : 'normal',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '18px', lineHeight: '1', display: 'flex', alignItems: 'center' }}>
                        {category.icon}
                      </span>
                      <span style={{ flex: 1 }}>{category.name}</span>
                      {isSelected && (
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#fff',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="applicationUrl" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Application URL
              </label>
              <input
                type="url"
                id="applicationUrl"
                name="applicationUrl"
                value={formData.applicationUrl}
                onChange={handleChange}
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="eligibility" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Eligibility Requirements *
              </label>
              <textarea
                id="eligibility"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                required
                rows={3}
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-end compact-mb" style={{ marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <label htmlFor="tags" className="block" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)' }}>
                  Tags (comma-separated)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTags}
                  disabled={generatingTags}
                  style={{ 
                    fontSize: '11px', 
                    color: 'var(--primary)', 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '4px 8px', 
                    cursor: generatingTags ? 'not-allowed' : 'pointer',
                    opacity: generatingTags ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '4px',
                    transition: 'opacity 0.15s ease'
                  }}
                >
                  {generatingTags ? (
                    <>
                      <span className="material-icons" style={{ fontSize: '14px', display: 'inline-block', animation: 'spin 1s linear infinite' }}>refresh</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-icons" style={{ fontSize: '14px' }}>auto_awesome</span>
                      Generate Tags with Gemini
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., visual arts, design, emerging artists"
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

          </div>

          <div style={{ display: 'flex', gap: '8px', paddingTop: '16px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Grant'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                background: 'var(--secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}