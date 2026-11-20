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
      className={`relative bg-lemon p-3 pb-2 shadow-[var(--shadow-paper)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ...rest.style }}
    >
      {tape && <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[-4deg]" />}
      <div className="overflow-hidden bg-cotton-deep">{children}</div>
      {caption && <figcaption className="pt-2 text-center font-hand text-xl leading-tight text-cola">{caption}</figcaption>}
    </figure>
  );
}
