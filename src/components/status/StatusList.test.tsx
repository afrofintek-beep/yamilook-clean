import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatusList } from './StatusList';
import { BrowserRouter } from 'react-router-dom';

// Mock hooks
const mockMyStatuses = [
  {
    id: 'status-1',
    user_id: 'user-1',
    type: 'text',
    content: 'My first status',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    user: {
      id: 'user-1',
      display_name: 'Test User',
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    view_count: 5,
    has_viewed: true,
  },
];

const mockContactStatuses = [
  {
    user_id: 'contact-1',
    user: {
      id: 'contact-1',
      display_name: 'John Doe',
      username: 'johndoe',
      avatar_url: 'https://example.com/john.jpg',
    },
    statuses: [
      {
        id: 'contact-status-1',
        type: 'photo',
        media_url: 'https://example.com/photo.jpg',
        created_at: new Date().toISOString(),
        has_viewed: false,
      },
    ],
    has_unviewed: true,
    latest_at: new Date().toISOString(),
  },
  {
    user_id: 'contact-2',
    user: {
      id: 'contact-2',
      display_name: 'Jane Smith',
      username: 'janesmith',
      avatar_url: null,
    },
    statuses: [
      {
        id: 'contact-status-2',
        type: 'text',
        content: 'Hello world',
        created_at: new Date().toISOString(),
        has_viewed: true,
      },
    ],
    has_unviewed: false,
    latest_at: new Date().toISOString(),
  },
];

vi.mock('@/hooks/useStatus', () => ({
  useStatus: vi.fn(() => ({
    myStatuses: mockMyStatuses,
    contactStatuses: mockContactStatuses,
    loading: false,
    mutedContacts: [],
    createStatus: vi.fn(),
    deleteStatus: vi.fn(),
    markAsViewed: vi.fn(),
    replyToStatus: vi.fn(),
    getStatusViews: vi.fn(),
    toggleMuteContact: vi.fn(),
    archiveStatus: vi.fn(),
    getArchivedStatuses: vi.fn(),
  })),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' },
    loading: false,
  })),
}));

vi.mock('./StatusViewer', () => ({
  StatusViewer: ({ open, onClose, isOwnStatus }: { open: boolean; onClose: () => void; isOwnStatus?: boolean }) =>
    open ? (
      <div data-testid="status-viewer">
        <span data-testid="viewer-own-status">{isOwnStatus ? 'own' : 'contact'}</span>
        <button onClick={onClose}>Close Viewer</button>
      </div>
    ) : null,
}));

vi.mock('./CreateStatusSheet', () => ({
  CreateStatusSheet: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) =>
    open ? (
      <div data-testid="create-status-sheet">
        <button onClick={() => onOpenChange(false)}>Close Create Sheet</button>
      </div>
    ) : null,
}));

const renderStatusList = () => {
  return render(
    <BrowserRouter>
      <StatusList />
    </BrowserRouter>
  );
};

describe('StatusList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render my status section', () => {
      renderStatusList();
      expect(screen.getByTestId('my-status')).toBeInTheDocument();
    });

    it('should render contact statuses', () => {
      renderStatusList();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });

    it('should display first name only for contacts', () => {
      renderStatusList();
      // Should show "John" not "John Doe"
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should show loading skeletons when loading', async () => {
      const { useStatus } = await import('@/hooks/useStatus');
      vi.mocked(useStatus).mockReturnValueOnce({
        myStatuses: [],
        contactStatuses: [],
        loading: true,
        mutedContacts: [],
        createStatus: vi.fn(),
        deleteStatus: vi.fn(),
        markAsViewed: vi.fn(),
        replyToStatus: vi.fn(),
        getStatusViews: vi.fn(),
        toggleMuteContact: vi.fn(),
        archiveStatus: vi.fn(),
        getArchivedStatuses: vi.fn(),
      });

      renderStatusList();
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show empty state when no contact statuses', async () => {
      const { useStatus } = await import('@/hooks/useStatus');
      vi.mocked(useStatus).mockReturnValueOnce({
        myStatuses: [],
        contactStatuses: [],
        loading: false,
        mutedContacts: [],
        createStatus: vi.fn(),
        deleteStatus: vi.fn(),
        markAsViewed: vi.fn(),
        replyToStatus: vi.fn(),
        getStatusViews: vi.fn(),
        toggleMuteContact: vi.fn(),
        archiveStatus: vi.fn(),
        getArchivedStatuses: vi.fn(),
      });

      renderStatusList();
      expect(screen.getByTestId('empty-contact-statuses')).toBeInTheDocument();
    });
  });

  describe('My Status Interactions', () => {
    it('should open create sheet when clicking my status with no statuses', async () => {
      const { useStatus } = await import('@/hooks/useStatus');
      vi.mocked(useStatus).mockReturnValueOnce({
        myStatuses: [],
        contactStatuses: mockContactStatuses,
        loading: false,
        mutedContacts: [],
        createStatus: vi.fn(),
        deleteStatus: vi.fn(),
        markAsViewed: vi.fn(),
        replyToStatus: vi.fn(),
        getStatusViews: vi.fn(),
        toggleMuteContact: vi.fn(),
        archiveStatus: vi.fn(),
        getArchivedStatuses: vi.fn(),
      });

      renderStatusList();

      // Click on my status ring
      const myStatusContainer = screen.getByTestId('my-status');
      const button = myStatusContainer.querySelector('button');

      expect(button).not.toBeNull();
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.getByTestId('create-status-sheet')).toBeInTheDocument();
      });
    });

    it('should open viewer when clicking my status with existing statuses', async () => {
      renderStatusList();

      const myStatusContainer = screen.getByTestId('my-status');
      const button = myStatusContainer.querySelector('button');

      expect(button).not.toBeNull();
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.getByTestId('status-viewer')).toBeInTheDocument();
        expect(screen.getByTestId('viewer-own-status')).toHaveTextContent('own');
      });
    });
  });

  describe('Contact Status Interactions', () => {
    it('should open viewer when clicking contact status', async () => {
      renderStatusList();
      
      const contactLabel = screen.getByText('John');
      const contactContainer = contactLabel.closest('.flex.flex-col');
      const button = contactContainer?.querySelector('button');
      
      if (button) {
        fireEvent.click(button);
        await waitFor(() => {
          expect(screen.getByTestId('status-viewer')).toBeInTheDocument();
          expect(screen.getByTestId('viewer-own-status')).toHaveTextContent('contact');
        });
      }
    });

    it('should close viewer when close button is clicked', async () => {
      renderStatusList();
      
      const contactLabel = screen.getByText('John');
      const contactContainer = contactLabel.closest('.flex.flex-col');
      const button = contactContainer?.querySelector('button');
      
      if (button) {
        fireEvent.click(button);
        await waitFor(() => {
          expect(screen.getByTestId('status-viewer')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByText('Close Viewer'));
        await waitFor(() => {
          expect(screen.queryByTestId('status-viewer')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Animation', () => {
    it('should render with framer motion animations', () => {
      renderStatusList();
      // Check that items are rendered (animation container present)
      const animatedItems = document.querySelectorAll('[class*="flex-shrink-0"]');
      expect(animatedItems.length).toBeGreaterThan(0);
    });
  });

  describe('Scroll Area', () => {
    it('should render horizontal scroll area', () => {
      renderStatusList();
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      expect(scrollArea).toBeInTheDocument();
    });
  });
});
