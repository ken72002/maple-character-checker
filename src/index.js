import { handleVision } from "./vision.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/vision") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "只接受 POST 請求。" }), {
          status: 405,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Allow": "POST"
          }
        });
      }
      return handleVision(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
