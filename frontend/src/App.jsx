import React from 'react';
import { Alert } from 'antd';
import Users from './pages/Users';
import ExamPageFS from './pages/ExamPageFS';
import MCQLayout from './components/Layout';

const App = () => {
    return (
        <MCQLayout>
            <h1>Assessly Prototype</h1>
            <Alert
            message="Warning"
            description="wow! look at this error message"
            type="warning"
            showIcon
            closable
            />
            <br></br>
            <ExamPageFS />
        </MCQLayout>
    );
};

export default App;