import React from "react";
import homePageImage from "../assets/homePageImage.jpg";

const Home = () => {
    return (
        <div style={{ width: "100%" }}>
            <div style={{ position: "relative", width: "100%", height: "600px", overflow: "hidden" }}>
                <img 
                    src={homePageImage} 
                    alt="Home" 
                    style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover",
                        objectPosition: "center 90%",
                        display: "block" 
                    }} 
                />

                <div 
                    style={{
                        position: "absolute",
                        top: "25%", 
                        left: "5%", 
                        color: "black",
                        textAlign: "left"
                    }}
                >
                    <h1 style={{ margin: 0, fontSize: "3rem" }}>Home</h1>
                    <p style={{ marginTop: "1rem", fontSize: "1.25rem" }}>
                        Welcome to Assessly, by Cache Converters.
                    </p>
                </div>
            </div>

            <div style={{ 
                maxWidth: '1200px', 
                margin: '40px auto', 
                background: 'white', 
                border: '1px solid #d9d9d9',
                borderRadius: '8px', 
                padding: '32px', 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Assessly</h2>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Testing...
                </p>
            </div>
        </div>
    );
};

export default Home;
