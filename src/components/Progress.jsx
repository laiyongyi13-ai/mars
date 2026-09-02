import { useEffect, useState } from "react";

/* 四幕导航：火星(俯瞰) → 脚印(降落) → 花朵(走进) → 太阳(仰望) */
const STEPS = [
  { id: "hero", label: "火星", icon: "mars" },
  { id: "about", label: "地表", icon: "foot" },
  { id: "garden", label: "花园", icon: "flower" },
  { id: "contact", label: "太阳", icon: "sun" },
];

function Icon({ type }) {
  if (type === "mars")
    return (
      <svg viewBox="0 0 24 24" width="16" height="16">
        <circle cx="12" cy="12" r="8" fill="currentColor" />
        <circle cx="9" cy="10" r="1.6" fill="rgba(0,0,0,0.28)" />
        <circle cx="15" cy="14" r="1.1" fill="rgba(0,0,0,0.22)" />
      </svg>
    );
  if (type === "foot")
    return (
      <svg viewBox="0 0 24 24" width="16" height="16">
        <ellipse cx="12" cy="15" rx="4.2" ry="5.4" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="12" cy="6" r="1.6" fill="currentColor" />
        <circle cx="15.5" cy="7.5" r="1.5" fill="currentColor" />
      </svg>
    );
  if (type === "flower")
    return (
      <svg viewBox="0 0 24 24" width="16" height="16">
        <g transform="translate(12,12)">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-6" rx="2.4" ry="5" fill="currentColor" transform={`rotate(${r})`} />
          ))}
          <circle cx="0" cy="0" r="2.4" fill="rgba(0,0,0,0.3)" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
        <rect key={r} x="11.2" y="1.5" width="1.6" height="3.4" rx="0.8" fill="currentColor" transform={`rotate(${r} 12 12)`} />
      ))}
    </svg>
  );
}

export default function Progress() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.42;
      let cur = 0;
      STEPS.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && y >= el.offsetTop) cur = i;
      });
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="scene-progress" aria-label="场景进度">
      {STEPS.map((s, i) => (
        <button
          key={s.id}
          className={"sp-dot" + (i === active ? " on" : "") + (i < active ? " past" : "")}
          onClick={() => go(s.id)}
          aria-label={s.label}
          aria-current={i === active}
        >
          <span className="sp-ico"><Icon type={s.icon} /></span>
          <span className="sp-label">{s.label}</span>
        </button>
      ))}
      <span className="sp-rail" aria-hidden="true">
        <span className="sp-rail-fill" style={{ height: `${(active / (STEPS.length - 1)) * 100}%` }} />
      </span>
    </nav>
  );
}
