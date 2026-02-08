import { describe, expect, it } from 'vitest';

import { createProjectSchema } from '../lib/validations';

describe('createProjectSchema', () => {
  const messages = {
    nameRequired: 'Name is required',
    slugRequired: 'Slug is required',
    slugInvalid:
      'Slug must contain only lowercase letters, numbers, and hyphens',
  };

  const schema = createProjectSchema(messages);

  describe('name validation', () => {
    it('should reject empty name', () => {
      const result = schema.safeParse({
        name: '',
        slug: 'valid-slug',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('should accept valid name', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: 'my-project',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('slug validation', () => {
    it('should reject empty slug', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: '',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Slug is required');
      }
    });

    it('should reject slug with uppercase letters', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: 'My-Project',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Slug must contain only lowercase letters, numbers, and hyphens'
        );
      }
    });

    it('should reject slug with spaces', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: 'my project',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Slug must contain only lowercase letters, numbers, and hyphens'
        );
      }
    });

    it('should reject slug with special characters', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: 'my_project!',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Slug must contain only lowercase letters, numbers, and hyphens'
        );
      }
    });

    it('should accept valid slug with lowercase letters', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: 'my-project',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid slug with numbers', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: 'project-123',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid slug with only numbers and hyphens', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: '123-456',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('description validation', () => {
    it('should accept empty description', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: 'my-project',
        description: '',
        visibility: 'private',
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid description', () => {
      const result = schema.safeParse({
        name: 'My Project',
        slug: 'my-project',
        description: 'This is a project description',
        visibility: 'private',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('This is a project description');
      }
    });
  });
});
