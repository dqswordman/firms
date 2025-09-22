import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App scaffold', () => {
  it('renders heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /firms wildfire explorer vnext/i })).toBeInTheDocument();
  });
});
