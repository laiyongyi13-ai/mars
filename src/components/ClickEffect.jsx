import { useEffect, useRef, useState } from "react";

/* 点击效果 — sniper：四向准星线射出 + 八向粒子放射（纯 CSS 动画，无依赖） */
let uid = 0;
const SPOKES = [0, 90, 180, 270];
const DOTS = [30, 75, 120, 165, 210, 255, 300, 345];

export default function ClickEffect() {
  const [effects, setEffects] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onClick = (e) => {
      const id = ++uid;
      setEffects((p) => [...p, { id, x: e.clientX, y: e.clientY }]);
      const t = setTimeout(() => {
        setEffects((p) => p.filter((f) => f.id !== id));
      }, 700);
      timers.current.push(t);
    };
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="click-fx" aria-hidden="true">
      {effects.map((f) => (
        <span key={f.id} className="cfx" style={{ left: f.x, top: f.y }}>
          <i className="cfx-ring" />
          {SPOKES.map((a) => (
            <i key={"s" + a} className="cfx-spoke" style={{ "--a": `${a}deg` }} />
          ))}
          {DOTS.map((a) => (
            <i key={"d" + a} className="cfx-dot" style={{ "--a": `${a}deg` }} />
          ))}
        </span>
      ))}
    </div>
  );
}
