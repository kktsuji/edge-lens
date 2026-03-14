import { render, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { SidebarToggleButton } from "../SidebarToggleButton";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  cleanup();
});

describe("SidebarToggleButton", () => {
  it("renders a button with aria-label", () => {
    const { getByRole } = render(
      <SidebarToggleButton isOpen={false} onClick={() => {}} />,
    );
    const button = getByRole("button");
    expect(button).not.toBeNull();
    expect(button.getAttribute("aria-label")).toBe("sidebar.toggle");
  });

  it("has aria-expanded false when isOpen is false", () => {
    const { getByRole } = render(
      <SidebarToggleButton isOpen={false} onClick={() => {}} />,
    );
    expect(getByRole("button").getAttribute("aria-expanded")).toBe("false");
  });

  it("has aria-expanded true when isOpen is true", () => {
    const { getByRole } = render(
      <SidebarToggleButton isOpen={true} onClick={() => {}} />,
    );
    expect(getByRole("button").getAttribute("aria-expanded")).toBe("true");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <SidebarToggleButton isOpen={false} onClick={onClick} />,
    );
    fireEvent.click(getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
