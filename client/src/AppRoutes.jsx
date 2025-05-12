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
import ExamMarkingPanel from './pages/examMarkingPanel'; 


export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<App />}>
                <Route path="/" element={<Home />} />
                <Route path="/builder" element={<Builder />} />
                <Route path="/randomiser" element={<Randomiser />} />
                <Route path="/marker" element={<Marker />} />
                <Route path="/about" element={<About />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/console" element={<ExamConsolePage />} />
            </Route>
        </Routes>
    );
}