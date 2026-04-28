const images = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbc220e0-060f-4618-ae77-579c223edb23.jpeg",
    alt: "Candy bomb ornament",
    position: "left-4",
    style: { top: "33%" },
    animationDelay: "0s",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c6e0fef-2f93-4277-9adb-301b820d1071.jpeg",
    alt: "Scatter icon",
    position: "right-4",
    style: { top: "33%" },
    animationDelay: "1.5s",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2bb265cd-ee38-441a-b024-41f39de152a4.jpeg",
    alt: "VS badge",
    position: "bottom-4 left-4",
    style: {},
    animationDelay: "3s",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/226d10d9-fd86-488b-997a-cb4ad493e368.jpeg",
    alt: "Duel badge",
    position: "bottom-4 right-4",
    style: {},
    animationDelay: "4.5s",
  },
]

export default function FloatingBackground() {
  return (
    <>
      <style>{`
        @keyframes floatBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-14px) rotate(2deg); }
          66%       { transform: translateY(-6px) rotate(-2deg); }
        }
        .floating-icon {
          animation: floatBob 7s ease-in-out infinite;
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {images.map((img) => (
          <div
            key={img.alt}
            className={`absolute ${img.position} floating-icon`}
            style={{ animationDelay: img.animationDelay, ...img.style }}
          >
            <div
              className="rounded-full"
              style={{
                filter:
                  "drop-shadow(0 0 18px rgba(56,189,248,0.75)) drop-shadow(0 0 40px rgba(56,189,248,0.45))",
              }}
            >
              <img
                src={img.src}
                alt={img.alt}
                width={140}
                height={140}
                className="w-28 h-28 md:w-36 md:h-36 object-contain opacity-30 rounded-xl"
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
