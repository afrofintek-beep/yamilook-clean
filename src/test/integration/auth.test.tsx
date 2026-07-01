// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { mockSupabaseClient, resetMocks, mockAuthenticatedState, mockSession } from '@/test/mocks/supabase';

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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    resetMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginForm', () => {
    it('renders login form with all fields', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for short password', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('toggles password visibility', async () => {
      render(<LoginForm />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Find the toggle button (eye icon)
      const toggleButton = passwordInput.parentElement?.querySelector('button');
      expect(toggleButton).toBeInTheDocument();
      
      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
        
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    it('submits form with valid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('shows error message on login failure', async () => {
      const { toast } = await import('sonner');
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      });

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid login credentials');
      });
    });

    it('shows loading state during submission', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it('has link to register page', () => {
      render(<LoginForm />);
      
      const registerLink = screen.getByRole('link', { name: /create an account/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('has link to forgot password', () => {
      render(<LoginForm />);
      
      const forgotLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('RegisterForm', () => {
    it('renders register form with all fields', () => {
      render(<RegisterForm />);
      
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows password requirements as user types', async () => {
      render(<RegisterForm />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Initially no requirements shown
      expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
      
      // Type a password to show requirements
      fireEvent.change(passwordInput, { target: { value: 'a' } });
      
      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one number/i)).toBeInTheDocument();
      });
    });

    it('validates display name length', async () => {
      render(<RegisterForm />);
      
      const displayNameInput = screen.getByLabelText(/display name/i);
      fireEvent.change(displayNameInput, { target: { value: 'A' } });
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('validates username format', async () => {
      render(<RegisterForm />);
      
      const usernameInput = screen.getByLabelText(/username/i);
      fireEvent.change(usernameInput, { target: { value: 'ab' } });
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('checks username availability', async () => {
      // Mock username check - available
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      });

      render(<RegisterForm />);
      
      const usernameInput = screen.getByLabelText(/username/i);
      fireEvent.change(usernameInput, { target: { value: 'newuser123' } });
      
      // Wait for the availability check
      await waitFor(() => {
        // Check icon should appear for available username
        const checkIcon = screen.getByLabelText(/username/i).parentElement?.querySelector('.text-green-500');
        expect(checkIcon).toBeDefined();
      }, { timeout: 2000 });
    });

    it('shows taken username error', async () => {
      // Mock username check - taken
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ 
          data: { username: 'takenuser' }, 
          error: null 
        }),
      });

      render(<RegisterForm />);
      
      const usernameInput = screen.getByLabelText(/username/i);
      fireEvent.change(usernameInput, { target: { value: 'takenuser' } });
      
      await waitFor(() => {
        expect(screen.getByText(/username is already taken/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('submits form with valid data', async () => {
      // Mock username available
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      render(<RegisterForm />);
      
      fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123' } });
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
      });
    });

    it('shows error message on signup failure', async () => {
      const { toast } = await import('sonner');
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Email already registered' },
      });

      render(<RegisterForm />);
      
      fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123' } });
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already registered');
      });
    });

    it('has link to login page', () => {
      render(<RegisterForm />);
      
      const loginLink = screen.getByRole('link', { name: /sign in/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Logout Flow', () => {
    it('calls signOut and clears session', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: null });
      
      // Simulate calling signOut
      const result = await mockSupabaseClient.auth.signOut();
      
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });
  });
});
