import { useEffect, useState } from "react";

const STEPS = ["种子正在萌芽...", "根系扎入红土...", "花开了。"];

export default function Loader() {
  const [text, setText] = useState(STEPS[0]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i < STEPS.length) setText(STEPS[i]);
      else clearInterval(timer);
    }, 1000);
    const finish = setTimeout(() => {
      setDone(true);
      document.body.style.overflow = "";
    }, 3200);
    return () => {
      clearInterval(timer);
      clearTimeout(finish);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className={"loader" + (done ? " done" : "")}>
      <div className="loader-stage">
        <svg className="loader-bloom" viewBox="0 0 200 200">
          <line className="lb-stem" x1="100" y1="200" x2="100" y2="110" />
          <path className="lb-leaf lb-leaf-l" d="M100 155 C78 148 68 130 74 115 C90 120 100 138 100 155Z" />
          <path className="lb-leaf lb-leaf-r" d="M100 140 C122 133 132 115 126 100 C110 105 100 123 100 140Z" />
          <g className="lb-petals lb-p-red">
            {[0, 60, 120, 180, 240, 300].map((r) => (
              <ellipse key={r} cx="100" cy="78" rx="10" ry="22" fill="#DC0000" opacity="0.9" transform={`rotate(${r} 100 96)`} />
            ))}
          </g>
          <g className="lb-petals lb-p-blue">
            {[30, 90, 150, 210, 270, 330].map((r) => (
              <ellipse key={r} cx="100" cy="84" rx="6" ry="14" fill="#72B4D9" opacity="0.85" transform={`rotate(${r} 100 96)`} />
            ))}
          </g>
          <circle className="lb-core" cx="100" cy="96" r="8" fill="#F4A827" />
        </svg>
        <p className="loader-text">{text}</p>
      </div>
    </div>
  );
}
