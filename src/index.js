/**
 * OneMap Token Proxy Worker
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Helper to return JSON with CORS
        const jsonResponse = (data, status = 200) => {
            return new Response(JSON.stringify(data), {
                status: status,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*", // Consider restricting this in production
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        };

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return jsonResponse({}, 204);
        }

        try {
            // GET or POST /token - Get a new token from OneMap using Secrets (with KV Caching)
            if (url.pathname === "/token" && (request.method === "POST" || request.method === "GET")) {
                const { ONEMAP_EMAIL, ONEMAP_PASSWORD, ONEMAP_CACHE } = env;

                if (!ONEMAP_EMAIL || !ONEMAP_PASSWORD) {
                    return jsonResponse({ error: "Server configuration error: Missing OneMap credentials." }, 500);
                }

                // 1. Try to get from cache
                if (ONEMAP_CACHE) {
                    const cachedToken = await ONEMAP_CACHE.get("access_token");
                    if (cachedToken) {
                        return jsonResponse({ access_token: cachedToken, source: "cache" });
                    }
                }

                // 2. Not in cache, fetch from OneMap
                const response = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: ONEMAP_EMAIL,
                        password: ONEMAP_PASSWORD,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    return jsonResponse(errorData, response.status);
                }

                const data = await response.json();
                const token = data.access_token;

                // 3. Save to cache if KV is enabled
                // OneMap tokens usually last 3 days (259200s). 
                // We'll set a safe TTL of 2.5 days (216000s) to avoid edge cases.
                if (ONEMAP_CACHE && token) {
                    await ONEMAP_CACHE.put("access_token", token, { expirationTtl: 216000 });
                }

                return jsonResponse({ access_token: token, source: "onemap" });
            }

            // GET /token/status?token=... - Check JWT validity
            if (url.pathname === "/token/status" && request.method === "GET") {
                const token = url.searchParams.get("token");
                if (!token) {
                    return jsonResponse({ error: "Missing token parameter." }, 400);
                }

                try {
                    // JWT typically has 3 parts: header.payload.signature
                    const payloadBase64 = token.split(".")[1];
                    const payload = JSON.parse(atob(payloadBase64));

                    const now = Math.floor(Date.now() / 1000);
                    const expired = payload.exp < now;
                    const timeLeft = payload.exp - now;

                    return jsonResponse({
                        valid: !expired,
                        expires_at: payload.exp,
                        time_left_seconds: timeLeft,
                        issued_at: payload.iat,
                    });
                } catch (e) {
                    return jsonResponse({ error: "Invalid token format." }, 400);
                }
            }

            return jsonResponse({ error: "Not Found" }, 404);
        } catch (error) {
            return jsonResponse({ error: error.message }, 500);
        }
    },
};
