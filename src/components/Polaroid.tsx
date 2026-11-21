/** Polaroid frame with optional washi tape and handwritten caption. */
export function Polaroid({
  children,
  caption,
  rotate = 0,
  tape = true,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  caption?: React.ReactNode;
  rotate?: number;
  tape?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <figure
      {...rest}
      className={`relative bg-lemon p-1.5 pb-1 shadow-[var(--shadow-paper)] sm:p-3 sm:pb-2 ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ...rest.style }}
    >
      {tape && <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[-4deg]" />}
      <div className="overflow-hidden bg-cotton-deep">{children}</div>
      {caption && <figcaption className="pt-1 text-center font-hand text-sm leading-tight text-cola sm:pt-2 sm:text-xl">{caption}</figcaption>}
    </figure>
  );
}
