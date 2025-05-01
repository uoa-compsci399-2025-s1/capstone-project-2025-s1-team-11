import React from "react";
import { Card, Button } from "antd";

const ThemeToggleButton = ({ isDarkMode, toggleTheme }) => {
  return (
    <Card style={{ width: "max-content", margin: "1rem" }}>
      <Button onClick={toggleTheme}>
        Change Theme to {isDarkMode ? "Light" : "Dark"}
      </Button>
    </Card>
  );
};

export default ThemeToggleButton;