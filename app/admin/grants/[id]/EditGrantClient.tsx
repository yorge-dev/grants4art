'use client';

import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { DatePicker } from '@/components/DatePicker';
import { GRANT_CATEGORIES } from '@/lib/constants';
import { formatTagName } from '@/lib/tag-utils';

export type InitialGrantForEdit = {
  id: string;
  title: string;
  organization: string;
  amount: string | null;
  amountMin: number | null;
  amountMax: number | null;
  deadline: string;
  location: string;
  eligibility: string;
  description: string;
  applicationUrl: string | null;
  category: string | null;
  tags: Array<{ tag: { name: string; slug: string } }>;
};

type FormState = {
  title: string;
  organization: string;
  amount: string;
  amountMin: string;
  amountMax: string;
  deadline: string;
  location: string;
  eligibility: string;
  description: string;
  applicationUrl: string;
  category: string;
  tags: string;
};

function grantToFormState(g: InitialGrantForEdit): FormState {
  return {
    title: g.title || '',
    organization: g.organization || '',
    amount: g.amount || '',
    amountMin: g.amountMin != null ? String(g.amountMin) : '',
    amountMax: g.amountMax != null ? String(g.amountMax) : '',
    deadline: g.deadline || '',
    location: g.location || '',
    eligibility: g.eligibility || '',
    description: g.description || '',
    applicationUrl: g.applicationUrl || '',
    category: g.category || '',
    tags: g.tags?.map((t) => t.tag.name).join(', ') || '',
  };
}

function formatAmountFromForm(f: FormState): string | null {
  const min = f.amountMin ? parseInt(f.amountMin, 10) : null;
  const max = f.amountMax ? parseInt(f.amountMax, 10) : null;
  if (min != null && !Number.isNaN(min) && max != null && !Number.isNaN(max)) {
    if (min === max) return `$${min.toLocaleString()}`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  }
  if (max != null && !Number.isNaN(max)) return `Up to $${max.toLocaleString()}`;
  if (min != null && !Number.isNaN(min)) return `From $${min.toLocaleString()}`;
  if (f.amount.trim()) return f.amount;
  return null;
}

type EditableTextProps = {
  value: string;
  onCommit: (next: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  displayStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  'aria-label'?: string;
};

/** Keeps edit controls visually aligned with display text (same size, weight, color) instead of default form chrome. */
function buildInlineEditStyle(
  multiline: boolean,
  displayStyle?: React.CSSProperties,
  inputStyle?: React.CSSProperties
): React.CSSProperties {
  const structural: React.CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    margin: 0,
    fontFamily: 'inherit',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: multiline ? '2px 2px' : '0 2px',
    boxShadow: 'inset 0 -1px 0 0 var(--secondary)',
    borderRadius: 2,
    WebkitAppearance: 'none' as React.CSSProperties['WebkitAppearance'],
    appearance: 'none',
  };
  const merged: React.CSSProperties = { ...structural, ...displayStyle, ...inputStyle };
  merged.width = '100%';
  merged.maxWidth = '100%';
  merged.boxSizing = 'border-box';
  merged.background = 'transparent';
  merged.border = 'none';
  merged.outline = 'none';
  if (!merged.fontFamily) merged.fontFamily = 'inherit';
  if (multiline) {
    merged.resize = 'vertical';
    if (merged.minHeight === undefined) merged.minHeight = '4.5em';
  }
  return merged;
}

function EditableText({
  value,
  onCommit,
  multiline,
  rows = 4,
  placeholder,
  displayStyle,
  inputStyle,
  'aria-label': ariaLabel,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = useCallback(() => {
    setDraft(value);
    setEditing(true);
  }, [value]);

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const commit = useCallback(() => {
    onCommit(draft);
    setEditing(false);
  }, [draft, onCommit]);

  if (editing) {
    const fieldStyle = buildInlineEditStyle(multiline ?? false, displayStyle, inputStyle);
    if (multiline) {
      return (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          rows={rows}
          autoFocus
          placeholder={placeholder}
          aria-label={ariaLabel}
          style={fieldStyle}
        />
      );
    }
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
        autoFocus
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={fieldStyle}
      />
    );
  }

  const showPlaceholder = !value.trim();
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEdit();
        }
      }}
      style={{
        cursor: 'pointer',
        outline: 'none',
        borderRadius: '4px',
        ...displayStyle,
      }}
      title="Click to edit"
    >
      {showPlaceholder ? (
        <span style={{ opacity: 0.55, fontStyle: 'italic' }}>{placeholder || 'Click to edit'}</span>
      ) : (
        value
      )}
    </span>
  );
}

