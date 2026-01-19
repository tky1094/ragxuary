import { describe, it, expect } from 'vitest';
import {
  matchesRoute,
  isPublicRoute,
  isProtectedRoute,
  isAdminRoute,
  isPublicDocsRoute,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ADMIN_ROUTES,
} from '../routes';

describe('routes configuration', () => {
  describe('PUBLIC_ROUTES', () => {
    it('should include login and register', () => {
      expect(PUBLIC_ROUTES).toContain('/login');
      expect(PUBLIC_ROUTES).toContain('/register');
    });
  });

  describe('PROTECTED_ROUTES', () => {
    it('should include root, projects, and chat', () => {
      expect(PROTECTED_ROUTES).toContain('/');
      expect(PROTECTED_ROUTES).toContain('/projects');
      expect(PROTECTED_ROUTES).toContain('/chat');
    });
  });

  describe('ADMIN_ROUTES', () => {
    it('should include admin', () => {
      expect(ADMIN_ROUTES).toContain('/admin');
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
    expect(matchesRoute('/chat/project-1', ['/chat'])).toBe(true);
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
    expect(isPublicRoute('/chat')).toBe(false);
  });

  it('should return false for admin routes', () => {
    expect(isPublicRoute('/admin')).toBe(false);
    expect(isPublicRoute('/admin/users')).toBe(false);
  });
});

describe('isProtectedRoute', () => {
  it('should return true for root path', () => {
    expect(isProtectedRoute('/')).toBe(true);
  });

  it('should return true for projects routes', () => {
    expect(isProtectedRoute('/projects')).toBe(true);
    expect(isProtectedRoute('/projects/123')).toBe(true);
    expect(isProtectedRoute('/projects/abc/edit')).toBe(true);
  });

  it('should return true for chat routes', () => {
    expect(isProtectedRoute('/chat')).toBe(true);
    expect(isProtectedRoute('/chat/project-1')).toBe(true);
    expect(isProtectedRoute('/chat/project-1/conv-1')).toBe(true);
  });

  it('should return false for public routes', () => {
    expect(isProtectedRoute('/login')).toBe(false);
    expect(isProtectedRoute('/register')).toBe(false);
  });

  it('should return false for docs routes', () => {
    expect(isProtectedRoute('/docs')).toBe(false);
    expect(isProtectedRoute('/docs/project-1')).toBe(false);
  });
});

describe('isAdminRoute', () => {
  it('should return true for admin routes', () => {
    expect(isAdminRoute('/admin')).toBe(true);
    expect(isAdminRoute('/admin/users')).toBe(true);
    expect(isAdminRoute('/admin/settings')).toBe(true);
    expect(isAdminRoute('/admin/groups')).toBe(true);
  });

  it('should return false for non-admin routes', () => {
    expect(isAdminRoute('/')).toBe(false);
    expect(isAdminRoute('/login')).toBe(false);
    expect(isAdminRoute('/projects')).toBe(false);
  });
});

describe('isPublicDocsRoute', () => {
  it('should return true for docs root', () => {
    expect(isPublicDocsRoute('/docs')).toBe(true);
  });

  it('should return true for docs subpaths', () => {
    expect(isPublicDocsRoute('/docs/project-1')).toBe(true);
    expect(isPublicDocsRoute('/docs/project-1/page')).toBe(true);
    expect(isPublicDocsRoute('/docs/project-1/section/page')).toBe(true);
  });

  it('should return false for non-docs routes', () => {
    expect(isPublicDocsRoute('/')).toBe(false);
    expect(isPublicDocsRoute('/documents')).toBe(false);
    expect(isPublicDocsRoute('/docsx')).toBe(false);
  });
});
