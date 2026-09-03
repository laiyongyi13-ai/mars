import { useEffect, useRef } from "react";
import SplitText from "./SplitText.jsx";

const HOBBIES = [
  { bud: "red", emoji: "📷", title: "摄影", desc: "喜欢用镜头捕捉日常的缝隙，光影、街角与不经意的瞬间，都是灵感的种子。" },
  { bud: "blue", emoji: "🎬", title: "电影", desc: "在别人的故事里体验千百种人生，好电影会在心里留下长长的余味。" },
  { bud: "orange", emoji: "🎧", title: "音乐", desc: "华晨宇的歌单常伴左右，工作与发呆时都要有旋律陪着才踏实。" },
  { bud: "red", emoji: "✈️", title: "旅行", desc: "对世界永远保持好奇，走出去看看不同的风景，再把它们种回心里。" },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function TitleFlower() {
  return (
    <svg className="title-flower" viewBox="0 0 28 28">
      <g transform="translate(14,14)">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="0" cy="-5" rx="2.5" ry="5" fill="#DC0000" transform={`rotate(${r})`} />
        ))}
        <circle cx="0" cy="0" r="2.5" fill="#72B4D9" />
      </g>
    </svg>
  );
}

export default function Hobbies() {
  const listRef = useRef();
  const sectionRef = useRef();

  useEffect(() => {
    const sec = sectionRef.current;
    const list = listRef.current;
    if (!sec || !list) return;
    const items = Array.from(list.children);
    const mq = window.matchMedia("(max-width: 767px)");
    let raf = 0;

    const apply = () => {
      raf = 0;
      if (mq.matches) {
        const vh = window.innerHeight;
        items.forEach((it) => {
          const r = it.getBoundingClientRect();
          const f = clamp((vh * 0.82 - r.top) / (vh * 0.3), 0, 1);
          it.style.setProperty("--t", "1");
          it.style.setProperty("--f", f.toFixed(3));
        });
      } else {
        const rect = sec.getBoundingClientRect();
        const total = rect.height - window.innerHeight || 1;
        const p = clamp(-rect.top / total, 0, 1);
        items.forEach((it, i) => {
          const t = clamp((p - 0.05 - i * 0.02) / 0.24, 0, 1);
          const f = clamp((p - 0.42 - i * 0.06) / 0.2, 0, 1);
          it.style.setProperty("--t", t.toFixed(3));
          it.style.setProperty("--f", f.toFixed(3));
        });
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="hobbies" className="hobbies" ref={sectionRef}>
      <div className="section-content">
        <div className="section-head reveal">
          <div className="section-head-text">
            <span className="section-tag">Hobbies</span>
            <h2 className="section-title">
              <SplitText text="爱好 · 牌面" />
              <TitleFlower />
            </h2>
          </div>
          <p className="section-desc">往下滑，翻开每一张牌，<br />看看牌面下藏着的小小热爱。</p>
        </div>
        <div className="hobbies-wrap">
          <ul className="hobby-list" ref={listRef}>
            {HOBBIES.map((h, i) => (
              <li className="hobby-item" key={i}>
                <div className="tarot">
                  <div className="tarot-inner">
                    <div className={`tarot-back bud-face-${h.bud}`} aria-hidden="true">
                      <span className="tarot-emblem">✦</span>
                      <span className="tarot-no">{String(HOBBIES.length - i).padStart(2, "0")}</span>
                    </div>
                    <div className="hobby-card tarot-front">
                      <span className="hobby-emoji">{h.emoji}</span>
                      <h3>{h.title}</h3>
                      <p>{h.desc}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="section-fade-bottom"></div>
    </section>
  );
}
