import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggleSwitch from "./../ThemeToggleSwitch"; // Adjust the path as needed

describe("ThemeToggleSwitch", () => {
  it("renders with light mode icon when isDarkMode is false", () => {
    render(<ThemeToggleSwitch isDarkMode={false} toggleTheme={jest.fn()} />);
    expect(screen.getByRole("switch")).toHaveTextContent("🌞");
  });

  it("renders with dark mode icon when isDarkMode is true", () => {
    render(<ThemeToggleSwitch isDarkMode={true} toggleTheme={jest.fn()} />);
    expect(screen.getByRole("switch")).toHaveTextContent("🌙");
  });

  it("calls toggleTheme on switch click", () => {
    const toggleTheme = jest.fn();
    render(<ThemeToggleSwitch isDarkMode={false} toggleTheme={toggleTheme} />);

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("applies dark theme attribute when toggled", () => {
    const toggleTheme = () => {
      document.body.setAttribute("data-theme", "dark");
    };

    render(<ThemeToggleSwitch isDarkMode={false} toggleTheme={toggleTheme} />);
    fireEvent.click(screen.getByRole("switch"));

    expect(document.body.getAttribute("data-theme")).toBe("dark");
  });
});