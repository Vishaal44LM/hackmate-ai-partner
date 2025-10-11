import { ReactNode } from "react";

interface OutputCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const OutputCard = ({ title, children, className = "" }: OutputCardProps) => {
  return (
    <div className={`bg-card rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-[box-shadow] duration-300 border border-border ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-3 text-foreground">{title}</h3>}
      <div className="text-foreground whitespace-pre-wrap">{children}</div>
    </div>
  );
};

export default OutputCard;