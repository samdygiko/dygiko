import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const font = readFileSync(
    join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#080808",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
        }}
      >
        {/* Dygiko pixel grid logo */}
        <div
          style={{
            width: 160,
            height: 160,
            background: "#b0ff00",
            borderRadius: 20,
            position: "relative",
            display: "flex",
          }}
        >
          {/* Top-left square */}
          <div style={{ position: "absolute", top: 25, left: 25, width: 50, height: 50, background: "#080808" }} />
          {/* Top-right square */}
          <div style={{ position: "absolute", top: 25, left: 90, width: 50, height: 50, background: "#080808" }} />
          {/* Bottom-left square */}
          <div style={{ position: "absolute", top: 90, left: 25, width: 50, height: 50, background: "#080808" }} />
          {/* Bottom-right square (30% opacity) */}
          <div style={{ position: "absolute", top: 90, left: 90, width: 50, height: 50, background: "rgba(8,8,8,0.3)" }} />
        </div>

        {/* dygiko.com text */}
        <div
          style={{
            color: "#ffffff",
            fontSize: 56,
            fontFamily: "Geist",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          dygiko.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Geist", data: font, weight: 400 }],
    }
  );
}
