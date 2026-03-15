/** Reusable animated skeleton components for loading states */

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

const ROUNDED: Record<string, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export function SkeletonBox({
  className = "",
  style,
  width,
  height = "1rem",
  rounded = "md",
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${ROUNDED[rounded] ?? "rounded-md"} ${className}`}
      style={{
        background: "var(--surface2)",
        width,
        height,
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          height="0.875rem"
          width={i === lines - 1 && lines > 1 ? "60%" : "100%"}
          rounded="sm"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl p-5 space-y-3 ${className}`}
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <SkeletonBox height="1rem" width="40%" rounded="sm" />
      <SkeletonBox height="2rem" width="60%" rounded="sm" />
      <SkeletonBox height="0.75rem" width="30%" rounded="sm" />
    </div>
  );
}

export function SkeletonRow({ cols = 4, className = "" }: { cols?: number; className?: string }) {
  return (
    <tr className={className} style={{ borderBottom: "1px solid var(--border)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox height="1rem" width={i === 0 ? "70%" : "50%"} rounded="sm" />
        </td>
      ))}
    </tr>
  );
}

export default SkeletonBox;
