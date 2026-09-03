import SplitText from "./SplitText.jsx";

function TitleFlower({ petal, core }) {
  return (
    <svg className="title-flower" viewBox="0 0 28 28">
      <g transform="translate(14,14)">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="0" cy="-5" rx="2.5" ry="5" fill={petal} transform={`rotate(${r})`} />
        ))}
        <circle cx="0" cy="0" r="2.5" fill={core} />
      </g>
    </svg>
  );
}

export default function About() {
  return (
    <section id="about" className="about">
      <div className="section-content">
        <div className="section-head reveal">
          <div className="section-head-text">
            <span className="section-tag">About</span>
            <h2 className="section-title">
              <SplitText text="关于火星居民" />
              <TitleFlower petal="#F4A827" core="#DC0000" />
            </h2>
          </div>
        </div>
        <div className="about-grid">
          <div className="about-copy reveal">
            <p>
              我是 <strong>YY</strong> —— 一名信息与交互设计师，也在慢慢摸索属于自己的 AI 工作流。
              习惯从日常的缝隙里捡拾灵感，让感性负责发芽，理性负责生根。
            </p>
            <p>
              此刻我在<strong>华南理工大学</strong>修读信息与交互设计，
              把好奇心当作种子四处播撒，偶尔也会结出一点小果实
              （比如 2025 CADA 概念设计银奖，还有阮灿华校友奖学金）。
            </p>
          </div>
          <div className="about-mascot-slot reveal" aria-hidden="true"></div>
        </div>
      </div>
      <div className="section-fade-bottom"></div>
    </section>
  );
}
