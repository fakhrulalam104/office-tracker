export function getAuthSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.MONGODB_URI;
}

export function getAuthSecretSource() {
  if (process.env.AUTH_SECRET) {
    return "AUTH_SECRET";
  }

  if (process.env.NEXTAUTH_SECRET) {
    return "NEXTAUTH_SECRET";
  }

  if (process.env.MONGODB_URI) {
    return "MONGODB_URI_FALLBACK";
  }

  return "missing";
}

export function getAuthUrl() {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
}

export function getAuthUrlSource() {
  if (process.env.AUTH_URL) {
    return "AUTH_URL";
  }

  if (process.env.NEXTAUTH_URL) {
    return "NEXTAUTH_URL";
  }

  if (process.env.VERCEL_URL) {
    return "VERCEL_URL";
  }

  return "localhost-fallback";
}

export function getMetadataBaseUrl() {
  return getAuthUrl() ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
}
