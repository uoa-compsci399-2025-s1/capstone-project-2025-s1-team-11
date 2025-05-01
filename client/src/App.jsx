// src/App.jsx
import React, { useEffect, useState } from "react";
import MCQLayout from "./components/Layout";
import DevelopmentWarning from "./components/developmentWarning";
import PopupWarning from "./components/popupWarning";
import {Outlet} from "react-router";
import "./index.css";
import ThemeToggleButton from "./components/ThemeToggleButton.jsx";

const App = ({ isDarkMode, toggleTheme }) => {
  const [showWarning, setShowWarning] = useState(false);

  // Check for non-Chromium browsers
  useEffect(() => {
    const isChromium = !!window.chrome;
    if (!isChromium) {
      setShowWarning(true);
    }
  }, []);

  return (
    <MCQLayout>
      <ThemeToggleButton isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <DevelopmentWarning />
      <PopupWarning
        visible={showWarning}
        onClose={() => setShowWarning(false)}
      />
      <main>
        <Outlet />
      </main>
    </MCQLayout>
  );
};

export default App;
