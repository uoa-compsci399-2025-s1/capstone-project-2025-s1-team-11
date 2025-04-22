import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes.jsx';
import { ExamProvider } from './context/examContext.jsx';
import './index.css';
import { Provider } from "react-redux";
import { store } from "./store/store";

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
  <ExamProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
    </ExamProvider>
    </Provider>
);