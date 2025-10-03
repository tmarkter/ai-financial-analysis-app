import { ReactNode } from "react";

type Props = {
  title: string;
  children?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  footer?: ReactNode;
  minHeight?: number;
};

export default function WidgetShell({
  title, 
  children, 
  isLoading, 
  error, 
  isEmpty, 
  footer, 
  minHeight = 220,
}: Props) {
  return (
    <section 
      className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0"
      style={{ minHeight }}
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading && (
          <div className="min-h-[160px] grid place-items-center text-neutral-400">
            Loading…
          </div>
        )}
        
        {!isLoading && error && (
          <div className="min-h-[160px] grid place-items-center text-red-400 text-sm text-center px-4">
            {error}
          </div>
        )}
        
        {!isLoading && !error && isEmpty && (
          <div className="min-h-[160px] grid place-items-center text-neutral-400 text-sm">
            No data available.
          </div>
        )}
        
        {!isLoading && !error && !isEmpty && children}
      </div>

      {footer && (
        <footer className="mt-3 text-xs text-neutral-500">
          {footer}
        </footer>
      )}
    </section>
  );
}
