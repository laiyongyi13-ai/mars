import { useEffect } from "react";

/* 视差：为 [data-parallax] 元素按视口位置设置 --py 位移 */
export function useParallax() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-parallax]"));
    if (!els.length) return;
    let raf = 0;
    const apply = () => {
      const vh = window.innerHeight;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const off = (center - vh / 2) / vh;
        const sp = parseFloat(el.dataset.parallax) || 0.2;
        el.style.setProperty("--py", `${off * sp * -140}px`);
      });
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("scroll", onScroll);
    apply();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
}

/* 滚动揭示：为页面内所有 .reveal 元素添加 .in */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );
    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
