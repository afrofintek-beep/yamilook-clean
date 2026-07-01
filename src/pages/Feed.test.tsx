// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import Feed from './Feed';
import { mockSupabaseClient, resetMocks } from '@/test/mocks/supabase';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    profile: { display_name: 'Test User' },
  }),
}));

// Mock data for posts
const mockPosts = [
  {
    id: 'post-1',
    user_id: 'user-1',
    type: 'text',
    content: 'First test post',
    media_urls: [],
    location: 'Talatona',
    privacy: 'everyone',
    is_pinned: false,
    likes_count: 5,
    comments_count: 2,
    shares_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      id: 'user-1',
      display_name: 'User One',
      username: 'userone',
      avatar_url: null,
    },
    is_liked: false,
    is_saved: false,
    my_reaction: null,
  },
  {
    id: 'post-2',
    user_id: 'user-2',
    type: 'photo',
    content: 'Second post with photo',
    media_urls: ['https://example.com/photo.jpg'],
    location: 'Patriota',
    privacy: 'everyone',
    is_pinned: false,
    likes_count: 10,
    comments_count: 3,
    shares_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      id: 'user-2',
      display_name: 'User Two',
      username: 'usertwo',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    is_liked: true,
    is_saved: true,
    my_reaction: 'like',
  },
];

// Mock usePosts hook with different states
let mockLoading = false;
let mockFeedPosts = mockPosts;

vi.mock('@/hooks/usePosts', () => ({
  usePosts: () => ({
    feedPosts: mockFeedPosts,
    loading: mockLoading,
    toggleLike: vi.fn(),
    toggleSave: vi.fn(),
    deletePost: vi.fn(),
    sharePost: vi.fn(),
  }),
  PostWithUser: {},
}));

// Mock StatusList component
vi.mock('@/components/status/StatusList', () => ({
  StatusList: () => <div data-testid="status-list">Status List</div>,
}));

// Mock CreatePostSheet
vi.mock('@/components/feed/CreatePostSheet', () => ({
  CreatePostSheet: ({ open }: { open: boolean }) => 
    open ? <div data-testid="create-post-sheet">Create Post Sheet</div> : null,
}));

// Mock CommentsSheet
vi.mock('@/components/feed/CommentsSheet', () => ({
  CommentsSheet: ({ open }: { open: boolean }) => 
    open ? <div data-testid="comments-sheet">Comments Sheet</div> : null,
}));

describe('Feed Page', () => {
  beforeEach(() => {
    resetMocks();
    mockNavigate.mockClear();
    mockLoading = false;
    mockFeedPosts = mockPosts;
  });

  it('renders the header with yamilook title', () => {
    render(<Feed />);
    expect(screen.getByText('yamilook')).toBeInTheDocument();
  });

  it('renders navigation icons in header', () => {
    const { container } = render(<Feed />);
    
    // Should have search, bell, and message icons in header
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    
    const buttons = header?.querySelectorAll('button');
    expect(buttons?.length).toBeGreaterThanOrEqual(3);
  });

  it('renders StatusList component', () => {
    render(<Feed />);
    expect(screen.getByTestId('status-list')).toBeInTheDocument();
  });

  it('renders posts when available', () => {
    render(<Feed />);
    
    expect(screen.getByText('First test post')).toBeInTheDocument();
    expect(screen.getByText('Second post with photo')).toBeInTheDocument();
  });

  it('renders user names in posts', () => {
    render(<Feed />);
    
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('User Two')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    mockLoading = true;
    const { container } = render(<Feed />);
    
    // Should show skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no posts', () => {
    mockFeedPosts = [];
    render(<Feed />);
    
    expect(screen.getByText('Ainda sem publicações')).toBeInTheDocument();
    expect(screen.getByText(/Segue pessoas ou cria/)).toBeInTheDocument();
  });

  it('shows create post button in empty state', () => {
    mockFeedPosts = [];
    render(<Feed />);
    
    expect(screen.getByText('Criar publicação')).toBeInTheDocument();
  });

  it('renders FAB (floating action button) for creating posts', () => {
    const { container } = render(<Feed />);
    
    // FAB should be a fixed button with Plus icon
    const fab = container.querySelector('button.fixed');
    expect(fab).toBeInTheDocument();
  });

  it('opens create post sheet when FAB is clicked', async () => {
    render(<Feed />);
    
    // Find the FAB by its fixed position class
    const fab = document.querySelector('button.fixed');
    expect(fab).toBeInTheDocument();
    
    if (fab) {
      fireEvent.click(fab);
      
      await waitFor(() => {
        expect(screen.getByTestId('create-post-sheet')).toBeInTheDocument();
      });
    }
  });

  it('opens create post sheet from empty state button', async () => {
    mockFeedPosts = [];
    render(<Feed />);
    
    const createButton = screen.getByText('Criar publicação');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('create-post-sheet')).toBeInTheDocument();
    });
  });

  it('renders bottom navigation', () => {
    render(<Feed />);
    
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('Explorar')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('navigates to discover when Explorar is clicked', () => {
    render(<Feed />);
    
    const explorarButton = screen.getByText('Explorar');
    fireEvent.click(explorarButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/discover');
  });

  it('navigates to chat when Chat is clicked', () => {
    render(<Feed />);
    
    const chatButton = screen.getByText('Chat');
    fireEvent.click(chatButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to profile when Perfil is clicked', () => {
    render(<Feed />);
    
    const perfilButton = screen.getByText('Perfil');
    fireEvent.click(perfilButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('navigates to search when search icon is clicked', () => {
    render(<Feed />);
    
    // Find search buttons - one in header, one in bottom nav
    const buttons = screen.getAllByRole('button');
    const searchButton = buttons[0]; // First button in header should be search
    
    fireEvent.click(searchButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  it('navigates to messages when message icon is clicked', () => {
    const { container } = render(<Feed />);
    
    // Find buttons in header
    const header = container.querySelector('header');
    const buttons = header?.querySelectorAll('button');
    
    if (buttons && buttons.length >= 3) {
      fireEvent.click(buttons[2]); // Third button should be messages
      expect(mockNavigate).toHaveBeenCalledWith('/');
    }
  });

  it('renders correct number of posts', () => {
    render(<Feed />);
    
    // We have 2 mock posts
    const articles = document.querySelectorAll('article');
    expect(articles.length).toBe(2);
  });

  it('highlights Feed nav item as active', () => {
    render(<Feed />);
    
    const feedNavButton = screen.getByText('Feed').closest('button');
    // Feed button should have different styling (text-foreground instead of text-muted-foreground)
    expect(feedNavButton).not.toHaveClass('text-muted-foreground');
  });

  it('applies proper layout classes', () => {
    const { container } = render(<Feed />);
    
    // Main container should be min-h-screen and flex column
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('min-h-screen');
    expect(mainDiv).toHaveClass('flex');
    expect(mainDiv).toHaveClass('flex-col');
  });

  it('has sticky header', () => {
    const { container } = render(<Feed />);
    
    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
  });

  it('has sticky bottom navigation', () => {
    const { container } = render(<Feed />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('sticky');
    expect(nav).toHaveClass('bottom-0');
  });
});
