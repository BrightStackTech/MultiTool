import React from 'react';

interface CardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', icon }) => {
    return (
        <div className={`w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6 border border-gray-100 dark:border-gray-700 transition ${className}`}>
            <div className="flex items-center mb-4">
                {icon && <div className="mr-3 text-purple-500 dark:text-purple-400">{icon}</div>}
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
                {children}
            </div>
        </div>
    );
};

export default Card; 