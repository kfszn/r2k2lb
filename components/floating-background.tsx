// Soft, atmospheric "cloudy" backdrop — drifting diffused gradient orbs
// layered behind all page content. Purely decorative and non-interactive.
export default function FloatingBackground() {
  const orbs = [
    {
      className: "h-[42rem] w-[42rem] -top-40 -left-40",
      color: "oklch(0.7 0.15 255 / 0.55)",
      delay: "0s",
    },
    {
      className: "h-[38rem] w-[38rem] top-1/3 -right-52",
      color: "oklch(0.78 0.12 220 / 0.5)",
      delay: "-6s",
    },
    {
      className: "h-[34rem] w-[34rem] top-2/3 left-1/4",
      color: "oklch(0.68 0.16 300 / 0.4)",
      delay: "-12s",
    },
    {
      className: "h-[30rem] w-[30rem] bottom-[-8rem] right-1/4",
      color: "oklch(0.75 0.13 200 / 0.42)",
      delay: "-9s",
    },
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Base gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -10%, oklch(0.26 0.05 265 / 0.9), transparent 60%), radial-gradient(ellipse 90% 70% at 100% 100%, oklch(0.22 0.05 240 / 0.7), transparent 55%)",
        }}
      />

      {/* Drifting cloud orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={`cloud-orb animate-cloud-drift ${orb.className}`}
          style={{ background: orb.color, animationDelay: orb.delay }}
        />
      ))}

      {/* Fine grain/soft top highlight for depth */}
      <div className="absolute inset-0 cloud-vignette" />
    </div>
  )
}
