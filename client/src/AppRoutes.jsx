// routes.jsx
import { Routes, Route } from "react-router";
import App from './App.jsx';
import Home from "./pages/home.jsx";
import Builder from "./pages/builder.jsx";
import Marker from "./pages/marker.jsx";
import Randomiser from "./pages/randomiser.jsx";
import About from "./pages/about.jsx";
import Documentation from "./pages/documentation.jsx";
import ExamConsolePage from './pages/examConsole';
import DocxMergerPage from './pages/DocxMergerPage';

export default function AppRoutes({ isDarkMode, toggleTheme }) {
    return (
        <Routes>
            <Route element={<App isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}>
                <Route path="/" element={<Home />} />
                <Route path="/builder" element={<Builder />} />
                <Route path="/randomiser" element={<Randomiser />} />
                <Route path="/marker" element={<Marker />} />
                <Route path="/about" element={<About />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/console" element={<ExamConsolePage />} />
                <Route path="/docx-merger" element={<DocxMergerPage />} />
            </Route>
        </Routes>
    );
}