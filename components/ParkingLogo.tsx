import React from 'react';

interface ParkingLogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    themeColor?: string;
    className?: string;
}

export const ParkingLogo: React.FC<ParkingLogoProps> = ({ size = 'md', themeColor = 'yellow-500', className = '' }) => {
    const dimensions = {
        xs: 'w-8 h-8',
        sm: 'w-10 h-10',
        md: 'w-24 h-24',
        lg: 'w-40 h-40',
        xl: 'w-64 h-64'
    };

    return (
        <div className={`relative ${dimensions[size]} flex items-center justify-center group text-${themeColor} ${className}`}>
            <div className={`absolute inset-0 bg-${themeColor}/20 rounded-full blur-3xl group-hover:bg-${themeColor}/30 transition-all duration-500`}></div>
            <svg className="w-full h-full relative z-10" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth={1} strokeDasharray="10 6" className="animate-[scan_3s_linear_infinite]" />
                <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth={8} />
                <path d="M 30 30 L 90 90" stroke="currentColor" strokeWidth={8} strokeLinecap="round" />
                <g className="translate-x-[28px] translate-y-[45px]">
                    <path d="M 4 15 C 4 12.7909 5.79086 11 8 11 H 56 C 58.2091 11 60 12.7909 60 15 V 25 H 4 V 15 Z" fill="#000" />
                    <path d="M 12 11 L 18 3 H 46 L 52 11" stroke="#000" strokeWidth={4} />
                    <circle cx="16" cy="27" r="6" fill="#000" stroke="currentColor" strokeWidth={2} />
                    <circle cx="48" cy="27" r="6" fill="#000" stroke="currentColor" strokeWidth={2} />
                </g>
            </svg>
        </div>
    );
};
