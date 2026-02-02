/**
 * Route configuration for authentication middleware
 */

// Routes that don't require authentication
export const PUBLIC_ROUTES = ['/login', '/register'];

// Routes that require authentication
export const PROTECTED_ROUTES = ['/', '/projects', '/p', '/settings'];

// Routes that require admin role
export const ADMIN_ROUTES = ['/settings/admin'];

// Setup route (accessible only when setup is not completed)
export const SETUP_ROUTES = ['/setup'];

/**
 * Check if a path matches any route in the list
 * Handles both exact matches and prefix matches (e.g., /projects/123)
 */
export function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route === '/') {
      return path === '/';
    }
    return path === route || path.startsWith(`${route}/`);
  });
}

/**
 * Check if path is a public route (login, register)
 */
export function isPublicRoute(path: string): boolean {
  return matchesRoute(path, PUBLIC_ROUTES);
}

/**
 * Check if path is a protected route (requires authentication)
 */
export function isProtectedRoute(path: string): boolean {
  return matchesRoute(path, PROTECTED_ROUTES);
}

/**
 * Check if path is an admin route
 */
export function isAdminRoute(path: string): boolean {
  return matchesRoute(path, ADMIN_ROUTES);
}

/**
 * Check if path is a setup route
 */
export function isSetupRoute(path: string): boolean {
  return matchesRoute(path, SETUP_ROUTES);
}
