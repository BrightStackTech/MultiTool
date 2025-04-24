import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FileStorageNoticeDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const FileStorageNoticeDialog: React.FC<FileStorageNoticeDialogProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleGoDashboard = () => {
        navigate('/dashboard');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        File Storage Not Enabled
                    </h3>

                    <div className="my-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <p>
                            Your files won't be saved to your dashboard unless file storage is enabled.
                        </p>
                        <p>
                            You can still use this tool, but your processed files won't be available in your dashboard for later access.
                        </p>
                        <p>
                            Navigate to your dashboard's Files section to enable file storage.
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white hover:bg-gray-100 dark:bg-gray-500 dark:hover:bg-gray-700 focus:outline-none"
                        >
                            Continue Anyway
                        </button>
                        <button
                            onClick={handleGoDashboard}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileStorageNoticeDialog; 