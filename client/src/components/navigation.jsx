import { NavLink } from "react-router";
import { Button, Space } from "antd";

export function Navigation({ isDarkMode }) {
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
    fontWeight: 500,
    padding: "2.2em",
    backgroundColor: isDarkMode ? "#1f1f1f" : "#ffffff",
    color: isDarkMode ? "#ffffff" : undefined,
  };

  const primaryButtonStyles = {
    borderRadius: 0,
    fontWeight: 500,
    padding: "2.2em",
  };

  const docButtonStyles = {
    borderRadius: 0,
    backgroundColor: isDarkMode ? "#1f1f1f" : "#ffffff",
    fontWeight: 500,
    color: isDarkMode ? "#ffffff" : undefined,
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
          <NavLink to="/console" end>
            {({ isActive }) => (
              <Button type={isActive ? "primary" : "text"} style={isActive ? primaryButtonStyles : textButtonStyles}>Dev Console</Button>
            )}
          </NavLink>
        </Space>
        <Space style={{ margin: 0 }}>
          <NavLink to="/about" end>
            {({ isActive }) => (
              <Button type={isActive ? "primary" : "text"} style={isActive ? primaryButtonStyles : textButtonStyles}>About</Button>
            )}
          </NavLink>
          <a href="/documentation" target="_blank" rel="noopener noreferrer">
            <Button type="text" style={docButtonStyles}>Documentation</Button>
          </a>
        </Space>
      </div>
    </nav>
  );
}
