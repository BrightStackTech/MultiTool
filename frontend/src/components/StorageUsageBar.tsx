import React from 'react';

interface StorageUsageBarProps {
    usedStorage: number; // in bytes
    maxStorage: number; // in bytes
}

const StorageUsageBar: React.FC<StorageUsageBarProps> = ({ usedStorage, maxStorage }) => {
    // Convert bytes to MB for display
    const usedMB = (usedStorage / (1024 * 1024)).toFixed(2);
    const maxMB = maxStorage / (1024 * 1024);

    // Calculate percentage
    const percentage = Math.min((usedStorage / maxStorage) * 100, 100);

    // Determine color based on usage
    let barColor = '';
    if (percentage < 60) {
        barColor = 'bg-green-500';
    } else if (percentage < 80) {
        barColor = 'bg-yellow-500';
    } else {
        barColor = 'bg-red-500';
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Your stored files
                </span>
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {usedMB} MB of {maxMB} MB
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                    className={`${barColor} h-2.5 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            {percentage >= 90 && (
                <p className="mt-1 text-xs text-red-500">
                    Your storage is almost full! Consider deleting some files or upgrading your plan.
                </p>
            )}
        </div>
    );
};

export default StorageUsageBar; 