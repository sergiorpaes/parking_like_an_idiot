export type Theme = 'vigilante' | 'professional' | 'midnight';

export const themes: Record<Theme, {
    name: string;
    colors: {
        bg: string;
        text: string;
        primary: string;
        secondary: string;
        accent: string;
        surface: string;
        border: string;
        success: string;
        error: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
}> = {
    vigilante: {
        name: 'Vigilante',
        colors: {
            bg: 'bg-zinc-950',
            text: 'text-zinc-100',
            primary: 'text-yellow-500',
            secondary: 'text-zinc-400',
            accent: 'bg-yellow-500',
            surface: 'bg-zinc-900',
            border: 'border-zinc-800',
            success: 'text-yellow-500', // Vigilante style uses yellow for everything
            error: 'text-red-500',
        },
        fonts: {
            heading: 'font-bungee',
            body: 'font-sans',
        },
    },
    professional: {
        name: 'Metro',
        colors: {
            bg: 'bg-slate-50',
            text: 'text-slate-900',
            primary: 'text-blue-600',
            secondary: 'text-slate-500',
            accent: 'bg-blue-600',
            surface: 'bg-white',
            border: 'border-slate-200',
            success: 'text-emerald-600',
            error: 'text-rose-600',
        },
        fonts: {
            heading: 'font-sans font-bold',
            body: 'font-sans',
        },
    },
    midnight: {
        name: 'Midnight',
        colors: {
            bg: 'bg-[#0f172a]',
            text: 'text-indigo-50',
            primary: 'text-indigo-400',
            secondary: 'text-slate-400',
            accent: 'bg-indigo-500',
            surface: 'bg-[#1e293b]',
            border: 'border-slate-700',
            success: 'text-teal-400',
            error: 'text-rose-400',
        },
        fonts: {
            heading: 'font-sans font-black tracking-tight',
            body: 'font-sans',
        },
    },
};
