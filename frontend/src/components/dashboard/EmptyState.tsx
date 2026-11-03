import React from "react";

interface EmptyStateProps {
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ emoji, icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-3xl border border-zinc-200 bg-zinc-50/50">
      {(emoji || icon) && (
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl">
          {icon || emoji}
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <p className="font-heading font-semibold text-zinc-900 text-base">{title}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
