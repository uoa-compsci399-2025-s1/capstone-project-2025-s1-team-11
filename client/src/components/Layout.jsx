import React from 'react';
import { Layout, Breadcrumb, theme } from 'antd';
import { Navigation } from "./navigation.jsx";
import { Link, useLocation } from 'react-router';
import logo from "../../public/AssesslyLogoSmall.png";
import StaticContextBar from './StaticContextBar';

const { Header, Content, Footer } = Layout;

const MCQLayout = ({ children }) => {
  const location = useLocation();
  const isPlainPage = ["/", "/about"].includes(location.pathname); // Borderless pages

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', flexDirection: 'column' }}>
      <Header
        style={{
          backgroundColor: "#ffffff",
          display: 'flex',
          flexDirection: 'column',
          padding: '0 24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <img src={logo} alt="Assessly Logo" style={{ height: "40px", marginRight: "24px" }} />
          <Navigation />
        </div>
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

      <Footer style={{ textAlign: 'center', padding: '16px 24px' }}>
        University of Auckland | {new Date().getFullYear()} | Created by Team 11 (Cache Converters)
      </Footer>
    </Layout>
  );
};

export default MCQLayout;
