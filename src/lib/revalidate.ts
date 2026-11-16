import { env } from "./env";

/**
 * Tell the Next.js portfolio to rebuild its cached pages.
 * Fire-and-forget: a failed revalidation must never fail a CMS save.
 */
export function triggerRevalidate(paths: string[] = ["/"]) {
  if (!env.PORTFOLIO_REVALIDATE_URL || !env.REVALIDATE_SECRET) return;
  fetch(env.PORTFOLIO_REVALIDATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET },
    body: JSON.stringify({ paths }),
  }).catch((err) => console.warn("[revalidate] failed:", err.message));
}
