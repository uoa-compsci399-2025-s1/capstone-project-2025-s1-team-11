// src/pages/ExamImporter.jsx
import React, { useState } from "react";
import { importExamFromXMLtoJSON } from "../services/xmlToJsonExamImporter.js";
import { exportExamToJSON } from "../services/jsonExamService.js";

const ExamImporter = ({ onExamImported }) => {
    const [error, setError] = useState(null);

    const handleXMLImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            importExamFromXMLtoJSON(file, (err, importedExam) => {
                if (err) {
                    setError("Failed to import exam: " + err.message);
                } else {
                    setError(null);
                    // Automatically trigger JSON download after successful import.
                    exportExamToJSON(importedExam, "ConvertedExam.json");
                    // Optionally, update the unified exam state in the parent.
                    onExamImported(importedExam);
                }
            });
        }
    };

    return (
        <div>
            <h2>Import Exam from XML</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <input type="file" accept=".xml" onChange={handleXMLImport} />
        </div>
    );
};

export default ExamImporter;