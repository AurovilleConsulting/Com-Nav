interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 24, className = "" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="58" fill="#3b6fa0" />
      <path
        d="M60 38 L76 46 V62 C76 72 69 79 60 83 C51 79 44 72 44 62 V46 Z"
        fill="white"
        fillOpacity="0.12"
      />
      <path
        d="M60 38 L76 46 V62 C76 72 69 79 60 83 C51 79 44 72 44 62 V46 Z"
        stroke="white"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M52 60 L58 66 L70 54"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
