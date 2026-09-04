import { useEffect, useRef } from "react";

const HOBBIES = [
  { bud: "red", emoji: "🎓", title: "关于我", desc: "学校：华南理工大学\n专业：信息与交互设计\n工作方向：产品、交互、AI、游戏（其实赚钱就行）" },
  { bud: "blue", emoji: "🏀", title: "爱好", desc: "打篮球不咋地，不过是坚持最久的爱好了\n吉他练了一首曲子吃一辈子\n游戏：王者荣耀、金铲铲、火影忍者，PC端游戏受设备限制现在基本不玩" },
  { bud: "orange", emoji: "🎧", title: "音乐", lead: "喜欢的歌手", strong: "华晨宇", desc: "听各种风格的歌：《虚幻与现实》《阿牛》《Colt.45》《独上西楼》《太阳与地球》《BLACKBIRRRD》……" },
  { bud: "red", emoji: "🍵", title: "美食", desc: "喜欢的食物：一切抹茶、普宁肠粉、潮汕牛肉火锅、湿炒牛肉粿、麻薯、双层吉士堡、新疆烤包子、抓饭、刺身、寿司、牛油果、菠萝、榴莲、饺子……完全杂食动物\n绝对不吃：猪肝、臭豆腐" },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
          const f = clamp((vh * 0.95 - r.top) / (vh * 0.32), 0, 1);
          it.style.setProperty("--t", "1");
          it.style.setProperty("--f", f.toFixed(3));
        });
      } else {
        const rect = sec.getBoundingClientRect();
        const total = rect.height - window.innerHeight || 1;
        const p = clamp(-rect.top / total, 0, 1);
        items.forEach((it, i) => {
          // 前段快速散开，其余钉住滚动都用来翻牌；翻牌须在相机解冻(aEnd)前完成
          const t = clamp((p - i * 0.03) / 0.16, 0, 1);
          const f = clamp((p - 0.26 - i * 0.05) / 0.42, 0, 1);
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
                      {h.lead && <p className="hobby-lead">{h.lead}</p>}
                      {h.strong && <p className="hobby-strong">{h.strong}</p>}
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
