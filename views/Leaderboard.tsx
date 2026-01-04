import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { UserStats } from '../types';

interface LeaderboardProps {
    userStats: UserStats | null;
    t: (key: string) => string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ userStats, t }) => {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'ranks' | 'rewards'>('ranks');

    const REWARDS = [
        { id: 'coffee', name: '€5 COFFEE CARD', cost: 1500, icon: '☕' },
        { id: 'spotify', name: 'SPOTIFY MONTH', cost: 3000, icon: '🎵' },
        { id: 'uber', name: '€20 UBER CASH', cost: 5500, icon: '🚗' },
        { id: 'amazon25', name: '€25 AMAZON CARD', cost: 7000, icon: '📦' },
        { id: 'netflix', name: '€50 NETFLIX CARD', cost: 12000, icon: '🎬' },
        { id: 'steam', name: '€50 STEAM CARD', cost: 12000, icon: '🎮' },
        { id: 'merch', name: 'OFFICIAL MERCH', cost: 15000, icon: '👕' },
        { id: 'apple', name: '€100 APP STORE', cost: 25000, icon: '🍎' },
    ];

    const handleClaim = (cost: number) => {
        if ((userStats?.totalPoints || 0) >= cost) {
            alert("Reward Claimed! (Simulation)");
            // In real app, deduct points here
        } else {
            alert("Not enough points!");
        }
    };

    return (
        <div className={`h-full flex flex-col overflow-hidden`}>
            {/* Tab Switcher */}
            <div className="flex p-4 gap-4 bg-black/10 backdrop-blur-sm sticky top-0 z-10">
                <button
                    onClick={() => setActiveTab('ranks')}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'ranks' ? `${currentTheme.colors.accent} text-black shadow-lg` : `${currentTheme.colors.surface} ${currentTheme.colors.text} opacity-50`}`}
                >
                    {t('leader')}
                </button>
                <button
                    onClick={() => setActiveTab('rewards')}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'rewards' ? `${currentTheme.colors.accent} text-black shadow-lg` : `${currentTheme.colors.surface} ${currentTheme.colors.text} opacity-50`}`}
                >
                    {t('gifts')}
                </button>
            </div>

            <div className={`p-4 flex-1 overflow-y-auto pb-32 no-scrollbar space-y-4`}>
                {activeTab === 'ranks' && (
                    <>
                        <header className="mb-2 flex items-center justify-between">
                            <h2 className={`text-2xl italic uppercase ${currentTheme.fonts.heading} ${currentTheme.colors.text}`}>{t('topVigilantes')}</h2>
                        </header>

                        {/* User Rank Card */}
                        {userStats && (
                            <div className={`p-6 rounded-[2rem] border-2 ${currentTheme.colors.accent} bg-gradient-to-br from-${currentTheme.colors.accent.split('-')[1]}-900/20 to-transparent mb-6`}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-full ${currentTheme.colors.accent} flex items-center justify-center text-2xl`}>
                                        {userStats.level === 1 ? '👀' : userStats.level === 2 ? '📸' : userStats.level === 3 ? '🕵️' : '👮'}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-bold opacity-70 uppercase tracking-wider ${currentTheme.colors.text}`}>Current Rank</p>
                                        <h3 className={`text-xl font-black uppercase italic ${currentTheme.colors.text}`}>
                                            {userStats.level === 1 && 'Observer'}
                                            {userStats.level === 2 && 'Spotter'}
                                            {userStats.level === 3 && 'Inspector'}
                                            {userStats.level >= 4 && 'Enforcer'}
                                        </h3>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className={`text-2xl font-black ${currentTheme.colors.accent}`}>{userStats.totalPoints}</p>
                                        <p className={`text-[10px] font-bold uppercase opacity-60 ${currentTheme.colors.text}`}>Total XP</p>
                                    </div>
                                </div>
                                {/* Progress Bar simulation or Daily Cap info */}
                                <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${currentTheme.colors.accent}`} style={{ width: `${Math.min((userStats.dailyPoints / 200) * 100, 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <p className={`text-[10px] font-bold ${currentTheme.colors.text} opacity-50`}>Daily Cap: {userStats.dailyPoints}/200</p>
                                    <p className={`text-[10px] font-bold ${currentTheme.colors.text} opacity-50`}>Reset in: 8h</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {[
                                { name: 'ROAD_RAGE_99', xp: 15400, rank: 1, level: 4 },
                                { name: 'CURB_CRUSHER', xp: 12200, rank: 2, level: 4 },
                                { name: 'TOW_ZONE_TERRY', xp: 10100, rank: 3, level: 4 },
                                { name: userStats?.username || t('you'), xp: userStats?.totalPoints || 0, rank: 4, self: true, level: userStats?.level || 1 }
                            ].sort((a, b) => b.xp - a.xp).map((v, i) => (
                                <div key={v.name} className={`flex items-center gap-4 p-5 rounded-[2rem] border ${v.self ? `${currentTheme.colors.accent}/30 ${currentTheme.colors.border}` : `${currentTheme.colors.surface} ${currentTheme.colors.border}`}`}>
                                    <div className={`w-8 h-8 rounded-full ${currentTheme.colors.bg} flex items-center justify-center font-black text-xs ${currentTheme.colors.secondary}`}>{i + 1}</div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-black uppercase tracking-widest ${currentTheme.colors.text}`}>{v.name}</p>
                                        <p className={`text-[10px] font-black uppercase ${currentTheme.colors.secondary}`}>
                                            {v.level === 1 ? 'Observer' : v.level === 2 ? 'Spotter' : v.level === 3 ? 'Inspector' : 'Enforcer'}
                                        </p>
                                    </div>
                                    <p className={`font-bungee text-sm ${currentTheme.colors.primary}`}>{v.xp} XP</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'rewards' && (
                    <>
                        <header className="mb-6 flex items-center justify-between">
                            <h2 className={`text-2xl italic uppercase ${currentTheme.fonts.heading} ${currentTheme.colors.text}`}>{t('prizeVault')}</h2>
                            <div className={`px-4 py-1 rounded-full ${currentTheme.colors.accent} text-black font-black text-xs`}>
                                {userStats?.totalPoints} PTS
                            </div>
                        </header>
                        <div className="grid grid-cols-2 gap-4">
                            {REWARDS.map(reward => {
                                const canAfford = (userStats?.totalPoints || 0) >= reward.cost;
                                return (
                                    <div key={reward.id} className={`p-4 rounded-[1.5rem] border flex flex-col items-center text-center gap-3 transition-all ${canAfford ? `${currentTheme.colors.surface} ${currentTheme.colors.border}` : `bg-black/20 border-white/5 opacity-60 grayscale`}`}>
                                        <div className="text-4xl">{reward.icon}</div>
                                        <div>
                                            <h4 className={`font-black uppercase text-xs tracking-wider ${currentTheme.colors.text} mb-1 h-8 flex items-center justify-center`}>{reward.name}</h4>
                                            <p className={`font-bold ${currentTheme.colors.primary} text-xs`}>{reward.cost} PTS</p>
                                        </div>
                                        <button
                                            onClick={() => handleClaim(reward.cost)}
                                            disabled={!canAfford}
                                            className={`w-full py-2 rounded-xl font-black uppercase text-[10px] tracking-widest mt-2 ${canAfford ? `${currentTheme.colors.accent} text-black active:scale-95` : `bg-white/10 text-white/40 cursor-not-allowed`}`}
                                        >
                                            {canAfford ? t('claim') : t('locked')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
