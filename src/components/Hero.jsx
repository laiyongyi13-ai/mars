function HeroFlower({ cls, petal, core }) {
  return (
    <svg className={`hero-flower ${cls}`} viewBox="0 0 80 80">
      <g transform="translate(40,40)">
        {[0, 60, 120, 180, 240, 300].map((r) => (
          <ellipse key={r} cx="0" cy="-12" rx="6" ry="12" fill={petal} transform={`rotate(${r})`} />
        ))}
        <circle cx="0" cy="0" r="6" fill={core} />
      </g>
    </svg>
  );
}

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero-inner">
        <div className="hero-text reveal">
          <p className="hero-eyebrow">Mars Garden · 火星花园</p>
          <h1 className="hero-title">
            这里的鲜花<br />
            <span className="title-glow">不会枯萎。</span>
          </h1>
          <p className="hero-sub">
            这里是 <strong>YY</strong> 的火星花园。<br />
            正在努力栽培与打理中。
          </p>
          <a href="#about" className="btn btn-primary hero-cta">登录火星 ↓</a>
        </div>
        <div className="hero-deco reveal" aria-hidden="true">
          <HeroFlower cls="hf-1" petal="#DC0000" core="#72B4D9" />
          <HeroFlower cls="hf-2" petal="#72B4D9" core="#F4A827" />
          <HeroFlower cls="hf-3" petal="#F4A827" core="#DC0000" />
        </div>
      </div>
      <div className="scroll-hint" aria-hidden="true"><span></span></div>
      <div className="section-fade-bottom"></div>
    </section>
  );
}
