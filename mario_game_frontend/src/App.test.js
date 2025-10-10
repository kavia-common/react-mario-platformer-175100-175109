import { render, screen } from '@testing-library/react';
import App from './App';

test('renders game canvas and HUD with default score', () => {
  render(<App />);
  const canvas = screen.getByRole('img', { name: /game canvas/i });
  expect(canvas).toBeInTheDocument();

  const score = screen.getByText(/Score:/i);
  expect(score).toBeInTheDocument();
  expect(score.textContent).toMatch(/Score:\s*0/);
});
