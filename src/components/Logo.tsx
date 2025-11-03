import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
}

const Logo = ({ size = "md", className }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-20", // Increased from h-16 for a larger default "xl" size
    "2xl": "h-24", // Increased from h-20
    "3xl": "h-32", // New even larger size
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/lovable-uploads/a967c9ca-f718-42ce-a45b-07ccc9d9f0c5.png"
        alt="مجله روانک"
        className={cn("object-contain", sizeClasses[size])}
      />
    </div>
  );
};

export default Logo;
