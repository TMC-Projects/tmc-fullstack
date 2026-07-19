import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://njara.web.id';
  const now = new Date();

  return [
    // Root
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },

    // B2C Player Portal — public pages
    {
      url: `${baseUrl}/app/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/app/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // B2B Club Portal — public pages
    {
      url: `${baseUrl}/portal/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/portal/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Team Portal — public pages
    {
      url: `${baseUrl}/team-portal/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/team-portal/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
