import React, { useEffect, useState } from 'react';
import { Alert } from 'antd';
import Users from './pages/Users';
import ExamPageFS from './pages/ExamPageFS';
import MCQLayout from './components/Layout';
import PopupWarning from './components/popupWarning';

const App = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const isChromium = !!window.chrome;
    if (!isChromium) {
      setShowWarning(true);
    }
  }, []);

  return (
    <MCQLayout>
      <PopupWarning visible={showWarning} onClose={() => setShowWarning(false)} />

      <h1>Assessly Prototype</h1>
      <Alert
        message="Warning"
        description="Assessly is in early development. Features may be incomplete and bugs are expected."
        type="warning"
        showIcon
        closable
      />
      <br />
      <ExamPageFS />
    </MCQLayout>
  );
};

export default App;
