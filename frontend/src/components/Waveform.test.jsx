import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Waveform from "../components/Waveform.jsx";

describe("Waveform", () => {
  it("renders 28 bars", () => {
    const { container } = render(<Waveform level={0.5} active={true} />);
    const bars = container.querySelectorAll(".bg-accent");
    expect(bars.length).toBe(28);
  });

  it("renders low, uniform bars when inactive", () => {
    const { container } = render(<Waveform level={0} active={false} />);
    const bars = container.querySelectorAll(".bg-accent");
    bars.forEach((bar) => {
      expect(bar.style.height).toBe("4px");
    });
  });
});
