import React from "react";
import homePageImage from "../assets/homePageImage.jpg";

const Home = () => {
    return (
        <div style={{ position: "relative", width: "100%", maxHeight: "600px", overflow: "hidden" }}>
            {/* Background Image */}
            <img 
                src={homePageImage} 
                alt="Home" 
                style={{ 
                    width: "100%", 
                    height: "600px", 
                    objectFit: "cover",
                    objectPosition: "center 90%",
                    display: "block" 
                }} 
            />

            {/* Overlay Text */}
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
    );
};

export default Home;
