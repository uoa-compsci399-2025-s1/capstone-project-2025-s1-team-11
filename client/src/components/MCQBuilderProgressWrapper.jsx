import React, { useState } from 'react';
import { Steps } from 'antd';
import { Card } from 'antd';
import { FileWordOutlined, DownloadOutlined, OrderedListOutlined} from '@ant-design/icons';

const { Step } = Steps;

const steps = [
  {
    title: 'Cover Page',
    key: 'cover',
    icon: <FileWordOutlined style={{width:"20px"}}/>,
  },
  {
    title: 'Exam Questions',
    key: 'questions',
    icon: <OrderedListOutlined style={{width:"20px"}} />,
  },
  {
    title: 'Download Exam',
    key: 'download',
    icon: <DownloadOutlined style={{width:"20px"}} />
  },
];

const MCQBuilderProgressWrapper = ({ children, onStageChange }) => {
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
          <Step key={step.key} title={step.title} description={step.description} icon={step.icon} />
        ))}
      </Steps>

      <Card>
        {children(currentStep)}
      </Card>
    </div>
  );
};

export default MCQBuilderProgressWrapper;
