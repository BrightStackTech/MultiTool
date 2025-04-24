import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import FileUpload from '../components/FileUpload';
import { convertPdfToWord, convertWordToPdf } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import FileStorageNoticeDialog from '../components/FileStorageNoticeDialog';

enum ConversionType {
    PDF_TO_WORD = 'pdf-to-word',
    WORD_TO_PDF = 'word-to-pdf',
}

const PdfConverter: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [conversionType, setConversionType] = useState<ConversionType>(ConversionType.PDF_TO_WORD);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [conversionResult, setConversionResult] = useState<any>(null);
    const [showStorageDialog, setShowStorageDialog] = useState(false);

    // Check if user is logged in but has file storage disabled
    useEffect(() => {
        if (isAuthenticated && user && user.saveFilesToDashboard !== true) {
            setShowStorageDialog(true);
        }
    }, [isAuthenticated, user]);

    const handleConversionTypeChange = (type: ConversionType) => {
        setConversionType(type);
        setSelectedFile(null);
        setConversionResult(null);
    };

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setConversionResult(null);
    };

    const handleDownload = () => {
        if (!conversionResult) return;

        // Create a URL for the blob
        const url = URL.createObjectURL(conversionResult.blob);

        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        link.download = conversionResult.fileName;
        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        try {
            setLoading(true);

            if (conversionType === ConversionType.PDF_TO_WORD) {
                // Validate file type
                if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
                    toast.error('Please select a PDF file');
                    setLoading(false);
                    return;
                }

                const result = await convertPdfToWord(selectedFile);
                setConversionResult(result);
                toast.success('PDF converted to Word successfully!');
            } else if (conversionType === ConversionType.WORD_TO_PDF) {
                // Validate file type
                if (!selectedFile.name.toLowerCase().endsWith('.doc') && !selectedFile.name.toLowerCase().endsWith('.docx')) {
                    toast.error('Please select a Word document (.doc or .docx)');
                    setLoading(false);
                    return;
                }

                const result = await convertWordToPdf(selectedFile);
                setConversionResult(result);
                toast.success('Word document converted to PDF successfully!');
            }
        } catch (error) {
            console.error('Error converting file:', error);
            toast.error('Failed to convert file');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to determine file type label and accept attribute
    const getFileTypeInfo = () => {
        switch (conversionType) {
            case ConversionType.PDF_TO_WORD:
                return { label: 'PDF', accept: '.pdf' };
            case ConversionType.WORD_TO_PDF:
                return { label: 'Word', accept: '.doc,.docx' };
            default:
                return { label: 'File', accept: '' };
        }
    };

    const fileTypeInfo = getFileTypeInfo();

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">PDF Converter</h1>

            <Card title="Convert Documents">
                <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-700 mb-2 dark:text-white">Select Conversion Type</h3>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => handleConversionTypeChange(ConversionType.PDF_TO_WORD)}
                            className={`py-2 px-4 rounded-md font-medium ${conversionType === ConversionType.PDF_TO_WORD
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-900 text-gray-700 hover:bg-gray-300'
                                } transition`}
                        >
                            PDF to Word
                        </button>
                        <button
                            type="button"
                            onClick={() => handleConversionTypeChange(ConversionType.WORD_TO_PDF)}
                            className={`py-2 px-4 rounded-md font-medium ${conversionType === ConversionType.WORD_TO_PDF
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-900 text-gray-700 hover:bg-gray-300'
                                } transition`}
                        >
                            Word to PDF
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <FileUpload
                            onFileSelect={handleFileSelect}
                            accept={fileTypeInfo.accept}
                            label={`Select ${fileTypeInfo.label} File`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedFile || loading}
                        className={`w-full py-2 px-4 rounded-md text-black dark:text-white font-medium transition ${!selectedFile || loading
                            ? 'bg-red-200 dark:bg-red-800 cursor-not-allowed'
                            : 'bg-red-300 dark:bg-red-800 hover:bg-red-400 dark:hover:bg-red-700'
                            }`}
                    >
                        {loading ? 'Converting...' : 'Convert'}
                    </button>
                </form>

                {conversionResult && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <h3 className="text-md font-medium text-gray-700 mb-2 dark:text-gray-200">Conversion Complete!</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            <p>Your file has been converted successfully.</p>
                            <p>File: {conversionResult.fileName}</p>
                            <button
                                onClick={handleDownload}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                            >
                                Download
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* File Storage Notice Dialog */}
            <FileStorageNoticeDialog
                isOpen={showStorageDialog}
                onClose={() => setShowStorageDialog(false)}
            />
        </div>
    );
};

export default PdfConverter; 
