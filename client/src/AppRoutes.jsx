// routes.jsx
import { Routes, Route } from "react-router";
import App from './App.jsx';
import Home from "./pages/home.jsx";
import Builder from "./pages/builder.jsx";
import Marker from "./pages/marker.jsx";
import Randomizer from "./pages/randomizer.jsx";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<App />}>
                <Route path="/" element={<Home />} />
                <Route path="/builder" element={<Builder />} />
                <Route path="/randomizer" element={<Randomizer />} />
                <Route path="/marker" element={<Marker />} />
            </Route>
        </Routes>
    );
}