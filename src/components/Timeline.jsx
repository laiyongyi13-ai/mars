import { useEffect, useRef } from "react";
import SplitText from "./SplitText.jsx";

const ITEMS = [
  { bud: "red", year: "2026.05 — 至今", title: "网易互娱 · 梦幻西游手游", role: "UX 实习生", desc: "解读策划需求文档，完成游戏功能界面交互设计，对接下游开发保障高质量落地；独立主导完成完整功能单交付，并用自研 AI 画板工具反哺模型优化。" },
  { bud: "blue", year: "2026.03 — 2026.05", title: "积微供应链（广州）", role: "AIGC 应用实习生", desc: "用 Codex 搭建电商全流程工作流，覆盖选品、分析、设计、运营；创建 Agent 团队并搭建飞书企业 AI 系统框架，显著提升协同效率。" },
  { bud: "orange", year: "2026.01 — 2026.02", title: "广东省人机交互设计工程技术研究中心", role: "用户研究实习生", desc: "负责智能穿戴设备佩戴体验的主观评分数据采集，优化测试方案使效率提升 20%；完成 60 余例头部与手部三维扫描记录。" },
  { bud: "red", year: "2025.06 — 2026.01", title: "井号科技（广州）", role: "产品实习生", desc: "负责核心 UI 视觉设计，交付含组件的交互视觉规范使开发效率提升 30%；深度调研头部竞品，定位 10+ 体验痛点，推动 Bug 修复率达 95%。" },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function TitleFlower() {
  return (
    <svg className="title-flower" viewBox="0 0 28 28">
      <g transform="translate(14,14)">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="0" cy="-5" rx="2.5" ry="5" fill="#72B4D9" transform={`rotate(${r})`} />
        ))}
        <circle cx="0" cy="0" r="2.5" fill="#F4A827" />
      </g>
    </svg>
  );
}

export default function Timeline() {
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
    <section id="timeline" className="timeline" ref={sectionRef}>
      <div className="section-content">
        <div className="section-head reveal">
          <div className="section-head-text">
            <span className="section-tag">Timeline</span>
            <h2 className="section-title">
              <SplitText text="轨道 · 经历" />
              <TitleFlower />
            </h2>
          </div>
        </div>
        <div className="timeline-wrap">
          <ul className="timeline-list" ref={listRef}>
            {ITEMS.map((it, i) => (
              <li className="timeline-item" key={i}>
                <div className="tarot">
                  <div className="tarot-inner">
                    <div className={`tarot-back bud-face-${it.bud}`} aria-hidden="true">
                      <span className="tarot-emblem">✦</span>
                      <span className="tarot-no">{String(ITEMS.length - i).padStart(2, "0")}</span>
                    </div>
                    <div className="tl-card tarot-front">
                      <span className="tl-year">{it.year}</span>
                      <h3>{it.title}</h3>
                      <p className="tl-role">{it.role}</p>
                      <p>{it.desc}</p>
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
