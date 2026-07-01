import { cn } from '@/lib/utils';

interface PalcoIconProps {
  className?: string;
  filled?: boolean;
}

/**
 * Custom Palco icon - a podium/stamp representing the stage concept
 * Matches the brand aesthetic with a solid base and decorative top
 */
export function PalcoIcon({ className, filled = false }: PalcoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-6 h-6", className)}
    >
      {filled ? (
        <>
          {/* Filled version - Stamp/Podium base filled */}
          <path
            d="M12 3C9.5 3 7.5 5 7.5 7.5C7.5 9 8.3 10.3 9.5 11V12H14.5V11C15.7 10.3 16.5 9 16.5 7.5C16.5 5 14.5 3 12 3Z"
            fill="currentColor"
          />
          <rect x="10" y="12" width="4" height="3" rx="0.5" fill="currentColor" />
          <path
            d="M6 17C5.45 17 5 17.45 5 18V20C5 20.55 5.45 21 6 21H18C18.55 21 19 20.55 19 20V18C19 17.45 18.55 17 18 17H6Z"
            fill="currentColor"
          />
          <rect x="8" y="15" width="8" height="2" rx="0.5" fill="currentColor" />
        </>
      ) : (
        <>
          {/* Outline version - Stamp/Podium base */}
          <path
            d="M12 3C9.5 3 7.5 5 7.5 7.5C7.5 9 8.3 10.3 9.5 11V12H14.5V11C15.7 10.3 16.5 9 16.5 7.5C16.5 5 14.5 3 12 3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect 
            x="10" 
            y="12" 
            width="4" 
            height="3" 
            rx="0.5" 
            stroke="currentColor" 
            strokeWidth="1.5"
          />
          <path
            d="M6 17C5.45 17 5 17.45 5 18V20C5 20.55 5.45 21 6 21H18C18.55 21 19 20.55 19 20V18C19 17.45 18.55 17 18 17H6Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line 
            x1="8" 
            y1="16" 
            x2="16" 
            y2="16" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
