import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Report } from '../types';
import { SettingsModal } from '../components/SettingsModal';
import { ParkingLogo } from '../components/ParkingLogo';

interface FeedProps {
    reports: Report[];
    isMuted: boolean;
    toggleMute: () => void;
    t: (key: string) => string;
}

export const Feed: React.FC<FeedProps> = ({ reports, isMuted, toggleMute, t }) => {
    const { currentTheme } = useTheme();
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className={`p-4 h-full flex flex-col overflow-y-auto pb-32 no-scrollbar`}>
            <header className="mb-6 pt-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <ParkingLogo size="sm" themeColor={currentTheme.colors.accent.split('-')[1] + '-500'} />
                        <h1 className={`text-lg font-black italic uppercase ${currentTheme.fonts.heading} ${currentTheme.colors.text} leading-none tracking-wider`}>
                            {t('appTitle')}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowSettings(true)} className={`w-10 h-10 rounded-full ${currentTheme.colors.surface} flex items-center justify-center ${currentTheme.colors.secondary} border ${currentTheme.colors.border} active:scale-90 transition-all`}>
                            ⚙️
                        </button>
                    </div>
                </div>
                <div className={`h-1 w-full bg-gradient-to-r from-${currentTheme.colors.accent.split('-')[1]}-500 to-transparent opacity-50 rounded-full`}></div>
            </header>

            <div className="space-y-6">
                {reports.length === 0 ? (
                    <div className={`py-20 text-center opacity-30 italic uppercase text-[10px] font-black tracking-widest ${currentTheme.colors.text}`}>
                        {t('scanning')}
                    </div>
                ) : reports.map(r => (
                    <div key={r.id} className={`${currentTheme.colors.surface} rounded-[2.5rem] overflow-hidden border ${currentTheme.colors.border} shadow-xl`}>
                        <div className={`p-4 flex items-center justify-between text-[10px] font-black uppercase ${currentTheme.colors.secondary}`}>
                            <span className={`${currentTheme.colors.bg} px-3 py-1 rounded-full ${currentTheme.colors.text}`}>@{r.author}</span>
                            <span className={`font-bungee ${currentTheme.colors.success}`}>+{r.points} XP</span>
                        </div>
                        <img src={r.imageUrl} className="w-full aspect-[4/3] object-cover" />
                        <div className="p-6">
                            {r.venueName && (
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-lg">📍</span>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.colors.primary}`}>{r.venueName}</p>
                                </div>
                            )}
                            <h3 className={`text-lg italic uppercase leading-none mb-2 ${currentTheme.fonts.heading} ${currentTheme.colors.text}`}>"{r.headline}"</h3>
                            {r.userMessage && <p className={`text-xs font-medium italic ${currentTheme.colors.secondary}`}>"{r.userMessage}"</p>}
                        </div>
                    </div>
                ))}
            </div>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} t={t} />}
        </div>
    );
};
