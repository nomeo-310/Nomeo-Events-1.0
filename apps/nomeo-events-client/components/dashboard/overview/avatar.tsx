interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
}

export function Avatar({ src, name, size = 72 }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover border-2 border-border flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-violet-100 dark:bg-violet-900 border-2 border-border flex items-center justify-center flex-shrink-0 font-medium text-violet-800 dark:text-violet-200"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials || "?"}
    </div>
  );
}