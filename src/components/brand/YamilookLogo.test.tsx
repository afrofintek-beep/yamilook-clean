import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import YamilookLogo from './YamilookLogo';

describe('YamilookLogo', () => {
  it('renders the logo image', () => {
    render(<YamilookLogo />);
    const logo = screen.getByAltText('Yamilook');
    expect(logo).toBeInTheDocument();
  });

  it('applies default size', () => {
    render(<YamilookLogo />);
    const logo = screen.getByAltText('Yamilook');
    // Default size "md" renders the image at width 150.
    expect(logo).toHaveAttribute('width', '150');
  });

  it('applies custom size', () => {
    render(<YamilookLogo size="lg" />);
    const logo = screen.getByAltText('Yamilook');
    // Size "lg" renders the image at width 200.
    expect(logo).toHaveAttribute('width', '200');
  });

  it('applies custom className', () => {
    render(<YamilookLogo className="custom-class" />);
    // The image sits inside a `div.relative` wrapper; the custom className is
    // applied to the outermost container.
    const container = screen.getByAltText('Yamilook').closest('.custom-class');
    expect(container).not.toBeNull();
    expect(container).toHaveClass('custom-class');
  });
});
