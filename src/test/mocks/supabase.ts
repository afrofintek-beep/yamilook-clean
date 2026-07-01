// @ts-nocheck
import { vi } from 'vitest';

// Mock Supabase client for testing
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  }),
};

// Mock authenticated user
export const mockAuthUser = {
  id: 'test-user-id-123',
  email: 'test@yamilook.test',
  user_metadata: {
    display_name: 'Test User',
    username: 'test_user',
  },
  created_at: new Date().toISOString(),
};

// Mock session
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  user: mockAuthUser,
};

// Mock profile
export const mockProfile = {
  id: 'test-user-id-123',
  display_name: 'Test User',
  username: 'test_user',
  email: 'test@yamilook.test',
  avatar_url: null,
  bio: 'Test bio',
  is_online: true,
  last_seen: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock posts
export const mockPosts = [
  {
    id: 'post-1',
    user_id: 'test-user-id-123',
    type: 'text',
    content: 'This is a test post',
    media_urls: [],
    location: 'Talatona',
    privacy: 'everyone',
    is_pinned: false,
    likes_count: 5,
    comments_count: 2,
    shares_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'post-2',
    user_id: 'test-user-id-123',
    type: 'photo',
    content: 'Photo post test',
    media_urls: ['https://test-url.com/image.jpg'],
    location: 'Patriota',
    privacy: 'everyone',
    is_pinned: false,
    likes_count: 10,
    comments_count: 5,
    shares_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to mock authenticated state
export const mockAuthenticatedState = () => {
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: mockSession },
    error: null,
  });
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockAuthUser },
    error: null,
  });
};

// Helper to reset all mocks
export const resetMocks = () => {
  vi.clearAllMocks();
  mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
};
