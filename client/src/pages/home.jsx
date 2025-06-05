// src/pages/ExamFileManager.jsx
import React, { useState, useEffect, useRef } from "react";
import { Typography, Button } from "antd";
import { useNavigate } from "react-router";
const { Paragraph } = Typography;
import builderVideo from "../assets/builder.mov";
import randomiserVideo from "../assets/randomiser.mov";
import markerVideo from "../assets/marker.mov";
import resultsVideo from "../assets/results.mov";
import "./home.css";

const Home = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const videoRefs = useRef([]);
    
    const slides = [
        {
            title: "MCQ Builder",
            subtitle: "Import & Edit with Ease",
            description: "Upload existing exams or create new questions from scratch.",
            media: builderVideo,
            isVideo: true
        },
        {
            title: "Smart Randomiser", 
            subtitle: "Generate Multiple Versions",
            description: "Create randomized versions to ensure exam integrity.",
            media: randomiserVideo,
            isVideo: true
        },
        {
            title: "Auto-Marker",
            subtitle: "Instant Grading", 
            description: "Upload completed exams and get immediate results.",
            media: markerVideo,
            isVideo: true
        },
        {
            title: "Results Analytics",
            subtitle: "Performance Insights",
            description: "View detailed statistics to improve your teaching.",
            media: resultsVideo,
            isVideo: true
        }
    ];

    // Auto-slide every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        
        return () => clearInterval(interval);
    }, [slides.length]);

    // Reset video when slide changes
    useEffect(() => {
        videoRefs.current.forEach((video, index) => {
            if (video) {
                if (index === currentSlide) {
                    // Reset and play the active video
                    video.currentTime = 0;
                    video.play().catch(e => console.log('Video play failed:', e));
                } else {
                    // Pause other videos
                    video.pause();
                }
            }
        });
    }, [currentSlide]);

    const handleStartCreating = () => {
        navigate('/builder');
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    return (
        <div className="home-container">
            {/* Particle Background */}
            <div className="particles-container">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className={`particle particle-${i % 5}`}>
                        {['📝', '✏️', '❌', '✔️', '📄'][i % 5]}
                    </div>
                ))}
            </div>

            {/* Hero Section */}
            <div className="hero-section">
                {/* Welcome Header */}
                <div className="welcome-header">
                    <h1 className="main-title">Welcome to Assessly</h1>
                    <Paragraph className="main-subtitle">
                        Simplify Exam Creation, Marking, and Analysis – All on One Platform
                    </Paragraph>
                </div>

                {/* Hero Carousel */}
                <div className="hero-carousel">
                    <div className="carousel-container">
                        {slides.map((slide, index) => (
                            <div 
                                key={index}
                                className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                            >
                                <div className="slide-content">
                                    <div className="slide-text">
                                        <h2 className="slide-title">{slide.title}</h2>
                                        <h3 className="slide-subtitle">{slide.subtitle}</h3>
                                        <Paragraph className="slide-description">
                                            {slide.description}
                                        </Paragraph>
                                    </div>
                                    <div className="slide-media">
                                        {slide.isVideo ? (
                                            <video 
                                                ref={el => videoRefs.current[index] = el}
                                                src={slide.media} 
                                                alt={slide.title}
                                                className="slide-video"
                                                loop
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : (
                                            <img 
                                                src={slide.media} 
                                                alt={slide.title}
                                                className="slide-image"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Carousel Indicators */}
                    <div className="carousel-indicators">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => goToSlide(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* Main CTA Button */}
                <div className="cta-container">
                    <Button 
                        type="primary" 
                        size="large"
                        className="main-cta-button"
                        onClick={handleStartCreating}
                    >
                        <span className="cta-icon">📝</span>
                        Start Creating Your Exam
                        <span className="cta-arrow">→</span>
                    </Button>
                </div>

                {/* Scroll Down Arrow */}
                <div 
                    className="scroll-arrow"
                    onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                >
                    &#8595;
                </div>
            </div>

            {/* About Section */}
            <div className="about-section">
                <div className="about-content">
                    <h2 className="about-title">How Assessly Works</h2>
                    <p className="about-description">
                        Assessly is designed to help educators and staff streamline the process of working with multiple-choice examinations.
                        Generate randomised exam papers, auto-mark questions, and efficiently analyse performance data – all on one platform.
                    </p>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📝</div>
                            <h3>Build</h3>
                            <p>Create and import MCQ exams</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔀</div>
                            <h3>Randomize</h3>
                            <p>Generate multiple versions</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">✅</div>
                            <h3>Mark</h3>
                            <p>Auto-grade with analysis</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Analyze</h3>
                            <p>View detailed insights</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
