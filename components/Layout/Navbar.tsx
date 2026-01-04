import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AppView } from '../../types';

interface NavbarProps {
    currentView: AppView;
    setView: (view: AppView) => void;
    t: (key: string) => string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, t }) => {
    const { currentTheme, theme } = useTheme();

    const isVigilante = theme === 'vigilante';

    const navItems = [
        { id: 'home', icon: '🏠', label: t('feed') },
        { id: 'leaderboard', icon: '🏆', label: t('leader') },
        { id: 'profile', icon: '👤', label: t('profile') }
    ];

    return (
        <nav className={`fixed bottom-0 left-0 right-0 h-24 ${currentTheme.colors.surface}/95 border-t ${currentTheme.colors.border} flex items-center justify-around z-40 px-6 backdrop-blur-xl transition-colors duration-300`}>
            {navItems.map((v) => (
                <button
                    key={v.id}
                    onClick={() => setView(v.id as AppView)}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === v.id ? `${currentTheme.colors.success} scale-110` : `${currentTheme.colors.secondary} hover:${currentTheme.colors.text}`}`}
                >
                    <span className="text-2xl">{v.icon}</span>
                    <span className={`text-[10px] uppercase tracking-widest ${isVigilante ? 'font-black' : 'font-semibold'}`}>{v.label}</span>
                </button>
            ))}
        </nav>
    );
};
