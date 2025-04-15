import React from 'react';
import { Layout, Breadcrumb, theme } from 'antd';
import { Navigation } from "./navigation.jsx";
import { Link, useLocation } from 'react-router';
import logo from "../../public/AssesslyLogoSmall.png";

const { Header, Content, Footer } = Layout;
const isPlainPage = location.pathname === "/" || location.pathname === "/documentation";

const MCQLayout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', flexDirection: 'column' }}>
      <Header
        style={{
          backgroundColor: "#ffffff",
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px'
        }}
      >
        <img src={logo} alt="Assessly Logo" style={{ height: "40px", marginRight: "24px" }} />
        <Navigation />
      </Header>

      <Content style={{ padding: '32px 48px', flex: 1 }}>
        {
          isPlainPage ? (
            children
          ) : (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <Breadcrumb style={{ marginBottom: '24px' }}>
                <Breadcrumb.Item>
                  <Link to="/">Home</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                  <Link to="/builder">MCQ Builder</Link>
                </Breadcrumb.Item>
              </Breadcrumb>
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

      <Footer style={{ textAlign: 'center', padding: '16px 24px' }}>
        University of Auckland | {new Date().getFullYear()} | Created by Team 11 (Cache Converters)
      </Footer>
    </Layout>
  );
};

export default MCQLayout;
