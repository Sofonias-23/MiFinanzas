export const dynamic = 'force-dynamic';

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const configuredPublisher = client?.replace(/^ca-/, '');
  const publisher = configuredPublisher?.startsWith('pub-')
    ? configuredPublisher
    : 'pub-2118685293203157';

  const body = 'google.com, ' + publisher + ', DIRECT, f08c47fec0942fa0\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
