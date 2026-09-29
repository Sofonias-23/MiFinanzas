export const dynamic = 'force-dynamic';

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const publisher = client?.replace(/^ca-/, '');

  const body = publisher?.startsWith('pub-')
    ? 'google.com, ' + publisher + ', DIRECT, f08c47fec0942fa0\n'
    : '# Google AdSense publisher ID pending configuration\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
