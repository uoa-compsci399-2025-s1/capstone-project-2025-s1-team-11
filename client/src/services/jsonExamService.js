import Exam from "../models/Exam.js";

// Export an Exam instance to a JSON file and trigger a download
export function exportExamToJSON(exam, filename = "exam.json") {
    const jsonString = exam.toJSON();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import an Exam instance from a JSON file
export function importExamFromJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const jsonString = event.target.result;
            const exam = Exam.fromJSON(jsonString);
            callback(null, exam);
        } catch (error) {
            callback(error, null);
        }
    };
    reader.readAsText(file);
}