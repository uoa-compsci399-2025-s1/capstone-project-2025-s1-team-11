// src/components/MarkerProgressWrapper.jsx

import React, { useState } from "react";
import { Steps, Button, Divider, Space } from "antd";

const steps = [
  {
    title: "Upload",
  },
  {
    title: "Validation",
  },
  {
    title: "View Results",
  },
];

const MarkerProgressWrapper = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <>
      <Steps current={currentStep} progressDot items={steps} />
      <Divider />
      <div style={{ margin: "24px 0" }}>{children(currentStep)}</div>
      <Divider />
      <Space>
        <Button onClick={prev} disabled={currentStep === 0}>
          Back
        </Button>
        <Button type="primary" onClick={next} disabled={currentStep === steps.length - 1}>
          Next
        </Button>
      </Space>
    </>
  );
};

export default MarkerProgressWrapper;
