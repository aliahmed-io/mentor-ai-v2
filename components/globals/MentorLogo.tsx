import type React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function MentorLogoShort({
  className,
  iconClassName,
  ...props
}: Omit<LogoProps, "textClassName">) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-10 w-10 overflow-visible", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mentor AI Icon"
      {...props}
    >
      {/* Soft Cozy Organic Background Orb */}
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="url(#sanctuary-grad)"
        className={cn("transition-all duration-300", iconClassName)}
      />

      {/* Styled Mindful Growth Leaves forming a stylized 'M' */}
      <path
        d="M12 25C12 18 16 14 20 20C24 14 28 18 28 25C28 28 25 30 20 27C15 30 12 28 12 25Z"
        fill="#96c8a2"
        className="transition-colors duration-300"
      />
      <path
        d="M15 25C15 20 18 17 20 21C22 17 25 20 25 25C25 27 23 28 20 26C17 28 15 27 15 25Z"
        fill="#6da37a"
        className="transition-colors duration-300"
      />

      {/* Radiant Focus Spark - Warm Gold glow */}
      <circle cx="20" cy="13" r="2.5" fill="#E5A93B" />
      <circle
        cx="20"
        cy="13"
        r="4"
        fill="none"
        stroke="#E5A93B"
        strokeWidth="0.75"
        className="animate-pulse"
      />

      <defs>
        <linearGradient id="sanctuary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#96c8a2" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EDEAE1" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MentorLogoLong({
  className,
  iconClassName,
  textClassName,
  ...props
}: LogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      <MentorLogoShort
        className={cn("size-9 shrink-0", iconClassName)}
        {...props}
      />
      <div className={cn("flex flex-col", textClassName)}>
        <span className="text-sm font-extrabold tracking-tight text-[#221F1C] leading-none">
          Mentor{" "}
          <span className="font-serif italic font-semibold text-[#96c8a2] ml-0.5">
            AI
          </span>
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#696257] leading-none mt-1">
          Study Sanctuary
        </span>
      </div>
    </div>
  );
}
