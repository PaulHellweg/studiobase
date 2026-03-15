type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actionHref?: {
    label: string;
    href: string;
  };
};

export default function EmptyState({ icon, title, description, action, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--surface2)" }}
        >
          <span style={{ color: "var(--text2)" }}>{icon}</span>
        </div>
      )}
      <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
        {title}
      </p>
      {description && (
        <p className="text-xs mb-5" style={{ color: "var(--text2)" }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          {action.label}
        </button>
      )}
      {actionHref && (
        <a
          href={actionHref.href}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white inline-block"
          style={{ background: "var(--accent)" }}
        >
          {actionHref.label}
        </a>
      )}
    </div>
  );
}
