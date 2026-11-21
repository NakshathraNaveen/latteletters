/**
 * Illustrated cup avatar: style + drink + colour + painted pattern
 * (see src/lib/avatar.ts). One 200×220 viewBox for every style so they
 * line up in rows. Pure SVG, no client JS.
 */
import { useId, type ReactNode } from "react";
import { CUP_COLOURS, CUP_DRINKS, describeCup, parseCup, type Cup, type CupPattern } from "@/lib/avatar";
import { DRINKS, type DrinkId } from "@/lib/drinks";
import { DrinkCup } from "./DrinkCup";

const LINE = { stroke: "#47131c", strokeOpacity: 0.5, strokeWidth: 3, strokeLinejoin: "round" as const };
const CREAM = "#fff8ec";

/** Any stored avatar: new cup avatars, or a legacy drink id. */
export function UserAvatar({ avatar, className = "", label }: { avatar: string; className?: string; label?: string | true }) {
  const cup = parseCup(avatar);
  const text = label === true ? (cup ? describeCup(cup) : undefined) : label;
  if (cup) return <CupAvatar cup={cup} className={className} label={text} />;
  return <DrinkCup drink={avatar in DRINKS ? (avatar as DrinkId) : "iced-latte"} className={className} label={text} />;
}

export function PatternDef({ id, pattern, ink }: { id: string; pattern: CupPattern; ink: string }) {
  const tile = (w: number, h: number, children: ReactNode) => (
    <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
      {children}
    </pattern>
  );
  const heart = (x: number, y: number, s = 1) => (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 5 C-6 0 -6 -5 -3 -6 C-1.5 -6.5 0 -5 0 -4 C0 -5 1.5 -6.5 3 -6 C6 -5 6 0 0 5Z"
      fill={ink}
    />
  );
  const star = (x: number, y: number, s = 1) => (
    <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -7 Q1 -1 7 0 Q1 1 0 7 Q-1 1 -7 0 Q-1 -1 0 -7Z" fill={ink} />
  );
  const flower = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="0" cy="-4.5" rx="3" ry="4" transform={`rotate(${r})`} fill={ink} />
      ))}
      <circle r="2.4" fill="#ffe78f" />
    </g>
  );
  switch (pattern) {
    case "dots":
      return tile(22, 22, <><circle cx="5.5" cy="5.5" r="3.6" fill={ink} /><circle cx="16.5" cy="16.5" r="3.6" fill={ink} /></>);
    case "stripes":
      return tile(20, 16, <rect width="20" height="7" fill={ink} />);
    case "hearts":
      return tile(30, 30, <>{heart(8, 9, 1.1)}{heart(23, 24, 1.1)}</>);
    case "stars":
      return tile(32, 32, <>{star(8, 8, 1)}{star(24, 24, 0.8)}<circle cx="24" cy="8" r="1.6" fill={ink} /><circle cx="8" cy="24" r="1.6" fill={ink} /></>);
    case "flowers":
      return tile(34, 34, <>{flower(9, 9)}{flower(26, 26)}</>);
    case "gingham":
      return tile(20, 20, <><rect width="20" height="10" fill={ink} opacity="0.4" /><rect width="10" height="20" fill={ink} opacity="0.4" /></>);
    case "cherries":
      return tile(
        36,
        36,
        <>
          <path d="M14 8 Q18 14 12 22 M14 8 Q16 16 22 21" fill="none" stroke="#3f7a3a" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M14 8 Q20 4 24 8 Q18 10 14 8Z" fill="#5fa04e" />
          <circle cx="11" cy="24" r="4.4" fill={ink} />
          <circle cx="22.5" cy="23" r="4.4" fill={ink} />
          <circle cx="9.5" cy="22.5" r="1.2" fill="#fff" opacity="0.7" />
        </>,
      );
    case "waves":
      return tile(28, 14, <path d="M0 7 Q7 1 14 7 T28 7" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />);
    default:
      return null;
  }
}

/** The painted area of a cup: base colour, then the pattern on top. */
function Painted({ d, colour, patternId, plain }: { d: string; colour: string; patternId: string; plain: boolean }) {
  return (
    <>
      <path d={d} fill={colour} />
      {!plain && <path d={d} fill={`url(#${patternId})`} />}
    </>
  );
}

function Topping({ kind, cx, cy, rx }: { kind: string; cx: number; cy: number; rx: number }) {
  if (kind === "heart")
    return (
      <path
        transform={`translate(${cx} ${cy}) scale(${rx / 60})`}
        d="M0 10 C-16 0 -18 -10 -8 -12 C-4 -13 0 -9 0 -6 C0 -9 4 -13 8 -12 C18 -10 16 0 0 10Z"
        fill={CREAM}
        opacity="0.92"
      />
    );
  if (kind === "foam")
    return (
      <g fill={CREAM} opacity="0.9">
        <ellipse cx={cx - rx * 0.3} cy={cy} rx={rx * 0.45} ry={rx * 0.14} />
        <ellipse cx={cx + rx * 0.3} cy={cy + 1} rx={rx * 0.4} ry={rx * 0.12} />
      </g>
    );
  if (kind === "spice")
    return (
      <g fill="#6b3a1c" opacity="0.75">
        {[[-0.5, -0.1], [-0.2, 0.15], [0.1, -0.2], [0.35, 0.1], [0.6, -0.05], [-0.05, 0.02], [0.25, 0.25], [-0.35, -0.3]].map(([x, y], i) => (
          <circle key={i} cx={cx + x * rx} cy={cy + y * rx * 0.3} r={i % 2 ? 1.6 : 2.2} />
        ))}
      </g>
    );
  return null;
}

