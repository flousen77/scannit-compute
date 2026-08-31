export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/internal/', '/api/internal/'],
    },
  };
}
