import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="p-1 hover:scale-110 transition-transform"
        >
          <Star
            className={cn(
              "w-6 h-6",
              rating <= value
                ? "fill-yellow-400 stroke-yellow-400"
                : "stroke-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
} 