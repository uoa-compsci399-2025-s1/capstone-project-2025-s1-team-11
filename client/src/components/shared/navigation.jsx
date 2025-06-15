import { NavLink } from "react-router";
import { Button, Space } from "antd";
import ThemeToggleButton from "./ThemeToggleSwitch.jsx";
import React from "react";

export function Navigation({isDarkMode, setIsDarkMode}) {
  const navStyles = {
    width: "100%",
  };

  const containerStyles = {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    paddingRight: "24px",
  };

  const textButtonStyles = {
    borderRadius: 0,
    fontWeight: 400,
    padding: "2.2em",
    backgroundColor: isDarkMode ? "#1f1f1f" : "#ffffff",
    color: isDarkMode ? "#ffffff" : undefined,
  };

  const primaryButtonStyles = {
    borderRadius: 0,
    fontWeight: 400,
    padding: "2.2em",
  };

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <nav style={navStyles}>
      <div style={containerStyles}>
        <Space style={{ margin: 0 }}>
          <NavLink to="/" end>
            {({ isActive }) => (
              <Button type={isActive ? "primary" : "text"} style={isActive ? primaryButtonStyles : textButtonStyles}>Home</Button>
            )}
          </NavLink>
          <NavLink to="/builder" end>
            {({ isActive }) => (
              <Button type={isActive ? "primary" : "text"} style={isActive ? primaryButtonStyles : textButtonStyles}>MCQ Builder</Button>
            )}
          </NavLink>
          <NavLink to="/randomiser" end>
            {({ isActive }) => (
              <Button type={isActive ? "primary" : "text"} style={isActive ? primaryButtonStyles : textButtonStyles}>MCQ Randomiser</Button>
            )}
          </NavLink>
          <NavLink to="/marker" end>
            {({ isActive }) => (
              <Button type={isActive ? "primary" : "text"} style={isActive ? primaryButtonStyles : textButtonStyles}>MCQ Auto-Marker</Button>
            )}
          </NavLink>
        </Space>
        <Space style={{ margin: 0 }}>
          <NavLink to="/about" end>
            {({ isActive }) => (
              <Button type={isActive ? "primary" : "text"} style={isActive ? primaryButtonStyles : textButtonStyles}>About</Button>
            )}
          </NavLink>
          <NavLink to="/documentation" end>
            {({ isActive }) => (
              <Button type={isActive ? "primary" : "text"} style={isActive ? primaryButtonStyles : textButtonStyles}>Documentation</Button>
            )}
          </NavLink>
          <ThemeToggleButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        </Space>
      </div>
    </nav>
  );
}
