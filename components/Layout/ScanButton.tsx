import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ScanButtonProps {
    onClick: () => void;
}

export const ScanButton: React.FC<ScanButtonProps> = ({ onClick }) => {
    const { currentTheme } = useTheme();

    return (
        <button
            onClick={onClick}
            className={`fixed bottom-28 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full flex items-center justify-center z-30 active:scale-75 transition-all hover:scale-110 shadow-xl ${currentTheme.colors.accent}`}
        >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" strokeWidth={2} />
            </svg>
        </button>
    );
};
