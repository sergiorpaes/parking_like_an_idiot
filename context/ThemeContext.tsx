import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, themes } from '../utils/themes';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentTheme: typeof themes['vigilante'];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('professional');

    useEffect(() => {
        const savedTheme = localStorage.getItem('app_theme') as Theme;
        if (savedTheme && themes[savedTheme]) {
            setThemeState(savedTheme);
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('app_theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, currentTheme: themes[theme] }}>
            <div className={`min-h-screen transition-colors duration-300 ${themes[theme].colors.bg} ${themes[theme].colors.text} ${themes[theme].fonts.body}`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
