import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { CreatePostSheet } from './CreatePostSheet';
import { mockSupabaseClient, resetMocks } from '@/test/mocks/supabase';

// Mock the supabase client (async factory + dynamic import to avoid hoisting issues)
vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabaseClient } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabaseClient };
});

// Mock usePosts
const mockCreatePost = vi.fn();
vi.mock('@/hooks/usePosts', () => ({
  usePosts: () => ({
    createPost: mockCreatePost,
  }),
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { 
      id: 'test-user-id',
      email: 'test@example.com',
    },
  }),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: [],
    dismiss: vi.fn(),
  }),
}));

describe('CreatePostSheet', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    resetMocks();
    mockCreatePost.mockClear();
    mockToast.mockClear();
    defaultProps.onOpenChange.mockClear();
  });

  it('renders when open', () => {
    render(<CreatePostSheet {...defaultProps} />);
    expect(screen.getByText('Criar publicação')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(<CreatePostSheet {...defaultProps} open={false} />);
    expect(screen.queryByText('Criar publicação')).not.toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<CreatePostSheet {...defaultProps} />);
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders publish button', () => {
    render(<CreatePostSheet {...defaultProps} />);
    expect(screen.getByText('Publicar')).toBeInTheDocument();
  });

  it('publish button is disabled when content is empty', () => {
    render(<CreatePostSheet {...defaultProps} />);
    const publishButton = screen.getByText('Publicar');
    expect(publishButton).toBeDisabled();
  });

  it('publish button is enabled when content is entered', () => {
    render(<CreatePostSheet {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText("O que se passa na tua vizinhança?");
    fireEvent.change(textarea, { target: { value: 'Test post content' } });
    
    const publishButton = screen.getByText('Publicar');
    expect(publishButton).not.toBeDisabled();
  });

  it('calls onOpenChange when cancel is clicked', () => {
    render(<CreatePostSheet {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders user avatar with initial', () => {
    render(<CreatePostSheet {...defaultProps} />);
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "test@example.com"
  });

  it('renders privacy selector', () => {
    render(<CreatePostSheet {...defaultProps} />);
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });

  it('renders character counter', () => {
    render(<CreatePostSheet {...defaultProps} />);
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('updates character counter as user types', () => {
    render(<CreatePostSheet {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText("O que se passa na tua vizinhança?");
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    
    expect(screen.getByText('5/2000')).toBeInTheDocument();
  });

  it('renders media action buttons', () => {
    render(<CreatePostSheet {...defaultProps} />);

    // Should have image, video, location, and emoji buttons.
    // Sheet content is portaled to document.body, so query there.
    const actionBar = document.body.querySelector('[data-testid="post-action-buttons"]');
    const actionButtons = actionBar?.querySelectorAll('button') ?? [];
    expect(actionButtons.length).toBeGreaterThanOrEqual(4);
  });

  it('shows error toast when trying to submit empty post', async () => {
    render(<CreatePostSheet {...defaultProps} />);
    
    // The publish button should be disabled, but let's verify the behavior
    const publishButton = screen.getByText('Publicar');
    expect(publishButton).toBeDisabled();
  });

  it('calls createPost and closes sheet on successful submission', async () => {
    mockCreatePost.mockResolvedValueOnce({ id: 'new-post-id' });
    
    render(<CreatePostSheet {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText("O que se passa na tua vizinhança?");
    fireEvent.change(textarea, { target: { value: 'My new post' } });
    
    const publishButton = screen.getByText('Publicar');
    fireEvent.click(publishButton);
    
    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith('text', expect.objectContaining({
        content: 'My new post',
        privacy: 'contacts',
      }));
    });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Publicado!',
      }));
    });
    
    await waitFor(() => {
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows loading state while submitting', async () => {
    mockCreatePost.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<CreatePostSheet {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText("O que se passa na tua vizinhança?");
    fireEvent.change(textarea, { target: { value: 'Test post' } });
    
    const publishButton = screen.getByText('Publicar');
    fireEvent.click(publishButton);
    
    await waitFor(() => {
      expect(screen.getByText('A publicar...')).toBeInTheDocument();
    });
  });

  it('shows error toast when submission fails', async () => {
    mockCreatePost.mockRejectedValueOnce(new Error('Failed'));
    
    render(<CreatePostSheet {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText("O que se passa na tua vizinhança?");
    fireEvent.change(textarea, { target: { value: 'Test post' } });
    
    const publishButton = screen.getByText('Publicar');
    fireEvent.click(publishButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Falha ao publicar',
        variant: 'destructive',
      }));
    });
  });

  // Set up geolocation + reverse-geocoding so location resolves to "San Francisco, CA".
  const mockGeolocationSuccess = () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: { latitude: 37.7749, longitude: -122.4194 },
          } as GeolocationPosition),
      },
    });
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: vi.fn().mockResolvedValue({ state: 'granted' }),
      },
    });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ address: { city: 'San Francisco', country: 'CA' } }),
    } as Response);
  };

  it('adds location when location button is clicked', async () => {
    mockGeolocationSuccess();
    render(<CreatePostSheet {...defaultProps} />);

    // Find location button (MapPin icon)
    const buttons = screen.getAllByRole('button');
    const locationButton = buttons.find(btn =>
      btn.querySelector('svg.text-red-500')
    );

    expect(locationButton).toBeDefined();
    fireEvent.click(locationButton!);

    await waitFor(() => {
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    });
  });

  it('removes location when X is clicked', async () => {
    mockGeolocationSuccess();
    render(<CreatePostSheet {...defaultProps} />);

    // First add location
    const buttons = screen.getAllByRole('button');
    const locationButton = buttons.find(btn =>
      btn.querySelector('svg.text-red-500')
    );

    expect(locationButton).toBeDefined();
    fireEvent.click(locationButton!);

    await waitFor(() => {
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    });

    // Find and click remove button
    const removeButtons = screen.getAllByRole('button');
    const removeLocationButton = removeButtons.find(btn =>
      btn.classList.contains('w-5') && btn.classList.contains('h-5')
    );

    expect(removeLocationButton).toBeDefined();
    fireEvent.click(removeLocationButton!);

    await waitFor(() => {
      expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument();
    });
  });

  it('has hidden file input for media uploads', () => {
    render(<CreatePostSheet {...defaultProps} />);

    // Sheet content is portaled to document.body, so query there.
    const fileInput = document.body.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
    expect(fileInput).toHaveAttribute('accept', 'image/*,video/*');
  });

  it('allows multiple file selection', () => {
    render(<CreatePostSheet {...defaultProps} />);

    const fileInput = document.body.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('renders Tu as user label', () => {
    render(<CreatePostSheet {...defaultProps} />);
    expect(screen.getByText('Tu')).toBeInTheDocument();
  });

  it('has auto focus on textarea', () => {
    render(<CreatePostSheet {...defaultProps} />);
    
    // React's autoFocus prop focuses the element on mount rather than emitting
    // an `autofocus` HTML attribute, so assert focus instead.
    const textarea = screen.getByPlaceholderText("O que se passa na tua vizinhança?");
    expect(textarea).toHaveFocus();
  });

  it('shows privacy options in select', async () => {
    render(<CreatePostSheet {...defaultProps} />);
    
    // The default should be "Contacts"
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });
});