const Steam = ({ x = 100, y = 40 }: { x?: number; y?: number }) => (
  <g fill="none" stroke="#47131c" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round">
    <path d={`M${x - 18} ${y} C${x - 28} ${y - 10} ${x - 8} ${y - 18} ${x - 18} ${y - 30}`} />
    <path d={`M${x + 16} ${y} C${x + 6} ${y - 10} ${x + 26} ${y - 18} ${x + 16} ${y - 30}`} />
  </g>
);

const Shadow = ({ rx = 64 }: { rx?: number }) => <ellipse cx="100" cy="210" rx={rx} ry="7" fill="#47131c" opacity="0.16" />;

function Pearls({ y }: { y: number }) {
  return (
    <g fill="#3a1d12">
      {[[70, 0], [86, 4], [102, 0], [118, 4], [132, -1], [78, -10], [96, -9], [112, -11], [126, -12]].map(([x, dy], i) => (
        <circle key={i} cx={x} cy={y + dy} r="6.5" />
      ))}
    </g>
  );
}

export function CupAvatar({ cup, className = "", label }: { cup: Cup; className?: string; label?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pid = `pat-${uid}`;
  const cid = `clip-${uid}`;
  const gid = `grad-${uid}`;
  const drink = CUP_DRINKS[cup.drink];
  const colour = CUP_COLOURS[cup.colour];
  const plain = cup.pattern === "plain";
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  const isBoba = cup.drink === "boba";

  const defs = (
    <defs>
      <PatternDef id={pid} pattern={cup.pattern} ink={colour.ink} />
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={CREAM} stopOpacity="0.95" />
        <stop offset="0.25" stopColor={drink.tint} stopOpacity="0.85" />
        <stop offset="1" stopColor={drink.tint} />
      </linearGradient>
    </defs>
  );

  let body: ReactNode;
  switch (cup.style) {
    case "mug": {
      const d = "M40 62 H160 V178 Q160 200 138 200 H62 Q40 200 40 178 Z";
      body = (
        <>
          <Shadow />
          <Steam y={42} />
          <path d="M158 86 C196 84 196 150 156 150" fill="none" stroke={colour.body} strokeWidth="16" strokeLinecap="round" />
          <path d="M158 86 C196 84 196 150 156 150" fill="none" {...LINE} />
          <Painted d={d} colour={colour.body} patternId={pid} plain={plain} />
          <path d={d} fill="none" {...LINE} />
          <ellipse cx="100" cy="62" rx="60" ry="13" fill={colour.body} {...LINE} />
          <ellipse cx="100" cy="63" rx="51" ry="9" fill={drink.tint} />
          <Topping kind={drink.topping} cx={100} cy={63} rx={44} />
        </>
      );
      break;
    }
    case "teacup": {
      const d = "M22 84 H178 C178 148 148 182 100 182 C52 182 22 148 22 84Z";
      body = (
        <>
          <ellipse cx="100" cy="204" rx="90" ry="12" fill="#47131c" opacity="0.14" />
          <ellipse cx="100" cy="196" rx="88" ry="15" fill={colour.body} {...LINE} />
          <ellipse cx="100" cy="194" rx="64" ry="8" fill="none" stroke={colour.ink} strokeWidth="3" opacity="0.7" />
          <Steam y={60} />
          <path d="M174 102 C204 100 204 146 164 150" fill="none" stroke={colour.body} strokeWidth="13" strokeLinecap="round" />
          <path d="M174 102 C204 100 204 146 164 150" fill="none" {...LINE} />
          <Painted d={d} colour={colour.body} patternId={pid} plain={plain} />
          <path d={d} fill="none" {...LINE} />
          <ellipse cx="100" cy="84" rx="78" ry="15" fill={colour.body} {...LINE} />
          <ellipse cx="100" cy="84" rx="78" ry="15" fill="none" stroke="#e2b04a" strokeWidth="3" />
          <ellipse cx="100" cy="85" rx="68" ry="10" fill={drink.tint} />
          <Topping kind={drink.topping} cx={100} cy={85} rx={54} />
        </>
      );
      break;
    }
    case "kulhad": {
      const d = "M40 66 Q30 136 60 198 Q100 208 140 198 Q170 136 160 66 Z";
      body = (
        <>
          <clipPath id={cid}>
            <path d={d} />
          </clipPath>
          <Shadow rx={52} />
          <Steam y={44} />
          <path d={d} fill="#c8693f" />
          <g clipPath={`url(#${cid})`}>
            <path d="M120 60 Q150 130 130 210 L180 210 L180 60Z" fill="#a9532f" opacity="0.45" />
            <Painted d="M0 112 H200 V150 H0Z" colour={colour.body} patternId={pid} plain={plain} />
            <path d="M0 112 H200 M0 150 H200" stroke="#47131c" strokeOpacity="0.35" strokeWidth="2.5" />
            <g fill="#8e3f22" opacity="0.45">
              <circle cx="62" cy="92" r="1.8" />
              <circle cx="128" cy="86" r="1.5" />
              <circle cx="84" cy="176" r="1.6" />
              <circle cx="118" cy="168" r="1.9" />
            </g>
          </g>
          <path d={d} fill="none" {...LINE} />
          <ellipse cx="100" cy="66" rx="60" ry="12" fill="#d67b4f" {...LINE} />
          <ellipse cx="100" cy="67" rx="51" ry="8" fill={drink.tint} />
          <Topping kind={drink.topping} cx={100} cy={67} rx={44} />
        </>
      );
      break;
    }
    case "glass": {
      const d = "M50 60 H150 L138 200 Q100 206 62 200 Z";
      body = (
        <>
          <clipPath id={cid}>
            <path d={d} />
          </clipPath>
          <Shadow rx={48} />
          <Steam y={40} />
          <g clipPath={`url(#${cid})`}>
            <rect x="0" y="78" width="200" height="140" fill={`url(#${gid})`} />
            {isBoba && <Pearls y={190} />}
            <Painted d="M0 58 H200 V80 H0Z" colour={colour.body} patternId={pid} plain={plain} />
            <g stroke="#ffffff" strokeOpacity="0.4" strokeWidth="4">
              {[66, 82, 98, 114, 130].map((x) => (
                <path key={x} d={`M${x} 84 L${x + (x - 100) * -0.08} 198`} />
              ))}
            </g>
          </g>
          <path d={d} fill="none" {...LINE} />
          <path d="M60 88 L70 192" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        </>
      );
      break;
    }
    case "togo": {
      const d = "M48 60 H152 L140 202 Q100 206 60 202 Z";
      body = (
        <>
          <clipPath id={cid}>
            <path d={d} />
          </clipPath>
          <Shadow rx={52} />
          <Steam y={30} />
          <path d={d} fill="#fffdf7" />
          <g clipPath={`url(#${cid})`}>
            <Painted d="M0 98 H200 V158 H0Z" colour={colour.body} patternId={pid} plain={plain} />
            <path d="M0 98 H200 M0 158 H200" stroke="#47131c" strokeOpacity="0.35" strokeWidth="2.5" />
          </g>
          <path d={d} fill="none" {...LINE} />
          <circle cx="100" cy="128" r="15" fill="#fffdf7" {...LINE} strokeWidth="2.5" />
          <circle cx="100" cy="128" r="9" fill={drink.tint} />
          <rect x="40" y="46" width="120" height="18" rx="7" fill="#fffdf7" {...LINE} />
          <path d="M54 46 Q58 32 100 32 Q142 32 146 46Z" fill="#fffdf7" {...LINE} />
          <ellipse cx="118" cy="38" rx="9" ry="3" fill="#47131c" opacity="0.4" />
        </>
      );
      break;
    }
    case "iced":
    default: {
      const d = "M44 58 H156 L142 202 Q100 210 58 202 Z";
      body = (
        <>
          <clipPath id={cid}>
            <path d={d} />
          </clipPath>
          <Shadow rx={56} />
          <rect x="108" y="4" width="13" height="120" rx="5" transform="rotate(10 114 64)" fill={colour.ink} {...LINE} strokeWidth="2" />
          <g clipPath={`url(#${cid})`}>
            <rect x="0" y="74" width="200" height="140" fill={`url(#${gid})`} />
            {isBoba && <Pearls y={192} />}
            {[[56, 70, -12], [92, 64, 8], [126, 74, -4], [70, 102, 14], [110, 106, -10]].map(([x, y, r], i) => (
              <rect key={i} x={x} y={y} width="28" height="26" rx="6" transform={`rotate(${r} ${x + 14} ${y + 13})`} fill="#ffffff" fillOpacity="0.45" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="2" />
            ))}
            <Painted d="M0 136 H200 V166 H0Z" colour={colour.body} patternId={pid} plain={plain} />
            <path d="M0 136 H200 M0 166 H200" stroke="#47131c" strokeOpacity="0.35" strokeWidth="2.5" />
          </g>
          <path d={d} fill="none" {...LINE} />
          <rect x="38" y="50" width="124" height="12" rx="6" fill="#ffffff" fillOpacity="0.75" {...LINE} strokeWidth="2.5" />
          <path d="M56 76 L66 196" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
        </>
      );
    }
  }

  return (
    <svg viewBox="0 0 200 220" className={className} {...a11y}>
      {defs}
      {body}
    </svg>
  );
}
