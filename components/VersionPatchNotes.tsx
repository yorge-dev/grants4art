'use client';

import { useState, useRef } from 'react';

interface PatchNote {
  version: string;
  date: string;
  comingSoon?: boolean;
  notes: string[];
}

const PATCH_NOTES: PatchNote[] = [
  {
    version: '0.0.2',
    date: '01/07/2026',
    comingSoon: true,
    notes: [
      'Additional locations (Houston, San Antonio, Dallas, El Paso)',
      'Grant submission form',
      'Grant Eligibility and Description styling optimizations',
      'Bug fixes and stability improvements',
    ],
  },
  {
    version: '0.0.1',
    date: '12/10/2025',
    notes: [
      'Initial release of grants4.art',
      'User location-based grant discovery and aggregation platform',
      "Aggregated amount of grants and total award amount",
      'Grant search based on title, organization, entity, award amount, and deadline',
      'Grant filtering by funding source',
      'Page theme toggle',

    ],
  },
];

interface VersionPatchNotesProps {
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function VersionPatchNotes({ expanded: controlledExpanded, onExpandedChange }: VersionPatchNotesProps) {
  // Initialize internal state from controlled prop if provided
  const [internalExpanded, setInternalExpanded] = useState(controlledExpanded ?? false);
  const prevControlledRef = useRef(controlledExpanded);
  
  // Sync internal state when controlled prop changes - use setTimeout to avoid render-time updates
  if (controlledExpanded !== undefined && prevControlledRef.current !== controlledExpanded) {
    prevControlledRef.current = controlledExpanded;
    setTimeout(() => {
      setInternalExpanded(controlledExpanded);
    }, 0);
  }
  
  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const setIsExpanded = (value: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(value);
    } else {
      setInternalExpanded(value);
    }
  };

  return (
    <div id="version-patch-notes" style={{ marginBottom: '32px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="aol-button"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          cursor: 'pointer',
          border: '2px outset var(--secondary)',
          background: 'var(--text-field-bg)',
          borderRadius: '8px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--foreground)' }}>
          Version History & Patch Notes
        </span>
        <span 
          className="material-icons"
          style={{
            fontSize: '20px',
            color: 'var(--foreground)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        >
          expand_more
        </span>
      </button>

      <div
        style={{
          marginTop: '8px',
          padding: isExpanded ? '16px' : '0 16px',
          background: 'var(--text-field-bg)',
          border: isExpanded ? '2px inset var(--secondary)' : 'none',
          borderRadius: '8px',
          opacity: isExpanded ? 1 : 0,
          maxHeight: isExpanded ? '1000px' : '0',
          overflowY: isExpanded ? 'auto' : 'hidden',
          overflowX: 'hidden',
          transition: 'opacity 0.3s ease, max-height 0.3s ease, padding 0.3s ease, border 0.3s ease',
          visibility: isExpanded ? 'visible' : 'hidden',
        }}
      >
        {PATCH_NOTES.map((patchNote, index) => (
          <div
            key={patchNote.version}
            style={{
              marginBottom: index < PATCH_NOTES.length - 1 ? '24px' : '0',
              paddingBottom: index < PATCH_NOTES.length - 1 ? '24px' : '0',
              borderBottom: index < PATCH_NOTES.length - 1 ? '1px solid var(--secondary)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>
                Version {patchNote.version}
              </h3>
              {patchNote.comingSoon && (
                <span
                  style={{
                    fontSize: '8px',
                    padding: '1px 3px',
                    background: 'var(--inset-bg)',
                    border: '1px solid var(--secondary)',
                    borderRadius: '12px',
                    color: 'var(--foreground)',
                    opacity: 0.7,
                    fontWeight: 'normal',
                    textTransform: 'none',
                    letterSpacing: '0',
                    display: 'inline-block',
                  }}
                >
                  Coming Soon
                </span>
              )}
              <span style={{ fontSize: '12px', color: 'var(--foreground)', opacity: 0.7 }}>
                ({patchNote.date})
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
              {patchNote.notes.map((note, noteIndex) => (
                <li
                  key={noteIndex}
                  style={{
                    fontSize: '12px',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                    marginBottom: '6px',
                  }}
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

