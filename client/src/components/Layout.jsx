import React from 'react';
import { Layout, Breadcrumb, theme } from 'antd';
import { Navigation } from "./navigation.jsx";
import { Link, useLocation } from 'react-router';
import logo from "../../public/AssesslyLogoSmall.png";
import StaticContextBar from './StaticContextBar';

const { Header, Content, Footer } = Layout;

const MCQLayout = ({ children, isDarkMode, setIsDarkMode }) => {
  const location = useLocation();
  const isPlainPage = ["/", "/about"].includes(location.pathname); // Borderless pages

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  const layoutStyle = {
    minHeight: '100vh', 
    minWidth: '100vw', 
    display: 'flex', 
    flexDirection: 'column',
    backgroundColor: isDarkMode ? '#121212' : '#f0f2f5',
  };

  const headerStyle = {
    backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    color: isDarkMode ? '#ffffff' : '#000000'
  };

  const contentStyle = { 
    padding: isPlainPage ? 0 : '32px 48px', 
    flex: 1 
  };

  const contentContainerStyle = {
    background: isDarkMode ? '#1f1f1f' : '#ffffff',
    borderRadius: borderRadiusLG,
    minHeight: '800px',
    padding: '32px',
    color: isDarkMode ? '#ffffff' : '#000000'
  };

  const footerStyle = {
    textAlign: 'center', 
    padding: '16px 24px',
    backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
    color: isDarkMode ? '#ffffff' : '#000000'
  };

  const breadcrumbStyle = {
    marginBottom: '24px',
    color: isDarkMode ? '#ffffff' : 'inherit'
  };

  return (
    <Layout style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', flexDirection: 'column' }}>
      <Layout style={layoutStyle}>
        <Header style={headerStyle}>
          <img src={logo} alt="Assessly Logo" style={{ height: "40px", marginRight: "24px" }} />
          <Navigation isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}/>
        </Header>

          {["/builder", "/randomiser", "/marker"].includes(location.pathname) && (
          <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
            <StaticContextBar />
          </div>
        )}
        <Content style={{ paddingBottom: isPlainPage ? 0 : '48px', flex: 1, position: 'relative', zIndex: 1 }}>
          {isPlainPage ? (
            children
          ) : (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div
                style={{
                  background: colorBgContainer,
                  borderRadius: borderRadiusLG,
                  minHeight: '800px',
                  padding: '32px'
                }}
              >
                {children}
              </div>
            </div>
          )}
        </Content>

        <Footer style={footerStyle}>
          University of Auckland | {new Date().getFullYear()} | Created by Team 11 (Cache Converters)
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MCQLayout;