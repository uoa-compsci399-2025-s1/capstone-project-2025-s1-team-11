import React from "react";
import { Switch } from "antd";

const ThemeToggleSwitch = ({ isDarkMode, toggleTheme }) => {
  return (
      <Switch
        checked={isDarkMode}
        onChange={toggleTheme}
        checkedChildren="🌙"
        unCheckedChildren="🌞"
      />
  );
};

export default ThemeToggleSwitch;