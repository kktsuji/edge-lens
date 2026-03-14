import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Icon } from "../Icon";

describe("Icon", () => {
  it("renders an SVG with default size", () => {
    const { container } = render(
      <Icon>
        <circle cx="12" cy="12" r="10" />
      </Icon>,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("16");
    expect(svg?.getAttribute("height")).toBe("16");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders with custom size", () => {
    const { container } = render(
      <Icon size={24}>
        <circle cx="12" cy="12" r="10" />
      </Icon>,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("height")).toBe("24");
  });

  it("applies className when provided", () => {
    const { container } = render(
      <Icon className="custom-class">
        <circle cx="12" cy="12" r="10" />
      </Icon>,
    );
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains("custom-class")).toBe(true);
  });

  it("renders children inside the SVG", () => {
    const { container } = render(
      <Icon>
        <rect data-testid="test-rect" x="0" y="0" width="10" height="10" />
      </Icon>,
    );
    expect(container.querySelector("rect")).not.toBeNull();
  });

  it("has correct SVG attributes", () => {
    const { container } = render(
      <Icon>
        <circle cx="12" cy="12" r="10" />
      </Icon>,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg?.getAttribute("fill")).toBe("none");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("stroke-width")).toBe("2");
    expect(svg?.getAttribute("stroke-linecap")).toBe("round");
    expect(svg?.getAttribute("stroke-linejoin")).toBe("round");
  });
});
