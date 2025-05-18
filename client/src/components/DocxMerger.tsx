import React, { useState } from 'react';
import { mergeDocxFiles } from '../utilities/docxMerger';

const DocxMerger: React.FC = () => {
  const [coverPageFile, setCoverPageFile] = useState<File | null>(null);
  const [bodyFile, setBodyFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMerge = async () => {
    if (!coverPageFile || !bodyFile) {
      setError('Please select both files');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const mergedBlob = await mergeDocxFiles(coverPageFile, bodyFile);
      
      // Create download link
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged_document.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while merging files');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">DOCX Merger</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Page Document
        </label>
        <input
          type="file"
          accept=".docx"
          onChange={(e) => setCoverPageFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Body Document
        </label>
        <input
          type="file"
          accept=".docx"
          onChange={(e) => setBodyFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={handleMerge}
        disabled={isLoading || !coverPageFile || !bodyFile}
        className={`w-full py-2 px-4 rounded-md text-white font-medium
          ${isLoading || !coverPageFile || !bodyFile
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isLoading ? 'Merging...' : 'Merge Documents'}
      </button>
    </div>
  );
};

export default DocxMerger; 