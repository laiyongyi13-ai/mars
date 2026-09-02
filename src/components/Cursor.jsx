import { useEffect, useRef } from "react";

export default function Cursor() {
  const dot = useRef();

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.body.classList.add("has-cursor");

    const MAG = "a, button, .garden-flower, .contact-copy, .tag, .skill";
    const mags = () => Array.from(document.querySelectorAll(".btn, .nav-logo, .contact-copy, .player-toggle"));

    const move = (e) => {
      const mx = e.clientX, my = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      mags().forEach((m) => {
        const r = m.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const radius = Math.max(r.width, r.height) * 0.9 + 30;
        if (dist < radius) m.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
        else m.style.transform = "";
      });
    };
    const over = (e) => { if (e.target.closest(MAG)) document.body.classList.add("cursor-hover"); };
    const out = (e) => { if (e.target.closest(MAG)) document.body.classList.remove("cursor-hover"); };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      document.body.classList.remove("has-cursor", "cursor-hover");
    };
  }, []);

  return <div className="cursor-dot" ref={dot} aria-hidden="true" />;
}
