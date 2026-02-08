import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateProjectForm } from '../components/CreateProjectForm';
import * as useProjectsModule from '../hooks/useProjects';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      name: 'Project Name',
      slug: 'Slug',
      description: 'Description',
      visibility: 'Visibility',
      public: 'Public',
      private: 'Private',
      privateDescription: 'Only members can access',
      publicDescription: 'Anyone can view',
      slugHint:
        'Used in URLs (e.g., /p/{slug}). Cannot be changed after creation.',
      createProject: 'Create Project',
      creating: 'Creating...',
      nameRequired: 'Project name is required',
      slugRequired: 'Slug is required',
      slugInvalid:
        'Slug must contain only lowercase letters, numbers, and hyphens',
    };
    return translations[key] || key;
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProviders(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('CreateProjectForm', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useProjectsModule, 'useCreateProject').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      mutate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useProjectsModule.useCreateProject>);
  });

  it('should render form fields', () => {
    renderWithProviders(<CreateProjectForm />);

    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Slug')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Project' })
    ).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateProjectForm />);

    const submitButton = screen.getByRole('button', { name: 'Create Project' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument();
    });
  });

  it('should show slug validation error for invalid characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateProjectForm />);

    const nameInput = screen.getByLabelText('Project Name');
    const slugInput = screen.getByLabelText('Slug');
    const submitButton = screen.getByRole('button', { name: 'Create Project' });

    await user.type(nameInput, 'Test Project');
    await user.clear(slugInput);
    await user.type(slugInput, 'Invalid Slug!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Slug must contain only lowercase letters, numbers, and hyphens'
        )
      ).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockMutateAsync.mockResolvedValueOnce({
      id: '1',
      name: 'Test Project',
      slug: 'test-project',
    });

    renderWithProviders(<CreateProjectForm onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText('Project Name');
    const descriptionInput = screen.getByLabelText('Description');
    const submitButton = screen.getByRole('button', { name: 'Create Project' });

    await user.type(nameInput, 'Test Project');
    // Slug is auto-generated from name as "test-project"
    await user.type(descriptionInput, 'A test project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        body: {
          name: 'Test Project',
          slug: 'test-project',
          description: 'A test project',
          visibility: 'private',
        },
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should disable form during submission', async () => {
    vi.spyOn(useProjectsModule, 'useCreateProject').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      isSuccess: false,
      error: null,
      mutate: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useProjectsModule.useCreateProject>);

    renderWithProviders(<CreateProjectForm />);

    expect(screen.getByLabelText('Project Name')).toBeDisabled();
    expect(screen.getByLabelText('Slug')).toBeDisabled();
    expect(screen.getByLabelText('Description')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({
      id: '1',
      name: 'Test Project',
      slug: 'test-project',
    });

    renderWithProviders(<CreateProjectForm />);

    const nameInput = screen.getByLabelText('Project Name');
    const submitButton = screen.getByRole('button', { name: 'Create Project' });

    await user.type(nameInput, 'Test Project');
    // Slug is auto-generated from name
    await user.click(submitButton);

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(screen.getByLabelText('Slug')).toHaveValue('');
    });
  });

  it('should auto-generate slug from name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateProjectForm />);

    const nameInput = screen.getByLabelText('Project Name');
    await user.type(nameInput, 'My Test Project');

    const slugInput = screen.getByLabelText('Slug');
    expect(slugInput).toHaveValue('my-test-project');
  });

  it('should not overwrite slug when user has manually edited it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateProjectForm />);

    const nameInput = screen.getByLabelText('Project Name');
    const slugInput = screen.getByLabelText('Slug');

    await user.type(nameInput, 'First');
    expect(slugInput).toHaveValue('first');

    await user.clear(slugInput);
    await user.type(slugInput, 'custom-slug');

    await user.clear(nameInput);
    await user.type(nameInput, 'Second Name');
    expect(slugInput).toHaveValue('custom-slug');
  });

  it('should display slug hint description', () => {
    renderWithProviders(<CreateProjectForm />);

    expect(
      screen.getByText(
        'Used in URLs (e.g., /p/{slug}). Cannot be changed after creation.'
      )
    ).toBeInTheDocument();
  });

  it('should display visibility choice cards', () => {
    renderWithProviders(<CreateProjectForm />);

    expect(screen.getByText('Visibility')).toBeInTheDocument();
    expect(screen.getByText('Only members can access')).toBeInTheDocument();
    expect(screen.getByText('Anyone can view')).toBeInTheDocument();
  });

  it('should render description as textarea', () => {
    renderWithProviders(<CreateProjectForm />);

    const descriptionField = screen.getByLabelText('Description');
    expect(descriptionField.tagName).toBe('TEXTAREA');
  });
});
