import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lubri-app.vercel.app';

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        {
            url: `${baseUrl}/tv/public`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        // Add other public routes if they exist
    ]
}
