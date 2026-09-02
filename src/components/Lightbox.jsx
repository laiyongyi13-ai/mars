import { useEffect, useRef, useState, useCallback } from "react";

const MIN_Z = 1;
const MAX_Z = 4;

export default function Lightbox({ work, onClose }) {
  const scrollRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const drag = useRef({ on: false, sx: 0, sy: 0, sl: 0, st: 0, moved: 0 });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = work ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [work, onClose]);

  /* 打开新作品时重置缩放与滚动 */
  useEffect(() => {
    setZoom(1);
    if (scrollRef.current) { scrollRef.current.scrollTop = 0; scrollRef.current.scrollLeft = 0; }
  }, [work]);

  /* 以焦点为中心缩放，保持鼠标处内容不跑 */
  const zoomAt = useCallback((nextZoom, clientX, clientY) => {
    const el = scrollRef.current;
    if (!el) { setZoom(nextZoom); return; }
    const z = Math.min(MAX_Z, Math.max(MIN_Z, nextZoom));
    setZoom((prev) => {
      const rect = el.getBoundingClientRect();
      const px = clientX == null ? rect.width / 2 : clientX - rect.left;
      const py = clientY == null ? rect.height / 2 : clientY - rect.top;
      const ratio = z / prev;
      requestAnimationFrame(() => {
        el.scrollLeft = (el.scrollLeft + px) * ratio - px;
        el.scrollTop = (el.scrollTop + py) * ratio - py;
      });
      return z;
    });
  }, []);

  const onImgClick = (e) => {
    if (drag.current.moved > 6) return;   // 刚拖动过，不触发缩放
    zoomAt(zoom >= MAX_Z ? MIN_Z : zoom + 1, e.clientX, e.clientY);
  };

  const onWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;   // 普通滚动 = 翻看长图；Ctrl/⌘ + 滚轮 = 缩放
    e.preventDefault();
    zoomAt(zoom + (e.deltaY < 0 ? 0.4 : -0.4), e.clientX, e.clientY);
  };

  /* 放大后按住拖动平移（上下左右） */
  const onPointerDown = (e) => {
    if (zoom <= 1) return;
    const el = scrollRef.current;
    drag.current = { on: true, sx: e.clientX, sy: e.clientY, sl: el.scrollLeft, st: el.scrollTop, moved: 0 };
    el.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current.on) return;
    const el = scrollRef.current;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx) + Math.abs(dy));
    el.scrollLeft = drag.current.sl - dx;
    el.scrollTop = drag.current.st - dy;
  };
  const onPointerUp = (e) => {
    if (!drag.current.on) return;
    drag.current.on = false;
    scrollRef.current?.releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className={"lightbox" + (work ? " open" : "")} aria-hidden={work ? "false" : "true"}>
      <div className="lightbox-backdrop" onClick={onClose}></div>

      {work && (
        <div className="lightbox-toolbar" role="toolbar" aria-label="查看工具">
          <div className="lb-tb-title">
            <span className="lb-tb-name">{work.title}</span>
            {work.sub && <span className="lb-tb-sub">{work.sub}</span>}
          </div>
          <div className="lb-tb-zoom">
            <button aria-label="缩小" onClick={() => zoomAt(zoom - 0.5)}>−</button>
            <span className="lb-tb-scale">{Math.round(zoom * 100)}%</span>
            <button aria-label="放大" onClick={() => zoomAt(zoom + 0.5)}>+</button>
            <button className="lb-tb-reset" aria-label="适应宽度" onClick={() => zoomAt(1)}>适应</button>
          </div>
        </div>
      )}

      <button className="lightbox-close" aria-label="关闭" onClick={onClose}>×</button>

      <div
        className={"lightbox-panel" + (zoom > 1 ? " zoomed" : "")}
        role="dialog"
        aria-modal="true"
        ref={scrollRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {work && (
          <div className="lightbox-body">
            <div className="lb-pages" style={{ width: zoom * 100 + "%" }} onClick={onImgClick}>
              {(work.pages || []).map((src, i) => (
                <img key={i} src={src} alt={`${work.title} ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} decoding="async" draggable={false} />
              ))}
            </div>
            <div className="lb-desc">{work.desc}</div>
          </div>
        )}
      </div>
    </div>
  );
}
