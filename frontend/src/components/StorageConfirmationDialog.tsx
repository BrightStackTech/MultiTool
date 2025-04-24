import React, { useState } from 'react';

interface StorageConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const StorageConfirmationDialog: React.FC<StorageConfirmationDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [isAgreed, setIsAgreed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isAgreed) {
      onConfirm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 mx-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Storage Costs Notice
          </h3>
          
          <div className="my-4 text-sm text-gray-600 dark:text-gray-300 space-y-3">
            <p>
              We've used AWS S3 bucket (3rd party) service for storing files. It costs money, so it's not a forever free service.
            </p>
            <p>
              <span className="font-medium">You'll be charged after your overall files storage exceeds 100 MB.</span>
            </p>
            <p>
              You'll be charged $0.2/month for each 100 MBs (includes your initial 100MBs also).
            </p>
            <p>
              You can always delete unnecessary files from your dashboard to avoid reaching the 100 MBs mark.
            </p>
          </div>
          
          <div className="mt-4 mb-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                I agree and understand that I may be charged if my storage exceeds 100 MB. I acknowledge that I can delete files to manage my storage.
              </span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white hover:bg-gray-100 dark:bg-gray-500 dark:hover:bg-gray-700 focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isAgreed}
              className={`px-4 py-2 text-white rounded-md focus:outline-none ${
                isAgreed 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-green-400 cursor-not-allowed'
              }`}
            >
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageConfirmationDialog; 