import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the main heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Vet Portal" })).toBeInTheDocument();
  });

  it("lists the opening hours", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 2, name: "Opening hours" })).toBeInTheDocument();
    expect(screen.getByText(/Sunday: closed/)).toBeInTheDocument();
  });
});
