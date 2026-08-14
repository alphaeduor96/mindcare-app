type RateLimitOptions = {
  scope: string;
  identifier: string;
  maxRequests: number;
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
};

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(digest);
}

export function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim();

  return (
    request.headers.get("cf-connecting-ip") ||
    firstForwardedIp ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkRateLimit(supabase: any, options: RateLimitOptions): Promise<RateLimitResult> {
  const keyHash = await sha256(`${options.scope}:${options.identifier}`);
  const { data, error } = await supabase.rpc("check_edge_rate_limit", {
    p_scope: options.scope,
    p_key_hash: keyHash,
    p_max_requests: options.maxRequests,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed:", error);
    return {
      allowed: true,
      remaining: options.maxRequests,
      resetAt: new Date(Date.now() + options.windowSeconds * 1000).toISOString(),
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: row?.allowed !== false,
    remaining: Number(row?.remaining ?? options.maxRequests),
    resetAt: row?.reset_at || new Date(Date.now() + options.windowSeconds * 1000).toISOString(),
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt,
  };
}
