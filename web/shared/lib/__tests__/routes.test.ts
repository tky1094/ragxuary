import { describe, expect, it } from 'vitest';
import {
  ADMIN_ROUTES,
  isAdminRoute,
  isProtectedRoute,
  isPublicRoute,
  matchesRoute,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
} from '../routes';

describe('routes configuration', () => {
  describe('PUBLIC_ROUTES', () => {
    it('should include login and register', () => {
      expect(PUBLIC_ROUTES).toContain('/login');
      expect(PUBLIC_ROUTES).toContain('/register');
    });
  });

  describe('PROTECTED_ROUTES', () => {
    it('should include root, projects, p, and settings', () => {
      expect(PROTECTED_ROUTES).toContain('/');
      expect(PROTECTED_ROUTES).toContain('/projects');
      expect(PROTECTED_ROUTES).toContain('/p');
      expect(PROTECTED_ROUTES).toContain('/settings');
    });
  });

  describe('ADMIN_ROUTES', () => {
    it('should include settings/admin', () => {
      expect(ADMIN_ROUTES).toContain('/settings/admin');
    });
  });
});

describe('matchesRoute', () => {
  it('should match exact routes', () => {
    expect(matchesRoute('/login', ['/login'])).toBe(true);
    expect(matchesRoute('/register', ['/register'])).toBe(true);
  });

  it('should match prefix routes', () => {
    expect(matchesRoute('/projects/123', ['/projects'])).toBe(true);
    expect(matchesRoute('/projects/abc/edit', ['/projects'])).toBe(true);
    expect(matchesRoute('/p/project-1', ['/p'])).toBe(true);
    expect(matchesRoute('/p/project-1/docs', ['/p'])).toBe(true);
  });

  it('should handle root path correctly', () => {
    expect(matchesRoute('/', ['/'])).toBe(true);
    expect(matchesRoute('/login', ['/'])).toBe(false);
    expect(matchesRoute('/projects', ['/'])).toBe(false);
  });

  it('should return false for non-matching routes', () => {
    expect(matchesRoute('/other', ['/login', '/register'])).toBe(false);
    expect(matchesRoute('/loginx', ['/login'])).toBe(false);
  });
});

describe('isPublicRoute', () => {
  it('should return true for login route', () => {
    expect(isPublicRoute('/login')).toBe(true);
  });

  it('should return true for register route', () => {
    expect(isPublicRoute('/register')).toBe(true);
  });

  it('should return false for protected routes', () => {
    expect(isPublicRoute('/')).toBe(false);
    expect(isPublicRoute('/projects')).toBe(false);
    expect(isPublicRoute('/p')).toBe(false);
    expect(isPublicRoute('/settings')).toBe(false);
  });

  it('should return false for admin routes', () => {
    expect(isPublicRoute('/settings/admin')).toBe(false);
    expect(isPublicRoute('/settings/admin/users')).toBe(false);
  });
});

describe('isProtectedRoute', () => {
  it('should return true for root path', () => {
    expect(isProtectedRoute('/')).toBe(true);
  });

  it('should return true for projects routes', () => {
    expect(isProtectedRoute('/projects')).toBe(true);
    expect(isProtectedRoute('/projects/123')).toBe(true);
  });

  it('should return true for p (project) routes', () => {
    expect(isProtectedRoute('/p')).toBe(true);
    expect(isProtectedRoute('/p/project-1')).toBe(true);
    expect(isProtectedRoute('/p/project-1/docs')).toBe(true);
    expect(isProtectedRoute('/p/project-1/chat')).toBe(true);
    expect(isProtectedRoute('/p/project-1/settings')).toBe(true);
    expect(isProtectedRoute('/p/project-1/edit')).toBe(true);
  });

  it('should return true for settings routes', () => {
    expect(isProtectedRoute('/settings')).toBe(true);
    expect(isProtectedRoute('/settings/personal')).toBe(true);
    expect(isProtectedRoute('/settings/admin')).toBe(true);
  });

  it('should return false for public routes', () => {
    expect(isProtectedRoute('/login')).toBe(false);
    expect(isProtectedRoute('/register')).toBe(false);
  });
});

describe('isAdminRoute', () => {
  it('should return true for admin routes', () => {
    expect(isAdminRoute('/settings/admin')).toBe(true);
    expect(isAdminRoute('/settings/admin/users')).toBe(true);
    expect(isAdminRoute('/settings/admin/models')).toBe(true);
    expect(isAdminRoute('/settings/admin/groups')).toBe(true);
  });

  it('should return false for non-admin routes', () => {
    expect(isAdminRoute('/')).toBe(false);
    expect(isAdminRoute('/login')).toBe(false);
    expect(isAdminRoute('/projects')).toBe(false);
    expect(isAdminRoute('/settings/personal')).toBe(false);
  });
});
