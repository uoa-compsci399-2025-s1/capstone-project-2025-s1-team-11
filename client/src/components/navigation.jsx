import { NavLink } from "react-router";

export function Navigation() {
    return (
        <nav>
            <NavLink to="/" end>Home | </NavLink>
            <NavLink to="/builder" end>MCQ Builder | </NavLink>
            <NavLink to="/randomizer" end>MCQ Randomizer | </NavLink>
            <NavLink to="/marker" end>MCQ Automarker</NavLink>

        </nav>
    );
}
