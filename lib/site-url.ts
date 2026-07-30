const LOCAL_SITE_URL = "http://localhost:3000";

function withProtocol(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) ? value : `https://${value}`;
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = withProtocol(configuredUrl || LOCAL_SITE_URL);

  try {
    return new URL(candidate);
  } catch {
    console.warn(
      `[site-url] Ignoring invalid NEXT_PUBLIC_SITE_URL: ${configuredUrl}`,
    );
    return new URL(LOCAL_SITE_URL);
  }
}

export function getSiteOrigin() {
  return getSiteUrl().origin;
}
