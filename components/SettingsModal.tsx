import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { AppView } from '../types';
import { themes, Theme } from '../utils/themes';

interface SettingsProps {
    onClose: () => void;
    t: (key: string) => string;
}

export const SettingsModal: React.FC<SettingsProps> = ({ onClose, t }) => {
    const { theme, setTheme, currentTheme } = useTheme();

    return (
        <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className={`w-full max-w-sm ${currentTheme.colors.surface} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl ${currentTheme.fonts.heading} ${currentTheme.colors.text}`}>{t('settings')}</h2>
                    <button onClick={onClose} className={`p-2 rounded-full hover:bg-black/5 ${currentTheme.colors.text}`}>✕</button>
                </div>

                <div className="space-y-4">
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${currentTheme.colors.secondary}`}>{t('theme')}</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {(Object.keys(themes) as Theme[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${theme === t ? `${currentTheme.colors.accent} text-white border-transparent` : `${currentTheme.colors.surface} ${currentTheme.colors.text} ${currentTheme.colors.border}`}`}
                            >
                                <span className="font-bold">{themes[t].name}</span>
                                {theme === t && <span>✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
