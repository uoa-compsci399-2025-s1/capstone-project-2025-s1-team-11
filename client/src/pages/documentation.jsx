import { Layout, Typography, Divider, Anchor, Space } from "antd";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Link } = Anchor;

const DocumentationPage = () => {
  return (
    <Layout style={{ padding: "24px", backgroundColor: "#fff" }}>
      <Content style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title level={2}>Documentation</Title>
          <Anchor affix={false}>
            <Link href="#builder" title="MCQ Builder" />
            <Link href="#randomiser" title="MCQ Randomiser" />
            <Link href="#automarker" title="MCQ Automarker" />
          </Anchor>

          <Divider />

          <section id="builder">
            <Title level={3}>MCQ Builder</Title>
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
          </section>

          <Divider />

          <section id="randomiser">
            <Title level={3}>MCQ Randomiser</Title>
            <Paragraph>
              This module allows you to randomise question orders and answers to generate unique exam sets. Ideal for fairness and plagiarism prevention.
            </Paragraph>
            <Text strong>Features:</Text>
            <ul>
              <li>Randomise question order</li>
              <li>Shuffle multiple-choice answers</li>
              <li>Export formatted sets</li>
            </ul>
          </section>

          <Divider />

          <section id="automarker">
            <Title level={3}>MCQ Automarker</Title>
            <Paragraph>
              Upload completed exam files to automatically mark and analyse results. Results are presented in a clear summary with downloadable reports.
            </Paragraph>
            <Text strong>Features:</Text>
            <ul>
              <li>Upload response files</li>
              <li>Automatic grading</li>
              <li>Downloadable results</li>
            </ul>
          </section>
        </Space>
      </Content>
    </Layout>
  );
};

export default DocumentationPage;