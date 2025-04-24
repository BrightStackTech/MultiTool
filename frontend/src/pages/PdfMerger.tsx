import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import { mergePdfs } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import FileStorageNoticeDialog from '../components/FileStorageNoticeDialog';

const PdfMerger: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [showStorageDialog, setShowStorageDialog] = useState(false);

    // Check if user is logged in but has file storage disabled
    useEffect(() => {
        if (isAuthenticated && user && user.saveFilesToDashboard === false) {
            setShowStorageDialog(true);
        }
    }, [isAuthenticated, user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileArray = Array.from(e.target.files);

            // Validate file types
            const invalidFiles = fileArray.filter(file => !file.name.toLowerCase().endsWith('.pdf'));
            if (invalidFiles.length > 0) {
                toast.error('Please select only PDF files');
                return;
            }

            setFiles(prevFiles => [...prevFiles, ...fileArray]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            toast.error('Please select at least two PDF files');
            return;
        }

        try {
            setLoading(true);
            const mergedPdfResponse = await mergePdfs(files);
            const mergedPdfBlob = mergedPdfResponse.blob || mergedPdfResponse;

            // Create a download link
            const url = URL.createObjectURL(mergedPdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'merged.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('PDFs merged successfully!');
        } catch (error) {
            console.error('Error merging PDFs:', error);
            toast.error('Failed to merge PDFs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">PDF Merger</h1>

            <Card title="Merge Multiple PDFs into One">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select PDF Files
                    </label>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                        <input
                            type="file"
                            id="pdf-files"
                            accept=".pdf"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="pdf-files" className="cursor-pointer">
                            <div className="flex flex-col items-center justify-center">
                                <svg
                                    className="w-12 h-12 text-gray-400 mb-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    ></path>
                                </svg>
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to select PDFs</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    Select multiple PDF files to merge
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-700 mb-2">Selected Files ({files.length})</h3>
                        <ul className="max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y">
                            {files.map((file, index) => (
                                <li key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center">
                                        <svg
                                            className="w-6 h-6 text-red-500 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            ></path>
                                        </svg>
                                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                                    </div>
                                    <button
                                        title='Remove File'
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="text-gray-500 hover:text-red-500 bg-transparent rounded-md p-1 transition-colors"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            ></path>
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleMerge}
                    disabled={files.length < 2 || loading}
                    className={`w-full py-2 px-4 rounded-md text-black dark:text-white font-medium transition ${files.length < 2 || loading
                        ? 'bg-orange-200 dark:bg-orange-800 cursor-not-allowed'
                        : 'bg-orange-300 dark:bg-orange-800 hover:bg-orange-400 dark:hover:bg-orange-700'
                        }`}
                >
                    {loading ? 'Merging...' : 'Merge PDFs'}
                </button>
            </Card>

            {/* File Storage Notice Dialog */}
            <FileStorageNoticeDialog
                isOpen={showStorageDialog}
                onClose={() => setShowStorageDialog(false)}
            />
        </div>
    );
};

export default PdfMerger; 