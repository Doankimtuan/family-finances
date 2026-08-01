interface LogoProps {
  size?: number;
  showName?: boolean;
  className?: string;
}

export function Logo({ size = 32, showName = true, className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <img src="/logo.svg" width={size} height={size} alt="Family Finances logo" />
      {showName && (
        <span className="font-medium text-base text-foreground">Family Finances</span>
      )}
    </div>
  );
}
