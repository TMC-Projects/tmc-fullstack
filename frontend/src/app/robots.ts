import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/app/login',
          '/app/register',
          '/portal/login',
          '/portal/register',
          '/team-portal/login',
          '/team-portal/register',
          '/p/',
        ],
        disallow: [
          '/app/dashboard',
          '/app/profile',
          '/app/applications',
          '/app/feed',
          '/app/invitations',
          '/app/subscription',
          '/app/clubs',
          '/app/player',
          '/portal/dashboard',
          '/portal/profile',
          '/portal/trials',
          '/portal/talents',
          '/portal/players',
          '/portal/club',
          '/portal/teams',
          '/portal/transfer-market',
          '/portal/subscriptions',
          '/team-portal/dashboard',
          '/team-portal/teams',
          '/team-portal/player-freeagent',
          '/team-portal/subscriptions',
        ],
      },
    ],
    sitemap: 'https://njara.web.id/sitemap.xml',
    host: 'https://njara.web.id',
  };
}