type EditGrantClientProps = {
  grantId: string;
  initialGrant: InitialGrantForEdit;
};

export function EditGrantClient({ grantId, initialGrant }: EditGrantClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>(() => grantToFormState(initialGrant));
  const [saving, setSaving] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const deadlineDate = formData.deadline ? new Date(`${formData.deadline}T12:00:00`) : null;
  const isExpired = deadlineDate && deadlineDate < new Date();
  const displayAmount = formatAmountFromForm(formData);

  const editAmountInputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    color: 'var(--foreground)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '2px 4px',
    textAlign: 'right',
    boxShadow: 'inset 0 -1px 0 0 var(--secondary)',
    borderRadius: 2,
  };

  const setField = useCallback(<K extends keyof FormState>(key: K, v: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: v }));
  }, []);

  const tagList = formData.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.organization.trim() || !formData.location.trim()) {
      alert('Title, organization, and location are required.');
      return;
    }
    if (!formData.description.trim() || !formData.eligibility.trim()) {
      alert('Description and eligibility are required.');
      return;
    }
    setSaving(true);
    try {
      const tags = tagList;
      const response = await fetch(`/api/grants/${grantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amountMin: formData.amountMin ? parseInt(formData.amountMin, 10) : null,
          amountMax: formData.amountMax ? parseInt(formData.amountMax, 10) : null,
          deadline: formData.deadline || null,
          tags,
        }),
      });
      if (response.ok) {
        router.push('/admin/dashboard');
      } else {
        alert('Error updating grant');
      }
    } catch {
      alert('Error updating grant');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value } as FormState));
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
          eligibility: formData.eligibility,
        }),
      });
      const data = await response.json();
      if (response.ok && data.tags) {
        const currentTags = tagList;
        const newTags = [...currentTags];
        (data.tags as string[]).forEach((tag) => {
          if (!newTags.includes(tag)) newTags.push(tag);
        });
        setFormData((prev) => ({ ...prev, tags: newTags.join(', ') }));
      } else {
        alert('Failed to generate tags. Please try again.');
      }
    } catch {
      alert('Error generating tags.');
    } finally {
      setGeneratingTags(false);
    }
  };

  const selectedCategory = GRANT_CATEGORIES.find((c) => c.slug === formData.category);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="mx-auto" style={{ maxWidth: '1440px', padding: '0 16px', marginTop: '8px' }}>
        <div
          className="compact-mb"
          style={{ marginBottom: '16px', margin: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
        >
          <h1 className="aol-heading-large compact-mb" style={{ fontSize: '23px', marginBottom: '2px' }}>
            Edit Grant
          </h1>
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
                cursor: 'pointer',
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
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <form id="edit-grant-form" onSubmit={handleSubmit} style={{ margin: '0 8px' }}>
          <div
            className="aol-box grant-card"
            style={{
              textDecoration: 'none',
              color: 'var(--foreground)',
              padding: '16px',
              marginBottom: '16px',
              display: 'block',
              position: 'relative',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1" style={{ gap: '12px', marginBottom: '12px', position: 'relative' }}>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <h3
                  className="aol-heading compact-mb"
                  style={{
                    fontSize: '15px',
                    marginBottom: '8px',
                    color: 'var(--primary)',
                    display: 'block',
                    lineHeight: 1.3,
                  }}
                >
                  <EditableText
                    value={formData.title}
                    onCommit={(v) => setField('title', v)}
                    placeholder="Grant title"
                    aria-label="Grant title"
                    displayStyle={{
                      display: 'block',
                      fontSize: '15px',
                      lineHeight: 1.3,
                      color: 'var(--primary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  />
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ color: 'var(--foreground)', fontWeight: 'bold', margin: 0, fontSize: '12px' }}>
                    <EditableText
                      value={formData.organization}
                      onCommit={(v) => setField('organization', v)}
                      placeholder="Organization"
                      aria-label="Organization"
                      displayStyle={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'var(--foreground)',
                      }}
                    />
                  </p>
                  <div className="flex items-center gap-2" style={{ gap: '12px', fontSize: '10px', flexWrap: 'wrap' }}>
                    <span className="flex items-center gap-1" style={{ fontWeight: 'bold', color: 'var(--foreground)', minWidth: 0 }}>
                      <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle', flexShrink: 0 }}>
                        location_on
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <EditableText
                          value={formData.location}
                          onCommit={(v) => setField('location', v)}
                          placeholder="Location"
                          aria-label="Location"
                          displayStyle={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: 'var(--foreground)',
                          }}
                        />
                      </span>
                    </span>
                    {formData.applicationUrl.trim() ? (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(formData.applicationUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="flex items-center gap-1"
                        style={{
                          fontWeight: 'bold',
                          color: 'var(--primary)',
                          textDecoration: 'none',
                          opacity: 0.8,
                          transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle' }}>
                          link
                        </span>
                        Apply
                      </span>
                    ) : null}
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '10px', minWidth: 0, flex: '1 1 120px' }}>
                      <EditableText
                        value={formData.applicationUrl}
                        onCommit={(v) => setField('applicationUrl', v)}
                        placeholder="Application URL (click to edit)"
                        aria-label="Application URL"
                        displayStyle={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: 'var(--primary)',
                          wordBreak: 'break-all',
                        }}
                      />
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', textAlign: 'right' }}>
                {editingAmount ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      alignItems: 'flex-end',
                      minWidth: '140px',
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setEditingAmount(false);
                      }
                    }}
                  >
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Display text"
                      style={editAmountInputStyle}
                    />
                    <input
                      type="number"
                      name="amountMin"
                      value={formData.amountMin}
                      onChange={handleChange}
                      placeholder="Min $"
                      style={editAmountInputStyle}
                    />
                    <input
                      type="number"
                      name="amountMax"
                      value={formData.amountMax}
                      onChange={handleChange}
                      placeholder="Max $"
                      style={editAmountInputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setEditingAmount(false)}
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'var(--primary)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 0',
                      }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingAmount(true)}
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'var(--foreground)',
                      border: '1px solid var(--secondary)',
                      borderRadius: '4px',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontFamily: 'inherit',
                    }}
                    title="Click to edit amount"
                  >
                    {displayAmount || 'Set amount'}
                  </button>
                )}
                {editingDeadline ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', minWidth: '160px' }}>
                    <DatePicker
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      unstyled
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        fontFamily: 'inherit',
                        color: deadlineDate
                          ? isExpired
                            ? '#d32f2f'
                            : 'var(--foreground)'
                          : 'var(--foreground)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'right',
                        padding: '2px 4px',
                        paddingRight: '26px',
                        boxShadow: 'inset 0 -1px 0 0 var(--secondary)',
                        borderRadius: 2,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setEditingDeadline(false)}
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'var(--primary)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingDeadline(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      fontWeight: 'bold',
                      color: deadlineDate
                        ? isExpired
                          ? '#d32f2f'
                          : 'var(--foreground)'
                        : 'var(--foreground)',
                      fontSize: '10px',
                      textAlign: 'right',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    title="Click to edit deadline"
                  >
                    <span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle' }}>
                      calendar_today
                    </span>
                    {deadlineDate
                      ? isExpired
                        ? 'Applications Closed'
                        : `Due in ${formatDistanceToNow(deadlineDate)}`
                      : 'Set deadline'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setCategoryPickerOpen((o) => !o)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  background: 'var(--color-camel-800)',
                  color: 'var(--color-charcoal-brown-500)',
                  border: '1px solid var(--secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                title="Click to change funding category"
              >
                {selectedCategory ? (
                  <>
                    <span className="material-icons" style={{ fontSize: '14px' }}>
                      {selectedCategory.icon}
                    </span>
                    {selectedCategory.name}
                  </>
                ) : (
                  'Funding source: none'
                )}
              </button>
              {categoryPickerOpen && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setField('category', '');
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
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ flex: 1 }}>None</span>
                  </button>
                  {GRANT_CATEGORIES.map((category) => {
                    const isSelected = formData.category === category.slug;
                    return (
                      <button
                        key={category.slug}
                        type="button"
                        onClick={() => {
                          setField('category', category.slug);
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
                          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          borderRadius: '4px',
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '18px', lineHeight: '1', display: 'flex', alignItems: 'center' }}>
                          {category.icon}
                        </span>
                        <span style={{ flex: 1 }}>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--foreground)' }}>Tags</span>
              <button
                type="button"
                onClick={handleGenerateTags}
                disabled={generatingTags}
                style={{
                  fontSize: '10px',
                  color: 'var(--primary)',
                  background: 'transparent',
                  border: 'none',
                  padding: '2px 6px',
                  cursor: generatingTags ? 'not-allowed' : 'pointer',
                  opacity: generatingTags ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                }}
              >
                {generatingTags ? (
                  <>
                    <span className="material-icons" style={{ fontSize: '14px', display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                      refresh
                    </span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-icons" style={{ fontSize: '14px' }}>auto_awesome</span>
                    Generate with Gemini
                  </>
                )}
              </button>
            </div>
            <TagsEditor formData={formData} setFormData={setFormData} tagList={tagList} />

            <div
              style={{
                marginTop: '12px',
                padding: '16px',
                background: 'var(--text-field-bg)',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              <div style={{ marginBottom: formData.eligibility.trim() ? '12px' : '0' }}>
                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    marginBottom: '8px',
                    margin: '0 0 8px 0',
                  }}
                >
                  Description
                </h4>
                <EditableText
                  value={formData.description}
                  onCommit={(v) => setField('description', v)}
                  multiline
                  rows={6}
                  placeholder="Description"
                  aria-label="Description"
                  displayStyle={{
                    fontSize: '12px',
                    color: 'var(--foreground)',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    display: 'block',
                    width: '100%',
                  }}
                />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    marginBottom: '8px',
                    margin: '0 0 8px 0',
                  }}
                >
                  Eligibility
                </h4>
                <EditableText
                  value={formData.eligibility}
                  onCommit={(v) => setField('eligibility', v)}
                  multiline
                  rows={5}
                  placeholder="Eligibility requirements"
                  aria-label="Eligibility"
                  displayStyle={{
                    fontSize: '12px',
                    color: 'var(--foreground)',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    display: 'block',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function TagsEditor({
  formData,
  setFormData,
  tagList,
}: {
  formData: FormState;
  setFormData: React.Dispatch<React.SetStateAction<FormState>>;
  tagList: string[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div
        className="compact-mb"
        style={{ marginBottom: '12px' }}
        tabIndex={-1}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setEditing(false);
          }
        }}
      >
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'inherit',
            color: 'var(--color-charcoal-brown-500)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '2px 2px',
            boxShadow: 'inset 0 -1px 0 0 var(--secondary)',
            borderRadius: 2,
          }}
          autoFocus
          placeholder="Comma-separated tags"
          aria-label="Tags"
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          style={{
            marginTop: '6px',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'var(--primary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-1 compact-mb"
      style={{ gap: '6px', marginBottom: '12px', cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setEditing(true);
        }
      }}
      title="Click to edit tags"
    >
      {tagList.length === 0 ? (
        <span style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.55, fontStyle: 'italic' }}>Click to add tags</span>
      ) : (
        tagList.map((name, idx) => (
          <span
            key={`${idx}-${name}`}
            style={{
              padding: '1px 4px',
              fontSize: '10px',
              background: 'var(--color-camel-800)',
              color: 'var(--color-charcoal-brown-500)',
              border: '1px solid var(--secondary)',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            {formatTagName(name)}
          </span>
        ))
      )}
    </div>
  );
}
