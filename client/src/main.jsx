import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes.jsx';
import './index.css';
import { Provider } from "react-redux";
import { ConfigProvider, theme } from "antd";
import { store } from "./store/store";
import React, { useState } from "react";
import '@ant-design/v5-patch-for-react-19';

const { defaultAlgorithm, darkAlgorithm } = theme;

const Root = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <Provider store={store}>
      <ConfigProvider theme={{ algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm }}>
        <BrowserRouter>
          <AppRoutes isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  );
};

createRoot(document.getElementById('root')).render(<Root />);

export default Root;