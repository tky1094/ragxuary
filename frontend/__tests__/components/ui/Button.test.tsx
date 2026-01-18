import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("should render with default props", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it("should render with destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);

    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveAttribute("data-variant", "destructive");
  });

  it("should render with outline variant", () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole("button", { name: /outline/i });
    expect(button).toHaveAttribute("data-variant", "outline");
  });

  it("should render with secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole("button", { name: /secondary/i });
    expect(button).toHaveAttribute("data-variant", "secondary");
  });

  it("should render with ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);

    const button = screen.getByRole("button", { name: /ghost/i });
    expect(button).toHaveAttribute("data-variant", "ghost");
  });

  it("should render with link variant", () => {
    render(<Button variant="link">Link</Button>);

    const button = screen.getByRole("button", { name: /link/i });
    expect(button).toHaveAttribute("data-variant", "link");
  });

  it("should render with small size", () => {
    render(<Button size="sm">Small</Button>);

    const button = screen.getByRole("button", { name: /small/i });
    expect(button).toHaveAttribute("data-size", "sm");
  });

  it("should render with large size", () => {
    render(<Button size="lg">Large</Button>);

    const button = screen.getByRole("button", { name: /large/i });
    expect(button).toHaveAttribute("data-size", "lg");
  });

  it("should render with icon size", () => {
    render(<Button size="icon">Icon</Button>);

    const button = screen.getByRole("button", { name: /icon/i });
    expect(button).toHaveAttribute("data-size", "icon");
  });

  it("should handle click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  it("should not trigger click when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );

    const button = screen.getByRole("button", { name: /disabled/i });
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole("button", { name: /custom/i });
    expect(button).toHaveClass("custom-class");
  });

  it("should render as a different element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });
});
