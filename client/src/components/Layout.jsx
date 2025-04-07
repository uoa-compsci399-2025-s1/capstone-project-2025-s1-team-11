import React from 'react';
import { Layout, Menu, Breadcrumb, theme } from 'antd';

const { Header, Content, Footer } = Layout;

const MCQLayout = ({ children }) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const items = [
    { key: '1', label: 'Home' },
    { key: '2', label: 'MCQ Builder' },
    { key: '3', label: 'MCQ Randomiser' },
    { key: '4', label: 'Automarker' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', flexDirection: 'column' }}>
            <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        {/* update logo */}
        <div className="logo" style={{ marginRight: '24px' }} />
        {/* default key 2 = mcq creator tab */}
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']} items={items} style={{ flex: 1, minWidth: 0 }} />
      </Header>
      <Content style={{ padding: '32px 48px', flex: 1 }}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        <Breadcrumb style={{ marginBottom: '24px' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>MCQ Builder</Breadcrumb.Item>
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
      </Content>
      <Footer style={{ textAlign: 'center', padding: '16px 24px' }}>
        University of Auckland | {new Date().getFullYear()} | Created by Team 11 (Cache Converters)
      </Footer>
    </Layout>
  );
};

export default MCQLayout;