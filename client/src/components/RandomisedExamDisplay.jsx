import { Typography} from "antd";

const RandomisedExamDisplay = () => {

  return (
    <div>
      {/* header for context */}
      <Typography.Title level={3}>Randomised Exam Versions</Typography.Title>
      <Typography.Paragraph type="secondary">
        Below are the four randomised versions generated from your uploaded question. Each version shuffles the answer options while keeping the question consistent.
      </Typography.Paragraph>

      
    </div>
  );
};

export default RandomisedExamDisplay;
