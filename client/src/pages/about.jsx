import React from "react";
import { Typography } from "antd";
const { Title, Paragraph, Text } = Typography;
import aboutPageImage from "../assets/aboutPageImage.jpg";

const About = () => {
    return (
        <div>
            <div style={{ width: "100%" }}>
                <div style={{ position: "relative", width: "100%", height: "600px", overflow: "hidden" }}>
                    <img 
                        src={aboutPageImage} 
                        alt="About" 
                        style={{ 
                            width: "100%", 
                            height: "100%", 
                            objectFit: "cover",
                            objectPosition: "center 90%",
                            display: "block", 
                            zIndex: 0
                        }} 
                    />
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: "30%", 
                        backgroundColor: "white",
                        opacity: 0.8, 
                        zIndex: 1
                    }}
                />
                    <div 
                        style={{
                            position: "absolute",
                            top: "60%", 
                            left: "5%", 
                            color: "black",
                            textAlign: "left",
                            zIndex: 2
                        }}
                    >
                        <h1 style={{ margin: 0, fontSize: "3rem" }}>About Assessly</h1>
                        <p style={{ marginTop: "1.2rem", fontSize: "1.25rem" }}>
                            Temp About Page
                        </p>
                    </div>
                </div>
    
                <div style={{ 
                    maxWidth: '1500px', 
                    margin: '40px auto', 
                    background: 'white', 
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px', 
                    padding: '32px', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>About</h2>
                    <Paragraph>
                        Our team, Cache Converters, has developed Assessly as a lightweight, streamlined, user-friendly web application platform designed to create an efficient process for creating, marking, and analysing multiple-choice question (MCQ) examination papers.
                        The idea behind Assessly was born from challenges faced by academic staff at the University of Auckland, and the development of this project was designed with accessibility and ease of use in mind, especially for those without technical backgrounds.
                        Through this application, staff can spend less time on tedious formatting and manual workflow instead of leaving more time for teaching and improving assessment quality.
                    </Paragraph>
                    <Paragraph>
                        The central vision of Assessly is to simplify and enhance the entire lifecycle of MCQ-style examinations. 
                        The process begins with generating and building multiple randomised versions of a singular exam, part of standard practice to improve fairness and as a preventative measure for cheating. 
                        From that point, Assessly can accept scanned teleform data for an automatic marking process, providing detailed statistical reports and insights for analysis, thereby ensuring the creation and evaluation of exams are dependable and standardised. 
                        With real user stories in mind, one of the key goals for Assessly is to ensure that it is easy for all staff, regardless of technical expertise, and that lecturers across all faculties can generate compliant and high-quality MCQ exams. 
                        Previously, this process was highly time-consuming, error-prone, and reliant on a few staff members within our Computer Science department. 
                        Still, by removing this bottleneck, our tool creates accessibility with a wide range of flexible options to support any needs.
                    </Paragraph>
                    <Paragraph>
                        We hope this tool can improve the process of generating, distributing, and assessing exams consolidated into a single lightweight and intuitive platform, improving the academic experience for educators. 
                    </Paragraph>
                    <div style={{ marginTop: "2rem" }}>
                        <Paragraph style={{ fontSize: "1.25rem" }}>
                            <Text strong>Unique Features:</Text>
                        </Paragraph>
                        <ul style={{ paddingLeft: "1.5rem", fontSize: "1rem" }}>
                            <li style={{ marginBottom: "1rem" }}>   
                                <Text strong>Format Flexibility:</Text> Wide range of supported sources, including DOCX, LaTeX, and XML, allowing for compatibility with platforms such as Inspera, Moodle CodeRunner, Canvas, and more.
                            </li>
                            <li style={{ marginBottom: "1rem" }}>
                                <Text strong>Versioning Aptitude:</Text> Efficient shuffling of MCQs with a consistent answer key generation process.
                            </li>
                            <li style={{ marginBottom: "1rem" }}>
                                <Text strong>Clear Visual Feedback:</Text> Clean and straightforward previews, table views, and tabular modules for clarity.
                            </li>
                            <li style={{ marginBottom: "1rem" }}>
                                <Text strong>Marking Automation and Analysis:</Text> Fast processing of results with updatable marking rubrics. Built-in tools can generate insights into class performance and outcomes.
                            </li>
                            <li style={{ marginBottom: "1rem" }}>
                                <Text strong>Security:</Text> Local data hosting provides privacy and secure handling of files.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>            
        </div>
    );
};

export default About;
