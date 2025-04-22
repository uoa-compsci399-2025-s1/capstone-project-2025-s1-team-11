import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes.jsx';
import { ExamProvider } from './context/examContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <ExamProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </ExamProvider>
);