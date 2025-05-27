import React from 'react';
import { Layout, theme, Typography } from 'antd';
import { Navigation } from "./shared/navigation.jsx";
import { Link, useLocation } from 'react-router';
import logo from '../assets/AssesslyLogoSmall.png';
import StaticContextBar from './shared/StaticContextBar.jsx';
import ExamSidebarProvider from './shared/ExamSidebarProvider.jsx';

const { Header, Content, Footer } = Layout;
const { Paragraph } = Typography;

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

      <Content style={contentStyle}>
        
        {["/", "/builder", "/randomiser", "/marker", "/console"].includes(location.pathname) && (
          <div className="context-bar-wrapper" style={{padding: '0'}}>
            <StaticContextBar />
          </div>
        )}
        {isPlainPage ? (
          children
        ) : (
          <div style={{margin: '0 auto' }}>
            <div style={contentContainerStyle}>
              {["/builder", "/randomiser", "/marker", "/console"].includes(location.pathname) ? (
                <ExamSidebarProvider>
                  {children}
                </ExamSidebarProvider>
              ) : (
                children
              )}
            </div>
          </div>
        )}
      </Content>

      <Footer style={footerStyle}>
        <Paragraph style={{ textAlign: 'center', margin: 0 }}>
          University of Auckland | {new Date().getFullYear()} | Created by Team 11 (Cache Converters)
        </Paragraph>
      </Footer>
    </Layout>
  );
};

export default MCQLayout;