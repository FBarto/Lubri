import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lubri-app.vercel.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/employee/', '/api/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
