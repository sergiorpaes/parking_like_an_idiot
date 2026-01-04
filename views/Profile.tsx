import React, { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { UserStats, AppView } from '../types';
import { sound } from '../services/audioService';

interface ProfileProps {
    userStats: UserStats | null;
    setUserStats: (stats: UserStats | null) => void;
    setView: (view: AppView) => void;
    setIsCapturingForProfile: (v: boolean) => void;
    setPendingProfilePic: (v: string | null) => void;
    pendingProfilePic: string | null;
    t: (key: string) => string;
}

export const Profile: React.FC<ProfileProps> = ({ userStats, setUserStats, setView, setIsCapturingForProfile, setPendingProfilePic, pendingProfilePic, t }) => {
    const { currentTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showOptions, setShowOptions] = React.useState(false);

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setPendingProfilePic(event.target?.result as string);
            setShowOptions(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className={`p-4 h-full text-center flex flex-col items-center overflow-y-auto pb-32 no-scrollbar`}>
            <div className="mt-12 relative">
                <div className={`w-32 h-32 rounded-full ${currentTheme.colors.surface} border-4 ${currentTheme.colors.border} shadow-xl flex items-center justify-center text-5xl overflow-hidden`}>
                    {userStats?.profilePicture ? <img src={userStats.profilePicture} className="w-full h-full object-cover" alt="Profile" /> : "👤"}
                </div>
                <button onClick={() => {
                    sound.playClick();
                    setShowOptions(true);
                }} className={`absolute bottom-0 right-0 w-10 h-10 ${currentTheme.colors.accent} rounded-full flex items-center justify-center text-black border-4 ${currentTheme.colors.bg} hover:scale-110 transition-transform active:scale-90`}>📸</button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileImport} />
            </div>

            {showOptions && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className={`${currentTheme.colors.surface} w-full max-w-sm rounded-[2rem] p-6 space-y-3 border ${currentTheme.colors.border} shadow-2xl`}>
                        <h3 className={`text-center font-black uppercase tracking-widest mb-4 ${currentTheme.colors.text}`}>{t('changePic')}</h3>
                        <button onClick={() => {
                            sound.playClick();
                            fileInputRef.current?.click();
                        }} className={`w-full py-4 rounded-xl font-bold uppercase text-xs tracking-wider border border-current ${currentTheme.colors.text} hover:opacity-70 transition-opacity`}>
                            {t('importDevice')}
                        </button>
                        <button onClick={() => {
                            sound.playClick();
                            setIsCapturingForProfile(true);
                            setView('camera');
                        }} className={`w-full py-4 rounded-xl font-bold uppercase text-xs tracking-wider ${currentTheme.colors.accent} text-black shadow-lg hover:brightness-110 active:scale-95 transition-all`}>
                            📷 Camera
                        </button>
                        <button onClick={() => setShowOptions(false)} className="w-full py-3 text-xs font-bold opacity-50 uppercase tracking-widest mt-2">
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            )}
            <h2 className={`text-3xl italic uppercase mt-6 ${currentTheme.fonts.heading} ${currentTheme.colors.text}`}>{userStats?.username}</h2>
            <div className={`${currentTheme.colors.accent}/10 ${currentTheme.colors.primary} text-xs font-black uppercase tracking-widest px-6 py-2 rounded-full mt-4 border border-current`}>{t('level')} {userStats?.level}</div>
            <div className="w-full max-w-sm mt-12 space-y-4 px-4">
                <div className={`flex justify-between items-center ${currentTheme.colors.surface} p-6 rounded-3xl border ${currentTheme.colors.border}`}>
                    <div className="text-left"><p className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.colors.secondary}`}>{t('reports')}</p><p className={`text-xl font-black ${currentTheme.colors.text}`}>{userStats?.reportsCount}</p></div>
                    <div className="text-right"><p className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.colors.secondary}`}>{t('totalXP')}</p><p className={`text-xl font-black font-bungee ${currentTheme.colors.primary}`}>{userStats?.totalPoints}</p></div>
                </div>
                <button
                    onClick={() => {
                        sound.playClick();
                        setUserStats(null);
                        localStorage.removeItem('userStats');
                        setView('login');
                    }}
                    className={`w-full ${currentTheme.colors.error} text-xs font-black uppercase tracking-widest mt-8 hover:opacity-80 transition-colors py-4`}
                >
                    {t('signOut')}
                </button>
            </div>
            {/* Confirmation Modal for Pending Profile Pic */}
            {pendingProfilePic && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                    <h3 className={`text-2xl font-black uppercase italic mb-8 ${currentTheme.colors.text}`}>{t('confirmPic')}</h3>

                    <div className={`w-48 h-48 rounded-full border-4 ${currentTheme.colors.accent} shadow-[0_0_30px_rgba(255,255,0,0.3)] overflow-hidden mb-10`}>
                        <img src={pendingProfilePic} className="w-full h-full object-cover" />
                    </div>

                    <div className="w-full max-w-xs space-y-4">
                        <button onClick={() => {
                            if (userStats) setUserStats({ ...userStats, profilePicture: pendingProfilePic });
                            setPendingProfilePic(null);
                            sound.playSuccess();
                        }} className={`w-full ${currentTheme.colors.accent} text-black py-4 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all`}>
                            {t('confirm')}
                        </button>

                        <button onClick={() => {
                            setPendingProfilePic(null);
                            sound.playClick();
                        }} className={`w-full py-4 rounded-[2rem] font-black uppercase text-sm tracking-widest border border-current ${currentTheme.colors.text} hover:opacity-70 transition-opacity`}>
                            {t('discard')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
