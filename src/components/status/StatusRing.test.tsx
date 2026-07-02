import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { StatusRing } from './StatusRing';

describe('StatusRing', () => {
  const defaultProps = {
    displayName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  it('renders with display name initial as fallback', () => {
    render(<StatusRing {...defaultProps} avatarUrl={null} />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders avatar image when provided', () => {
    render(<StatusRing {...defaultProps} />);
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', defaultProps.avatarUrl);
    expect(avatar).toHaveAttribute('alt', defaultProps.displayName);
  });

  it('shows amber ring for unviewed status', () => {
    const { container } = render(
      <StatusRing {...defaultProps} hasStatus hasUnviewed />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('shows gray ring for viewed status', () => {
    const { container } = render(
      <StatusRing {...defaultProps} hasStatus hasUnviewed={false} />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-muted-foreground/30');
  });

  it('shows add button for own status', () => {
    render(<StatusRing {...defaultProps} isOwn />);
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('does not show add button for others status', () => {
    render(<StatusRing {...defaultProps} isOwn={false} />);
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('applies small size classes', () => {
    const { container } = render(<StatusRing {...defaultProps} size="sm" />);
    const avatar = container.querySelector('[class*="w-12"]');
    expect(avatar).toBeInTheDocument();
  });

  it('applies medium size classes (default)', () => {
    const { container } = render(<StatusRing {...defaultProps} />);
    const avatar = container.querySelector('[class*="w-16"]');
    expect(avatar).toBeInTheDocument();
  });

  it('applies large size classes', () => {
    const { container } = render(<StatusRing {...defaultProps} size="lg" />);
    const avatar = container.querySelector('[class*="w-20"]');
    expect(avatar).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<StatusRing {...defaultProps} onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatusRing {...defaultProps} className="custom-class" />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('shows ring when isOwn is true', () => {
    const { container } = render(<StatusRing {...defaultProps} isOwn />);
    const button = container.querySelector('button');
    // Ring padding class should be applied
    expect(button?.className).toContain('p-');
  });

  it('does not show ring when no status and not own', () => {
    const { container } = render(
      <StatusRing {...defaultProps} hasStatus={false} isOwn={false} />
    );
    const button = container.querySelector('button');
    expect(button).not.toHaveClass('bg-primary');
    expect(button).not.toHaveClass('bg-muted-foreground/30');
  });

  it('renders fallback with question mark when displayName is empty', () => {
    render(<StatusRing displayName="" avatarUrl={null} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('has proper accessibility - button role', () => {
    render(<StatusRing {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies active scale transform on interaction', () => {
    const { container } = render(<StatusRing {...defaultProps} />);
    const button = container.querySelector('button');
    expect(button).toHaveClass('active:scale-95');
  });
});
