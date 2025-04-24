import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <MoonIcon className="h-5 w-5 text-white" />
            ) : (
                <SunIcon className="h-5 w-5 text-yellow-300" />
            )}
        </button>
    );
};

export default ThemeToggle; 