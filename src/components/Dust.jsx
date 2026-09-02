import { useEffect, useRef } from "react";

const PALETTE = [
  { bg: "rgba(220,0,0,0.5)", glow: "rgba(220,0,0,0.25)" },
  { bg: "rgba(114,180,217,0.5)", glow: "rgba(114,180,217,0.25)" },
  { bg: "rgba(244,168,39,0.5)", glow: "rgba(244,168,39,0.25)" },
];

export default function Dust() {
  const box = useRef();
  useEffect(() => {
    const el = box.current;
    const n = window.innerWidth < 768 ? 10 : 24;
    for (let k = 0; k < n; k++) {
      const s = document.createElement("span");
      const c = PALETTE[k % 3];
      const size = 1.5 + Math.random() * 2;
      s.style.cssText = `
        width:${size}px; height:${size}px;
        background:radial-gradient(circle,${c.bg},transparent);
        box-shadow:0 0 ${size * 2}px ${c.glow};
        left:${Math.random() * 100}vw; bottom:-10px;
        animation-duration:${18 + Math.random() * 20}s;
        animation-delay:${-Math.random() * 25}s;
      `;
      el.appendChild(s);
    }
    return () => { el.innerHTML = ""; };
  }, []);
  return <div className="dust" ref={box} aria-hidden="true" />;
}
