import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/LogoMark";

type ActiveLink = "cbam" | "dpp" | "eudr" | "none";

interface AppHeaderProps {
  active?: ActiveLink;
  eudrLabel?: string;
}

export function AppHeader({ active = "none", eudrLabel = "DR" }: AppHeaderProps) {
  const linkClass = (name: ActiveLink) =>
    `px-3 py-1.5 rounded-md hover:bg-muted ${active === name ? "font-medium text-primary" : ""}`;

  return (
    <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="font-medium tracking-tight text-foreground">EU Compliance Checker</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          <Link to="/cbam" className={linkClass("cbam")}>CBAM</Link>
          <Link to="/dpp" className={linkClass("dpp")}>DPP</Link>
          <Link to="/eudr" className={linkClass("eudr")}>{eudrLabel}</Link>
        </nav>
      </div>
    </header>
  );
}
