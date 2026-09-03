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
              哈喽啊，我是 <strong>YY</strong>，一个正为找工作发愁的大四学生。
              地球工作难找啊，我还是回家种花吧。
            </p>
            <p>
              本质 i 人，不知道为什么测试出来是 e 人<br />
              爱运动但却浑身病的玻璃人<br />
              审美犹如一张厕纸却读了设计相关专业<br />
              总而言之是个充满矛盾的人
            </p>
          </div>
          <div className="about-mascot-slot reveal" aria-hidden="true"></div>
        </div>
      </div>
      <div className="section-fade-bottom"></div>
    </section>
  );
}
