import * as React from 'react';
import DocxMerger from '../components/DocxMerger';

const DocxMergerPage: React.FC = () => {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">DOCX Merger Tool</h1>
            <DocxMerger />
        </div>
    );
};

export default DocxMergerPage;