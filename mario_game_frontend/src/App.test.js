import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders HUD with score and lives", () => {
  render(<App />);
  expect(screen.getByText(/Score:/i)).toBeInTheDocument();
  expect(screen.getByText(/Lives:/i)).toBeInTheDocument();
});
