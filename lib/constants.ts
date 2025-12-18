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
  { slug: 'photographer', name: 'Photographer', icon: 'camera_alt', color: '#6C5CE7' },
  { slug: 'fashion-artist', name: 'Fashion Artist', icon: 'checkroom', color: '#FD79A8' },
  { slug: 'interior-designer', name: 'Interior Designer', icon: 'home', color: '#FDCB6E' },
  { slug: 'illustrator', name: 'Illustrator', icon: 'brush', color: '#E17055' },
  { slug: 'producer', name: 'Producer', icon: 'movie', color: '#74B9FF' },
  { slug: 'director', name: 'Director', icon: 'movie_creation', color: '#55EFC4' },
  { slug: 'sound-engineer', name: 'Sound Engineer', icon: 'graphic_eq', color: '#A29BFE' },
  { slug: 'animator', name: 'Animator', icon: 'animation', color: '#FF7675' },
  { slug: 'videographer', name: 'Videographer', icon: 'video_camera', color: '#00B894' },
  { slug: 'fine-artist', name: 'Fine Artist', icon: 'color_lens', color: '#E84393' },
];

export const ALLOWED_TAG_SLUGS = GRANT_TAGS.map(t => t.slug);

export const GRANT_CATEGORIES = [
  { slug: 'government', name: 'Government', icon: 'account_balance', color: '#90A4AE' },
  { slug: 'corporate', name: 'Corporate', icon: 'business', color: '#81C784' },
  { slug: 'private', name: 'Private', icon: 'handshake', color: '#FFD54F' },
  { slug: 'public', name: 'Public', icon: 'location_city', color: '#64B5F6' },
];
