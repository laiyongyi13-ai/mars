import SplitText from "./SplitText.jsx";

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

export default function Garden() {
  return (
    <section id="garden" className="garden">
      <div className="section-content">
        <div className="section-head reveal">
          <div className="section-head-text">
            <span className="section-tag">Portfolio</span>
            <h2 className="section-title">
              <SplitText text="花园" />
              <TitleFlower />
            </h2>
          </div>
          <p className="section-desc">脚下就是这片火星花园。<br />点击发光的花，展开对应作品。</p>
        </div>
        <div className="garden-hint reveal" aria-hidden="true">
          <span>点击花田中发光的花朵 ✦</span>
        </div>
      </div>
      <div className="section-fade-bottom"></div>
    </section>
  );
}
