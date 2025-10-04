import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  amount: number;
  variant?: "default" | "large" | "small";
  className?: string;
}

export const CreditBadge = ({ amount, variant = "default", className }: CreditBadgeProps) => {
  const variants = {
    small: "px-2 py-1 text-xs",
    default: "px-3 py-1.5 text-sm",
    large: "px-4 py-2 text-base font-semibold"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full bg-gradient-credit text-credit-foreground shadow-credit transition-smooth",
      variants[variant],
      className
    )}>
      <Clock className="h-4 w-4" />
      <span>{amount} credits</span>
    </div>
  );
};