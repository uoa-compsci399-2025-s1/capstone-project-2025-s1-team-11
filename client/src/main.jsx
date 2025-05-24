import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes.jsx';
import './index.css';
import { Provider } from "react-redux";
import { ConfigProvider, theme, App as AntApp } from "antd";
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
        <AntApp>
          <BrowserRouter>
            <AppRoutes isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </Provider>
  );
};

// Ensure we only create one root
const rootElement = document.getElementById('root');
if (!rootElement._reactRoot) {
  rootElement._reactRoot = createRoot(rootElement);
}
rootElement._reactRoot.render(<Root />);

export default Root;