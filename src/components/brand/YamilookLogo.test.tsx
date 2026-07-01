// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import YamilookLogo from './YamilookLogo';

describe('YamilookLogo', () => {
  it('renders the logo image', () => {
    render(<YamilookLogo />);
    const logo = screen.getByAltText('yamilook');
    expect(logo).toBeInTheDocument();
  });

  it('applies default size', () => {
    render(<YamilookLogo />);
    const logo = screen.getByAltText('yamilook');
    expect(logo).toHaveClass('h-8');
  });

  it('applies custom size', () => {
    render(<YamilookLogo size="lg" />);
    const logo = screen.getByAltText('yamilook');
    expect(logo).toHaveClass('h-12');
  });

  it('applies custom className', () => {
    render(<YamilookLogo className="custom-class" />);
    const container = screen.getByAltText('yamilook').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});
