import { Layout, Typography, Divider, Anchor, Space, Card, Row, Col } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Link } = Anchor;

const DocumentationPage = () => {
  return (
    <Layout style={{ padding: "24px", backgroundColor: "#f5f5f5" }}>
      <Content style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: "40px" }}>
            Documentation
          </Title>
          
          <Card style={{ marginBottom: "24px" }}>
            <Anchor affix={false}>
              <Link href="#builder" title="MCQ Builder" />
              <Link href="#randomiser" title="MCQ Randomiser" />
              <Link href="#automarker" title="MCQ Automarker" />
            </Anchor>
          </Card>

          <section id="builder">
            <Card>
              <Title level={3}>
                <PlayCircleOutlined style={{ marginRight: "8px" }} />
                MCQ Builder
              </Title>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Paragraph>
                    The Builder tool lets you create multiple choice questions manually or through templates. It supports question metadata, correct answer selection, and markdown formatting.
                  </Paragraph>
                  <Text strong>Features:</Text>
                  <ul>
                    <li>Create and edit MCQs</li>
                    <li>Organize questions into sets</li>
                    <li>Save/export questions for later use</li>
                  </ul>
                  <Paragraph>
                    For detailed formatting requirements when preparing DOCX input files, refer to the{" "}
                    <a href="/docs/DOCX_Input_Formatting_Criteria.pdf" target="_blank" rel="noopener noreferrer">
                      DOCX Input Formatting Criteria (PDF)
                    </a>.
                  </Paragraph>
                </Col>
                <Col xs={24} lg={12}>
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
                    <iframe
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      src="https://www.youtube.com/embed/Nlp9NNEnQdw"
                      title="MCQ Builder Demo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </section>

          <section id="randomiser">
            <Card>
              <Title level={3}>
                <PlayCircleOutlined style={{ marginRight: "8px" }} />
                MCQ Randomiser
              </Title>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Paragraph>
                    This module allows you to randomise question orders and answers to generate unique exam sets. Ideal for fairness and plagiarism prevention.
                  </Paragraph>
                  <Text strong>Features:</Text>
                  <ul>
                    <li>Randomise question order</li>
                    <li>Shuffle multiple-choice answers</li>
                    <li>Export formatted sets</li>
                  </ul>
                </Col>
                <Col xs={24} lg={12}>
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
                    <iframe
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      src="https://www.youtube.com/embed/OqR4HH2vnC0"
                      title="MCQ Randomiser Demo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </section>

          <section id="automarker">
            <Card>
              <Title level={3}>
                <PlayCircleOutlined style={{ marginRight: "8px" }} />
                MCQ Automarker
              </Title>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Paragraph>
                    Upload completed exam files to automatically mark and analyse results. Results are presented in a clear summary with downloadable reports.
                  </Paragraph>
                  <Text strong>Features:</Text>
                  <ul>
                    <li>Upload response files</li>
                    <li>Automatic grading</li>
                    <li>Downloadable results</li>
                  </ul>
                </Col>
                <Col xs={24} lg={12}>
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
                    <iframe
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      src="https://www.youtube.com/embed/CbVYm2l2CRw"
                      title="MCQ Automarker Demo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </section>
        </Space>
      </Content>
    </Layout>
  );
};

export default DocumentationPage;