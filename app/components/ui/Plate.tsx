import React from 'react';

interface PlateProps {
    plate: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function Plate({ plate, size = 'md', className = '' }: PlateProps) {
    const formattedPlate = plate.toUpperCase().replace(/\s/g, '');

    // Size variants
    const sizes = {
        sm: 'h-6 text-[10px] px-2 min-w-[60px]',
        md: 'h-8 text-xs px-3 min-w-[80px]',
        lg: 'h-12 text-lg px-4 min-w-[110px]'
    };

    // Argentina Mercosur Plate Style (simplified)
    return (
        <div
            className={`
                relative bg-white border-2 border-black rounded-lg 
                flex flex-col items-center justify-center 
                shadow-sm font-bold tracking-wider overflow-hidden
                select-none ${sizes[size]} ${className}
            `}
        >
            {/* Blue header strip */}
            <div className="absolute top-0 left-0 right-0 h-[25%] bg-[#003399] flex items-center justify-between px-1">
                <span className="text-[6px] text-white">ARGENTINA</span>
            </div>

            {/* Plate Number */}
            <div className="mt-[6px] font-mono text-black z-10">
                {formattedPlate}
            </div>
        </div>
    );
}
