export interface TagDefinition {
  slug: string;
  name: string;
  icon: string;
  color?: string; // Optional override, otherwise theme default
}

export const GRANT_TAGS: TagDefinition[] = [
  { slug: 'visual-artists', name: 'Visual Artists', icon: 'palette', color: '#FF6B6B' },
  { slug: 'performing-artists', name: 'Performing Artists', icon: 'theater_comedy', color: '#4ECDC4' },
  { slug: 'writers', name: 'Writers', icon: 'edit', color: '#FFE66D' },
  { slug: 'filmmakers', name: 'Filmmakers', icon: 'videocam', color: '#95E1D3' },
  { slug: 'designers', name: 'Designers', icon: 'computer', color: '#F38181' },
  { slug: 'musicians', name: 'Musicians', icon: 'music_note', color: '#AA96DA' },
  { slug: 'creative-space', name: 'Creative Space', icon: 'account_balance', color: '#FCBAD3' },
  { slug: 'venue', name: 'Venue', icon: 'business', color: '#A8E6CF' },
  { slug: 'nonprofit', name: 'Nonprofit', icon: 'handshake', color: '#FFD93D' },
];

export const ALLOWED_TAG_SLUGS = GRANT_TAGS.map(t => t.slug);

export const GRANT_CATEGORIES = [
  { slug: 'government', name: 'Government', icon: 'account_balance', color: '#90A4AE' },
  { slug: 'corporate', name: 'Corporate', icon: 'business', color: '#81C784' },
  { slug: 'private', name: 'Private', icon: 'handshake', color: '#FFD54F' },
  { slug: 'public', name: 'Public', icon: 'location_city', color: '#64B5F6' },
];
