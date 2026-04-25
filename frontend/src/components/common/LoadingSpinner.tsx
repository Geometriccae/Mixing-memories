import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
  text?: string;
}

const LoadingSpinner = ({ className = "", size = 40, text }: LoadingSpinnerProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 w-full ${className}`}>
      <Loader2 
        className="text-primary animate-spin mb-4" 
        size={size} 
      />
      {text && <p className="text-muted-foreground animate-pulse font-medium">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
