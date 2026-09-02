import cover1 from "../../assets/works/1-cover.webp";
import cover2 from "../../assets/works/2-cover.webp";
import cover3 from "../../assets/works/3-cover.webp";
import cover4 from "../../assets/works/4-cover.webp";

/* 各作品的详情页（从 作品集0825.pdf 渲染，见 tools/render_pages.py；再经 tools/optimize_images.py 转 WebP） */
const pageModules = import.meta.glob("../../assets/works/pages/*/p*.webp", {
  eager: true,
  import: "default",
});
function pagesOf(n) {
  return Object.entries(pageModules)
    .filter(([p]) => p.includes(`/pages/${n}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, url]) => url);
}

export const WORKS = [
  {
    title: "Canine Woo",
    sub: "宠物犬口腔健康监测",
    type: "red",
    cover: cover1,
    pages: pagesOf(1),
    desc: "一款针对城市养犬人群，以磨牙玩具为载体的口腔情况监测产品。",
    stemH: 130,
  },
  {
    title: "UP智汇",
    sub: "校园求职招聘平台",
    type: "blue",
    cover: cover2,
    pages: pagesOf(2),
    desc: "重新连接求职、招聘与校友关系的交互设计方案。",
    stemH: 160,
  },
  {
    title: "魔法觉醒",
    sub: "游戏体验分析 · AI辅助",
    type: "orange",
    cover: cover3,
    pages: pagesOf(3),
    desc: "AI辅助拆解《哈利波特：魔法觉醒》的用户分层与体验设计。",
    stemH: 110,
  },
  {
    title: "其他",
    sub: "ParkPaw / 视觉设计 / 手绘",
    type: "red",
    cover: cover4,
    pages: pagesOf(4),
    desc: "更多设计探索：服务设计、视觉海报、手绘等。",
    stemH: 145,
  },
];

export const GLOW = {
  red: "rgba(220,0,0,0.5)",
  blue: "rgba(114,180,217,0.5)",
  orange: "rgba(244,168,39,0.5)",
};

export function flowerSVG(type) {
  const map = {
    red: { petal: "#DC0000", core: "#72B4D9" },
    blue: { petal: "#72B4D9", core: "#F4A827" },
    orange: { petal: "#F4A827", core: "#DC0000" },
  };
  const c = map[type];
  let petals = "";
  for (let i = 0; i < 6; i++) {
    petals += `<ellipse cx="0" cy="-14" rx="7" ry="14" fill="${c.petal}" opacity="0.9" transform="rotate(${i * 60})"/>`;
  }
  return `<svg viewBox="0 0 80 80" class="gf-head-svg"><g transform="translate(40,40)">${petals}<circle cx="0" cy="0" r="7" fill="${c.core}"/></g></svg>`;
}
