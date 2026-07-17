import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import YamilookLogo from './YamilookLogo';

// O componente renderiza DOIS wordmarks com alt="Yamilook" (tinta escura p/
// tema claro + tinta clara p/ tema escuro, alternados por CSS `dark:`), por
// isso as queries usam getAllByAltText.

describe('YamilookLogo', () => {
  it('renders both theme variants of the logo image', () => {
    render(<YamilookLogo />);
    const logos = screen.getAllByAltText('Yamilook');
    expect(logos).toHaveLength(2);
    logos.forEach((logo) => expect(logo).toBeInTheDocument());
  });

  it('applies default size', () => {
    render(<YamilookLogo />);
    const [logo] = screen.getAllByAltText('Yamilook');
    // Default size "md" renders the image at width 150.
    expect(logo).toHaveAttribute('width', '150');
  });

  it('applies custom size', () => {
    render(<YamilookLogo size="lg" />);
    const [logo] = screen.getAllByAltText('Yamilook');
    // Size "lg" renders the image at width 200.
    expect(logo).toHaveAttribute('width', '200');
  });

  it('applies custom className', () => {
    render(<YamilookLogo className="custom-class" />);
    // The image sits inside a `div.relative` wrapper; the custom className is
    // applied to the outermost container.
    const container = screen.getAllByAltText('Yamilook')[0].closest('.custom-class');
    expect(container).not.toBeNull();
    expect(container).toHaveClass('custom-class');
  });
});
