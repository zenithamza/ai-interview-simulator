import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Timer from "../components/Timer.jsx";

describe("Timer", () => {
  it("renders starting at 00:00", () => {
    render(<Timer running={false} resetKey={0} />);
    expect(screen.getByText(/00:00/)).toBeInTheDocument();
  });

  it("re-renders cleanly when resetKey changes", () => {
    const { rerender } = render(<Timer running={false} resetKey={0} />);
    rerender(<Timer running={false} resetKey={1} />);
    expect(screen.getByText(/00:00/)).toBeInTheDocument();
  });
});
