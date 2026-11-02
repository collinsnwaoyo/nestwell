import "server-only";

/**
 * Cron routes accept only `Authorization: Bearer ${CRON_SECRET}`, which Vercel
 * Cron sends. With no secret configured nothing is accepted, so a missing
 * variable can't leave the route open to "Bearer undefined".
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}
