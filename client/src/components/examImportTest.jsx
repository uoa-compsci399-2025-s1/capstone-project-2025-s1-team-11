import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import examImportService from '../services/examImportService';

// Assuming you have an action creator like this in your examSlice
import { importExam } from '../store/exam/examSlice';

const ExamImport = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState('docx'); // Default format
  const dispatch = useDispatch();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleFormatChange = (e) => {
    setFormat(e.target.value);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const examData = await examImportService.importExam(file, format);
      dispatch(importExam(examData));
      setFile(null);
      // You might want to show a success message or redirect
    } catch (err) {
      console.error('Error importing exam:', err);
      setError(`Failed to import exam: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="exam-import">
      <h2>Import Exam</h2>
      
      <div className="form-group">
        <label htmlFor="format-select">Select Format:</label>
        <select 
          id="format-select"
          value={format} 
          onChange={handleFormatChange}
          disabled={isLoading}
        >
          <option value="docx">Word Document (.docx)</option>
          <option value="xml" disabled>XML (Coming Soon)</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="file-input">Select Exam File:</label>
        <input
          id="file-input"
          type="file"
          accept={format === 'docx' ? '.docx' : '.xml'}
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        onClick={handleImport}
        disabled={!file || isLoading}
      >
        {isLoading ? 'Importing...' : 'Import Exam'}
      </button>
    </div>
  );
};

export default ExamImport;