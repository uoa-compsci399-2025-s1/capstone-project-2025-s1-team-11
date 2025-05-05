// src/App.jsx
import React, { useEffect, useState } from "react";
import MCQLayout from "./components/Layout";
import DevelopmentWarning from "./components/developmentWarning";
import PopupWarning from "./components/popupWarning";
import {Outlet} from "react-router";
import "./index.css";
import ThemeToggleButton from "./components/ThemeToggleButton.jsx";
import { ConfigProvider, theme } from "antd";


const App = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Check for non-Chromium browsers
  useEffect(() => {
    const isChromium = !!window.chrome;
    if (!isChromium) {
      setShowWarning(true);
    }
  }, []);

  const { defaultAlgorithm, darkAlgorithm } = theme;

  // Edit theme colors below
  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <MCQLayout isDarkMode={isDarkMode}>
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
    </ConfigProvider>
  );
};

export default App;