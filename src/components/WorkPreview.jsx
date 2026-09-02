import { useEffect, useRef, useState } from "react";

export default function WorkPreview({ work }) {
  const el = useRef(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      pos.current.tx = e.clientX;
      pos.current.ty = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    let raf;
    const loop = () => {
      const p = pos.current;
      p.x += (p.tx - p.x) * 0.16;
      p.y += (p.ty - p.y) * 0.16;
      if (el.current) {
        el.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (work) {
      pos.current.x = pos.current.tx;
      pos.current.y = pos.current.ty;
      setShown(true);
    } else {
      setShown(false);
    }
  }, [work]);

  return (
    <div ref={el} className="work-preview-follow" aria-hidden="true">
      <div className={"work-preview" + (shown ? " on" : "")}>
        {work && (
          <>
            <div className="wp-frame">
              <img src={work.cover} alt="" />
            </div>
            <div className="wp-meta">
              <span className="wp-title">{work.title}</span>
              <span className="wp-sub">{work.sub}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
