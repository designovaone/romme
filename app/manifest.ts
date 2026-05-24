import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rommé',
    short_name: 'Rommé',
    description: 'Score Tracker für Rommé',
    start_url: '/',
    display: 'standalone',
    theme_color: '#1e40af',
    background_color: '#fafaf9',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
