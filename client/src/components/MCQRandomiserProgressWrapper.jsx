import React, { useState } from 'react';
import { Steps } from 'antd';
import { Card } from 'antd';

const { Step } = Steps;

const steps = [
  {
    title: 'Exam File',
    key: 'upload',
  },
  {
    title: 'Randomise',
    key: 'randomise',
  },
  {
    title: 'Export',
    key: 'export',
  },
];

const MCQRandomiserProgressWrapper = ({ children, onStageChange }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleChange = (stepIndex) => {
    setCurrentStep(stepIndex);
    if (onStageChange) {
      onStageChange(steps[stepIndex].key);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Steps
        type="navigation"
        size="default"
        current={currentStep}
        onChange={handleChange}
        style={{ marginBottom: '24px' }}
      >
        {steps.map((step, index) => (
          <Step key={step.key} title={step.title} />
        ))}
      </Steps>

      <Card>
        {children(currentStep)}
      </Card>
    </div>
  );
};

export default MCQRandomiserProgressWrapper;
