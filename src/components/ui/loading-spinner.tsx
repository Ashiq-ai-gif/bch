import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
}

export const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <div
                className={cn(
                    "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent",
                    className
                )}
            />
        </div>
    );
};
