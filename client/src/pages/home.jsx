// src/pages/ExamFileManager.jsx
import React from "react";
import homePageImage from "../assets/homePageImage.jpg";

const Home = () => {
    return (
        <div style={{ width: "100%" }}>
            <div style={{
                position: "relative", 
                width: "100%", 
                height: "100vh", 
                overflow: "hidden"
            }}>
                <img 
                    src={homePageImage} 
                    alt="Home" 
                    style={{ 
                        width: "100%", 
                        height: "97%", 
                        objectFit: "cover", 
                        objectPosition: "center center", 
                        display: "block"
                    }} 
                />
                <div 
                    style={{
                        position: "absolute",
                        bottom: "0",
                        left: "0",
                        width: "100%",
                        height: "20%", 
                        background: "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 100%)", 
                        zIndex: 1
                    }}
                />
                <div 
                    style={{
                        position: "absolute",
                        top: "25%", 
                        left: "5%", 
                        color: "black", 
                        textAlign: "left",
                        zIndex: 2
                    }}
                >
                    <h1 style={{ margin: 0, fontSize: "3rem" }}>Welcome to Assessly, by Cache Converters.</h1>
                    <p style={{ marginTop: "1rem", fontSize: "1.2rem" }}>
                        Simplify Exam Creation, Marking, and Analysis - All on One Platform.
                    </p>
                </div>
                <div 
                    className="arrow"
                    style={{
                        position: "absolute", 
                        bottom: "75px", 
                        left: "50%", 
                        transform: "translateX(-50%)", 
                        fontSize: "3rem",
                        color: "black",
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        borderRadius: "50%",
                        width: "60px",
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        cursor: "pointer",
                        zIndex: 3
                    }}
                    onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                >
                    &#8595; 
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', maxWidth: '1500px', margin: '5px auto', padding: '3px' }}>
                <div style={{ width: '50%', padding: '32px', borderRadius: '8px' }}>
                    <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        Assessly
                    </h2>
                    <p style={{ fontSize: '1.5rem', lineHeight: 1.6 }}>
                        Assessly is designed to help educators and staff streamline the process of working with multiple-choice examinations.
                        This entails generating randomised exam papers, auto-marking multiple-choice questions, efficiently analysing performance data and ensuring assessment integrity. 
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;
