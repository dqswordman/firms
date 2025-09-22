import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

describe('App scaffold', () => {
  it('renders heading', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>
    );
    expect(screen.getByRole('heading', { name: /firms wildfire explorer vnext/i })).toBeInTheDocument();
  });
});
