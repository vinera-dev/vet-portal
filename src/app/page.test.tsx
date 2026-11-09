import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the main heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Vet Portal" })).toBeInTheDocument();
  });
});
