
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export default function SiteLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 370 50" // Adjusted viewBox width for shorter text
      className={cn("fill-current text-primary", className)}
      aria-label="Hammonia Taxi Shift Logo" // Updated aria-label
      {...props}
    >
      <title>Hammonia Taxi Shift Logo</title> {/* Updated title */}
      {/* Simple placeholder logo - Replace with actual SVG if available */}
      <rect width="50" height="50" rx="8" ry="8" className="text-accent" fill="currentColor" />
      <circle cx="25" cy="25" r="10" className="text-primary-foreground" fill="currentColor" />
      <text
        x="60"
        y="35"
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize="30"
        fontWeight="bold"
        className="text-foreground" fill="currentColor"
      >
        Hammonia Taxi Shift
      </text>
    </svg>
  );
}
