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
            // POST /token - Get a new token from OneMap using Secrets
            if (url.pathname === "/token" && request.method === "POST") {
                const { ONEMAP_EMAIL, ONEMAP_PASSWORD } = env;

                if (!ONEMAP_EMAIL || !ONEMAP_PASSWORD) {
                    return jsonResponse({ error: "Server configuration error: Missing OneMap credentials." }, 500);
                }

                const response = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: ONEMAP_EMAIL,
                        password: ONEMAP_PASSWORD,
                    }),
                });

                const data = await response.json();
                return jsonResponse(data, response.status);
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
