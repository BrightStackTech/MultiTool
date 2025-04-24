import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import FileUpload from '../components/FileUpload';
import { convertImageToPdf } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import FileStorageNoticeDialog from '../components/FileStorageNoticeDialog';

const ImageToPdf: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [conversionResult, setConversionResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showStorageDialog, setShowStorageDialog] = useState(false);

    // Check if user is logged in but has file storage disabled
    useEffect(() => {
        if (isAuthenticated && user && user.saveFilesToDashboard !== true) {
            setShowStorageDialog(true);
        }
    }, [isAuthenticated, user]);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setConversionResult(null);
        setError(null);
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
            toast.error('Please select an image');
            return;
        }

        // Validate file type
        if (!selectedFile.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        setError(null);
        try {
            setLoading(true);
            const result = await convertImageToPdf(selectedFile);
            setConversionResult(result);
            toast.success('Image converted to PDF successfully!');
        } catch (error: any) {
            console.error('Error converting image to PDF:', error);
            setError(getErrorMessage(error));

            if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                toast.error('Network error. Please check your connection and try again.');
            } else if (error.response) {
                // Server responded with an error
                const status = error.response.status;
                if (status === 400) {
                    toast.error('Invalid image format or corrupted image file');
                } else if (status === 413) {
                    toast.error('Image file is too large');
                } else {
                    toast.error(`Server error (${status}). Please try again later.`);
                }
            } else {
                toast.error('Failed to convert image to PDF. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = (error: any): string => {
        if (error.response && error.response.data && error.response.data.error) {
            return error.response.data.error;
        } else if (error.message) {
            return error.message;
        } else {
            return 'Unknown error occurred';
        }
    };

    const handleRetry = () => {
        if (selectedFile) {
            handleSubmit(new Event('submit') as any);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">Image to PDF</h1>

            <Card title="Convert Image to PDF">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <FileUpload
                            onFileSelect={handleFileSelect}
                            accept="image/*"
                            label="Select Image"
                        />
                        {selectedFile && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedFile || loading}
                        className={`w-full py-2 px-4 rounded-md text-black dark:text-white font-medium transition ${!selectedFile || loading
                            ? 'bg-green-200 dark:bg-green-800 cursor-not-allowed'
                            : 'bg-green-300 dark:bg-green-800 hover:bg-green-400 dark:hover:bg-green-700'
                            }`}
                    >
                        {loading ? 'Converting...' : 'Convert to PDF'}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 rounded-md border border-red-200">
                        <h3 className="text-md font-medium text-red-700 mb-2">Error:</h3>
                        <p className="text-sm text-red-600 mb-3">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {conversionResult && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <h3 className="text-md font-medium text-gray-700 mb-2 dark:text-gray-200">Conversion Complete!</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            <p>Your image has been converted to PDF.</p>
                            <p>File: {conversionResult.fileName}</p>
                            <button
                                onClick={handleDownload}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                            >
                                Download PDF
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

export default ImageToPdf; 
