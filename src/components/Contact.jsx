import { useEffect, useRef } from "react";
import HanziWriter from "hanzi-writer";

const CHARS = ["向", "阳", "而", "生"];

function copyText(btn) {
  const text = btn.dataset.copy;
  const ok = () => {
    btn.classList.add("copied");
    setTimeout(() => btn.classList.remove("copied"), 1800);
  };
  navigator.clipboard.writeText(text).then(ok).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    ok();
  });
}

export default function Contact() {
  const artRef = useRef();

  useEffect(() => {
    const art = artRef.current;
    const chars = Array.from(art.querySelectorAll(".ca-char"));
    let started = false;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || started) return;
          started = true;
          io.disconnect();
          const s = Math.max(52, Math.min(window.innerWidth * 0.16, 180));
          const writers = chars.map((el) => {
            el.innerHTML = "";
            return HanziWriter.create(el, el.dataset.char, {
              width: s, height: s, padding: 2,
              showOutline: false,
              showCharacter: false,
              strokeColor: "#fff2e6",
              strokeAnimationSpeed: 2.4,
              delayBetweenStrokes: 30,
            });
          });
          (function writeNext(i) {
            if (i >= writers.length) return;
            writers[i].animateCharacter({ onComplete: () => writeNext(i + 1) });
          })(0);
        });
      },
      { threshold: 0.45 }
    );
    io.observe(art);
    return () => io.disconnect();
  }, []);

  return (
    <section id="contact" className="contact">
      <div className="contact-wrap">
        <p className="contact-tag reveal">CONTACT — 期待与你的星球产生引力</p>
        <div className="contact-hero reveal">
          <div className="contact-glow" aria-hidden="true"></div>
          <div className="contact-art" ref={artRef} aria-label="向阳而生">
            {CHARS.map((c) => (
              <div className="ca-char" data-char={c} key={c}></div>
            ))}
          </div>
        </div>
        <div className="contact-links reveal">
          <button className="contact-copy" data-copy="y2549600635" onClick={(e) => copyText(e.currentTarget)}>
            <span className="cc-label">WeChat</span>
            <span className="cc-value">y2549600635</span>
            <span className="cc-toast">已复制 ✓</span>
          </button>
          <button className="contact-copy" data-copy="2549600635@qq.com" onClick={(e) => copyText(e.currentTarget)}>
            <span className="cc-label">Email</span>
            <span className="cc-value">2549600635@qq.com</span>
            <span className="cc-toast">已复制 ✓</span>
          </button>
        </div>
      </div>
      <footer className="footer">
        <p className="footer-poem">「在荒芜中种花，是宇宙级的浪漫。」</p>
        <p className="footer-copy">© 2026 YY · Mars Garden — 火星花园</p>
      </footer>
    </section>
  );
}
