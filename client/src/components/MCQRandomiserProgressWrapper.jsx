// not in use, probs could be deleted

import React, { useState } from 'react';
import { Steps } from 'antd';
import { Card } from 'antd';
import { FileTextOutlined, InteractionOutlined, DownloadOutlined } from '@ant-design/icons';

const { Step } = Steps;

const steps = [
  {
    title: 'Exam File',
    key: 'upload',
    icon: <FileTextOutlined style={{width:"20px"}}/>,
    
  },
  {
    title: 'Shuffled Questions',
    key: 'randomise',
    icon: <InteractionOutlined style={{width:"20px"}} />
  },
  {
    title: 'Download Exams',
    key: 'download',
    icon: <DownloadOutlined style={{width:"20px"}} />
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
          <Step key={step.key} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Card>
        {children(currentStep)}
      </Card>
    </div>
  );
};

export default MCQRandomiserProgressWrapper;
