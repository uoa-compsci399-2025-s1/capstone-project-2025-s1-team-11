import React from 'react';
import { Layout, Breadcrumb, theme } from 'antd';
import { Navigation } from "./navigation.jsx";
import { Link, useLocation } from 'react-router';
import logo from '../assets/AssesslyLogoSmall.png';
import StaticContextBar from './StaticContextBar';

const { Header, Content, Footer } = Layout;

const MCQLayout = ({ children, isDarkMode, setIsDarkMode }) => {
  const location = useLocation();
  const isPlainPage = ["/", "/about"].includes(location.pathname); 

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  const layoutStyle = {
    minHeight: '100vh', 
    minWidth: '100vw',
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

  const footerStyle = {
    textAlign: 'center', 
    padding: '16px 24px',
    backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
    color: isDarkMode ? '#ffffff' : '#000000'
  };

  const contentStyle = {
    padding: location.pathname === '/' ? '0' : '24px 48px',
    flex: 1,
    backgroundColor: isDarkMode ? '#121212' : '#f0f2f5'
  };

  const breadcrumbStyle = {
    margin: '16px 0',
    color: isDarkMode ? '#ffffff' : '#000000'
  };

  const contentContainerStyle = {
    padding: 24,
    minHeight: 380,
    backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
    borderRadius: borderRadiusLG
  };
  
  return (
    <Layout style={{layoutStyle}}>
      <Header style={headerStyle}>
        <img src={logo} alt="Assessly Logo" style={{ height: "40px", marginRight: "24px" }} />
        <Navigation isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}/>
      </Header>

      {["/builder", "/randomiser", "/marker"].includes(location.pathname) && (
        <div style={{ padding: '0 48px' }}>
          <StaticContextBar />
        </div>
      )}

      <Content style={contentStyle}>
        {isPlainPage ? (
          children
        ) : (
          <div style={{margin: '0 auto' }}>
            <Breadcrumb
              style={breadcrumbStyle}
              items={[
                {
                  title: <Link to="/">Home</Link>,
                },
                {
                  title: <Link to="/builder">MCQ Builder</Link>,
                },
              ]}
            />
            <div style={contentContainerStyle}>
              {children}
            </div>
          </div>
        )}
      </Content>

      <Footer style={footerStyle}>
        University of Auckland | {new Date().getFullYear()} | Created by Team 11 (Cache Converters)
      </Footer>
    </Layout>
  );
};

export default MCQLayout;