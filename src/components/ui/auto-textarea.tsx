import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutoTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const AutoTextarea = React.forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  ({ className, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || textareaRef;

    const adjustHeight = React.useCallback(() => {
      const textarea = combinedRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
      }
    }, [combinedRef]);

    React.useEffect(() => {
      adjustHeight();
    }, [props.value, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      onChange?.(e);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden transition-all",
          className
        )}
        ref={combinedRef}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

AutoTextarea.displayName = "AutoTextarea";

export { AutoTextarea };
