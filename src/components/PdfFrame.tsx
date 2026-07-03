import { LogoMark } from "@/components/LogoMark";

export function PdfHeader({ title }: { title: string }) {
  return (
    <div className="hidden print:flex items-center justify-between pb-3 mb-4 border-b border-border">
      <div className="flex items-center gap-2">
        <LogoMark size={26} />
        <div className="leading-tight">
          <div className="font-medium text-foreground text-sm">EU Compliance Checker</div>
          <div className="text-[10px] text-muted-foreground">{title}</div>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground text-right">
        Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

export function PdfFooter() {
  return (
    <div className="hidden print:block mt-8 pt-3 border-t border-border text-[10px] text-muted-foreground leading-snug">
      <div className="font-medium text-foreground">Powered by Auroville Consulting</div>
      <div>Kalpana, Crown Road, Auroville, TN-605101, India</div>
      <div>+91 (0413) 2622571 · info@aurovilleconsulting.com</div>
    </div>
  );
}