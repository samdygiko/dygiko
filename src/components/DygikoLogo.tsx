/**
 * Dygiko logo: pixel-grid icon + "dygi" (white) "ko" (green) wordmark.
 * Icon: #b0ff00 square, 2×2 grid — TL/TR/BL solid #080808, BR #080808 @ 30%.
 */

type Props = {
  iconSize?: number;
};

export default function DygikoLogo({ iconSize = 24 }: Props) {
  const pad = Math.round(iconSize * 0.167);
  const gap = Math.round(iconSize * 0.083);
  const sq = Math.round((iconSize - pad * 2 - gap) / 2);
  const x2 = pad + sq + gap;
  const fontSize = Math.round(iconSize * 0.75);

  return (
    <span className="inline-flex items-center select-none" style={{ gap: 10 }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect width={iconSize} height={iconSize} fill="#b0ff00" />
        <rect x={pad} y={pad} width={sq} height={sq} fill="#080808" />
        <rect x={x2} y={pad} width={sq} height={sq} fill="#080808" />
        <rect x={pad} y={x2} width={sq} height={sq} fill="#080808" />
        <rect x={x2} y={x2} width={sq} height={sq} fill="#080808" fillOpacity="0.3" />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-geist), system-ui, sans-serif",
          fontWeight: 700,
          letterSpacing: "-1px",
          fontSize,
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#ffffff" }}>dygi</span>
        <span style={{ color: "#b0ff00" }}>ko</span>
      </span>
    </span>
  );
}
