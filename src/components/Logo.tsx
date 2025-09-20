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
    xl: "h-20", 
    "2xl": "h-24", 
    "3xl": "h-32", 
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/lovable-uploads/a967c9ca-f718-42ce-a45b-07ccc9d9f0c5.png"
        alt="مجله روانیک"
        className={cn("object-contain", sizeClasses[size])}
      />
    </div>
  );
};

export default Logo;
