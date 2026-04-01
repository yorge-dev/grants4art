'use client';

import { useState } from 'react';

interface AdminAddSourceFormProps {
  onAdd: (name: string, url: string) => Promise<{ success: boolean; error?: string }>;
  onMessage: (message: string, type: 'success' | 'error') => void;
}

export function AdminAddSourceForm({ onAdd, onMessage }: AdminAddSourceFormProps) {
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;

    setAddingSource(true);
    try {
      const result = await onAdd(newSourceName.trim(), newSourceUrl.trim());
      if (result.success) {
        setNewSourceName('');
        setNewSourceUrl('');
        onMessage('Source added successfully', 'success');
      } else {
        onMessage(result.error || 'Failed to add source', 'error');
      }
    } catch (error) {
      console.error('Error adding source:', error);
      onMessage('Error adding source', 'error');
    } finally {
      setAddingSource(false);
    }
  };

  return (
    <div style={{ margin: '0 8px 16px 8px' }}>
      <style>{`
        @media (max-width: 640px) {
          .source-inputs-container {
            flex-direction: column !important;
          }
          .source-inputs-container input {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
        }
      `}</style>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          className="source-inputs-container"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            flexWrap: 'wrap',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <input
            type="text"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            placeholder="Source Name"
            required
            className="aol-input"
            style={{
              flex: '1 1 150px',
              minWidth: '0',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="url"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            placeholder="URL"
            required
            className="aol-input"
            style={{
              flex: '2 1 200px',
              minWidth: '0',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={addingSource}
            style={{
              flexShrink: 0,
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: addingSource ? 'not-allowed' : 'pointer',
              opacity: addingSource ? 0.6 : 1,
            }}
          >
            {addingSource ? 'Adding...' : 'Add Source'}
          </button>
        </div>
      </form>
    </div>
  );
}
