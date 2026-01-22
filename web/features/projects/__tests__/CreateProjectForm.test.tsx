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
    const slugInput = screen.getByLabelText('Slug');
    const descriptionInput = screen.getByLabelText('Description');
    const submitButton = screen.getByRole('button', { name: 'Create Project' });

    await user.type(nameInput, 'Test Project');
    await user.type(slugInput, 'test-project');
    await user.type(descriptionInput, 'A test project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        body: {
          name: 'Test Project',
          slug: 'test-project',
          description: 'A test project',
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
    const slugInput = screen.getByLabelText('Slug');
    const submitButton = screen.getByRole('button', { name: 'Create Project' });

    await user.type(nameInput, 'Test Project');
    await user.type(slugInput, 'test-project');
    await user.click(submitButton);

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(slugInput).toHaveValue('');
    });
  });
});
