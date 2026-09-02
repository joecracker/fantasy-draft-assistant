// Cloudflare Pages Function — serves GET /api/health
// The app checks this endpoint to confirm the backend is reachable.
// Sleeper data and player analysis run client-side (the app calls the Sleeper
// API directly and uses the user's own AI key), so this is the only server route.

export const onRequestGet: PagesFunction = async () => {
  return Response.json({ status: "ok" });
};