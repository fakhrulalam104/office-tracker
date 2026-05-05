type DebugDetails = Record<string, unknown>;

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("password") ||
    normalized.includes("secret") ||
    normalized.includes("cookie") ||
    normalized.includes("uri") ||
    normalized.includes("connection") ||
    normalized === "token" ||
    normalized.endsWith("token")
  );
}

export function maskEmail(value: unknown) {
  if (typeof value !== "string" || !value.includes("@")) {
    return value;
  }

  const [name, domain] = value.split("@");
  const visibleName = name.slice(0, 2);
  const visibleDomain = domain.split(".")[0]?.slice(0, 2) ?? "";
  const domainSuffix = domain.includes(".") ? `.${domain.split(".").slice(1).join(".")}` : "";

  return `${visibleName}***@${visibleDomain}***${domainSuffix}`;
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as DebugDetails).map(([key, entry]) => {
      if (key.toLowerCase() === "email") {
        return [key, maskEmail(entry)];
      }

      if (isSensitiveKey(key)) {
        return [key, entry ? "[redacted]" : entry];
      }

      return [key, sanitize(entry)];
    })
  );
}

export function authDebug(step: string, details: DebugDetails = {}) {
  console.log(
    `[office-auth] ${step}`,
    sanitize({
      at: new Date().toISOString(),
      ...details
    })
  );
}

export function authDebugError(step: string, error: unknown, details: DebugDetails = {}) {
  const safeError =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack?.split("\n").slice(0, 4).join("\n")
        }
      : { message: String(error) };

  console.error(
    `[office-auth] ${step}`,
    sanitize({
      at: new Date().toISOString(),
      ...details,
      error: safeError
    })
  );
}
