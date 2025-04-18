import { NavLink } from "react-router";
import { Button, Space } from "antd";

export function Navigation() {
    return (
        <nav style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", paddingRight: "24px" }}>
                <Space>
                    <NavLink to="/" end>
                        <Button type="text" style={{ borderRadius: 0, color: "#fff", fontWeight: 500 }}>Home</Button>
                    </NavLink>
                    <NavLink to="/builder" end>
                        <Button type="text" style={{ borderRadius: 0, color: "#fff", fontWeight: 500 }}>MCQ Builder</Button>
                    </NavLink>
                    <NavLink to="/randomiser" end>
                        <Button type="text" style={{ borderRadius: 0, color: "#fff", fontWeight: 500 }}>MCQ Randomiser</Button>
                    </NavLink>
                    <NavLink to="/marker" end>
                        <Button type="text" style={{ borderRadius: 0, color: "#fff", fontWeight: 500 }}>MCQ Automarker</Button>
                    </NavLink>
                </Space>
                <NavLink to="/documentation" end>
                    <Button type="text" style={{ borderRadius: 0, backgroundColor: "#fff", fontWeight: 500 }}>Documentation</Button>
                </NavLink>
                <NavLink to="/console">Exam Console</NavLink>
            </div>
        </nav>
    );
}
