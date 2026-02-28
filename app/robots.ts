import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/settings', '/onboarding', '/api/'],
    },
    sitemap: 'https://www.tipjars.co/sitemap.xml',
  }
}
