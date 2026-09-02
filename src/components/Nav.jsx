import { useEffect, useRef, useState } from "react";

const LINKS = [
  { target: "about", label: "关于" },
  { target: "timeline", label: "轨道" },
  { target: "garden", label: "花园" },
  { target: "contact", label: "联系" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const navRef = useRef();

  useEffect(() => {
    const ids = LINKS.map((l) => l.target);
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      let cur = "";
      ids.forEach((id) => {
        const sec = document.getElementById(id);
        if (sec && window.scrollY >= sec.offsetTop - 250) cur = id;
      });
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"nav" + (scrolled ? " scrolled" : "")} id="nav" ref={navRef}>
      <a href="#hero" className="nav-logo" aria-label="Mars Garden">
        <svg className="logo-flower" viewBox="0 0 32 32" width="28" height="28">
          <g transform="translate(16,16)">
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse key={r} cx="0" cy="-6" rx="3" ry="6" fill="#DC0000" transform={`rotate(${r})`} />
            ))}
            <circle cx="0" cy="0" r="3" fill="#72B4D9" />
          </g>
        </svg>
        <span className="logo-text">Mars<i>Garden</i></span>
      </a>
      <nav className={"nav-links" + (open ? " open" : "")}>
        {LINKS.map((l) => (
          <a
            key={l.target}
            href={`#${l.target}`}
            data-target={l.target}
            className={active === l.target ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <button className="nav-toggle" aria-label="菜单" onClick={() => setOpen((o) => !o)}>
        <span></span><span></span><span></span>
      </button>
    </header>
  );
}
