/**
 * True on the production deployment, where each brand answers on its own domain. The VPS sets
 * APP_ENV=production; VERCEL_ENV still counts so the old Vercel deployment keeps working.
 * Dependency-free: the proxy and server code both import it.
 */
export function isProductionDeployment(): boolean {
  return process.env.APP_ENV === "production" || process.env.VERCEL_ENV === "production";
}
