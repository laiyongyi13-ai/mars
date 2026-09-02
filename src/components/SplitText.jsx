import { useEffect, useRef, useState } from "react";

export default function SplitText({ text, as = "span", className = "", delay = 0, stagger = 45 }) {
  const Tag = as;
  const ref = useRef();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setInView(true); io.disconnect(); }
      },
      { threshold: 0.3 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const chars = [...text];
  return (
    <Tag ref={ref} className={`split ${inView ? "in" : ""} ${className}`.trim()} aria-label={text}>
      {chars.map((c, i) => (
        <span
          key={i}
          className="split-char"
          aria-hidden="true"
          style={{ transitionDelay: `${delay + i * stagger}ms` }}
        >
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </Tag>
  );
}
