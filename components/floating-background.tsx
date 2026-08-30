// Calm, soft ambient backdrop — a couple of very subtle static color washes
// behind all page content. Purely decorative and non-interactive.
export default function FloatingBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Base gentle top-down wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 70% at 50% -15%, oklch(0.22 0.04 265 / 0.8), transparent 60%)",
        }}
      />

      {/* Two faint ambient color pools for soft depth */}
      <div
        className="cloud-orb h-[40rem] w-[40rem] -top-52 -left-40"
        style={{ background: "oklch(0.7 0.15 255)" }}
      />
      <div
        className="cloud-orb h-[36rem] w-[36rem] bottom-[-12rem] -right-40"
        style={{ background: "oklch(0.78 0.12 220)" }}
      />

      {/* Soft top highlight for depth */}
      <div className="absolute inset-0 cloud-vignette" />
    </div>
  )
}
