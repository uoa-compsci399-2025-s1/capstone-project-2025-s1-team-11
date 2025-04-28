import { NavLink } from "react-router";
import { Button, Space } from "antd";

export function Navigation() {
    return (
        <nav style={{ width: "100%"}}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", paddingRight: "24px"}}>
                <Space style={{ margin: 0}}>
                    <NavLink to="/" end>
                        {({ isActive }) => (
                            <Button type={isActive ? "primary" : "text"} style={{ borderRadius: 0, fontWeight: 500, padding: "2.2em" }}>Home</Button>
                        )}
                    </NavLink>
                    <NavLink to="/builder" end>
                        {({ isActive }) => (
                            <Button type={isActive ? "primary" : "text"} style={{ borderRadius: 0, fontWeight: 500, padding: "2.2em" }}>MCQ Builder</Button>
                        )}
                    </NavLink>
                    <NavLink to="/randomiser" end>
                        {({ isActive }) => (
                            <Button type={isActive ? "primary" : "text"} style={{ borderRadius: 0, fontWeight: 500, padding: "2.2em" }}>MCQ Randomiser</Button>
                        )}
                    </NavLink>
                    <NavLink to="/marker" end>
                        {({ isActive }) => (
                            <Button type={isActive ? "primary" : "text"} style={{ borderRadius: 0, fontWeight: 500, padding: "2.2em" }}>MCQ Automarker</Button>
                        )}
                    </NavLink>
                    <NavLink to="/console" end>
                        <Button type="text" style={{ borderRadius: 0, color: "#fff", fontWeight: 500 }}>Test Console</Button>
                    </NavLink>
                </Space>
                <a href="/documentation" target="_blank" rel="noopener noreferrer">
                    <Button type="text" style={{ borderRadius: 0, backgroundColor: "#fff", fontWeight: 500 }}>Documentation</Button>
                </a>
            </div>
        </nav>
    );
}
