/**
 * Digiko logo: pixel-grid icon + "digi" (white) "ko" (green) wordmark.
 * Icon: green (#b0ff00) square background, 2×2 grid of dark squares.
 *   TL/TR/BL = #080808 solid, BR = #080808 at 30% opacity.
 */

type Props = {
  iconSize?: number;
};

export default function DigikoLogo({ iconSize = 24 }: Props) {
  // Grid math: padding 4px, gap 2px, square = (iconSize - 2*4 - 2) / 2
  const pad = Math.round(iconSize * 0.167); // ~4px at 24
  const gap = Math.round(iconSize * 0.083); // ~2px at 24
  const sq = Math.round((iconSize - pad * 2 - gap) / 2);
  const x2 = pad + sq + gap;
  const fontSize = Math.round(iconSize * 0.75);

  return (
    <span
      className="inline-flex items-center select-none"
      style={{ gap: 10 }}
    >
      {/* Pixel grid icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Green background — sharp corners, no radius */}
        <rect width={iconSize} height={iconSize} fill="#b0ff00" />
        {/* Top-left */}
        <rect x={pad} y={pad} width={sq} height={sq} fill="#080808" />
        {/* Top-right */}
        <rect x={x2} y={pad} width={sq} height={sq} fill="#080808" />
        {/* Bottom-left */}
        <rect x={pad} y={x2} width={sq} height={sq} fill="#080808" />
        {/* Bottom-right — 30% opacity */}
        <rect
          x={x2}
          y={x2}
          width={sq}
          height={sq}
          fill="#080808"
          fillOpacity="0.3"
        />
      </svg>

      {/* Wordmark */}
      <span
        style={{
          fontFamily: "var(--font-geist), system-ui, sans-serif",
          fontWeight: 700,
          letterSpacing: "-1px",
          fontSize,
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#ffffff" }}>digi</span>
        <span style={{ color: "#b0ff00" }}>ko</span>
      </span>
    </span>
  );
}
