const images = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbc220e0-060f-4618-ae77-579c223edb23.jpeg",
    alt: "Candy bomb ornament",
    style: { top: "8%", left: "1%" },
    animationDelay: "0s",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c6e0fef-2f93-4277-9adb-301b820d1071.jpeg",
    alt: "Scatter icon",
    style: { top: "15%", right: "3%" },
    animationDelay: "1.5s",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d3d8b315-83f8-4358-8c72-8e9868d81370.jpeg",
    alt: "Scatter gumball machine",
    style: { top: "42%", left: "2.5%" },
    animationDelay: "2.5s",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ae36954b-0873-4823-8c15-9a13ab731679.jpeg",
    alt: "Egyptian pharaoh raccoon",
    style: { top: "55%", right: "1%" },
    animationDelay: "3.5s",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2bb265cd-ee38-441a-b024-41f39de152a4.jpeg",
    alt: "VS badge",
    style: { bottom: "6%", left: "3%" },
    animationDelay: "4.5s",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/226d10d9-fd86-488b-997a-cb4ad493e368.jpeg",
    alt: "Duel badge",
    style: { bottom: "3%", right: "2%" },
    animationDelay: "6s",
  },
]

// 6 floating icons with staggered positions
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
            className="absolute floating-icon"
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
                width={100}
                height={100}
                className="w-20 h-20 md:w-24 md:h-24 object-contain opacity-30 rounded-xl"
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
