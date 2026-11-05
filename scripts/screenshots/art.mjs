// Flat illustrations standing in for photos in the demo journal: no real people, no stock images.
const W = 1200
const H = 900

const svg = (body, w = W, h = H) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`

const sky = (stops) =>
  `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sky)"/>`

function ridge(y, amp, freq, phase, color) {
  let d = `M0 ${H} L0 ${y}`
  for (let x = 0; x <= W; x += 30) {
    const t = (x / W) * Math.PI * freq + phase
    d += ` L${x} ${(y + Math.sin(t) * amp + Math.sin(t * 2.3 + 1) * amp * 0.3).toFixed(1)}`
  }
  return `<path d="${d} L${W} ${H} Z" fill="${color}"/>`
}

const glow = (x, y, r, color) => `<circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="${color}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r * 1.4}" fill="${color}" opacity=".28"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`

const pine = (x, y, s, color) => `<path d="M${x} ${y - 120 * s}l${46 * s} ${120 * s}h${-92 * s}z M${x} ${y - 170 * s}l${36 * s} ${90 * s}h${-72 * s}z" fill="${color}"/>`

const boat = (x, y) => `<path d="M${x} ${y}l70-120v120z" fill="#fff4e4"/><path d="M${x - 10} ${y}l-40-84v84z" fill="#ffe0c2"/><path d="M${x - 66} ${y + 8}h150l-26 34h-98z" fill="#5a3548"/>`

function seaStripes(y, color) {
  let out = ''
  for (let i = 0; i < 9; i++) out += `<rect x="${600 - 200 + i * 6 - (i % 2) * 40}" y="${y + 26 + i * 30}" width="${400 - i * 22}" height="9" rx="4" fill="${color}" opacity="${0.75 - i * 0.06}"/>`
  return out
}

export const scenes = {
  sunsetSea: () =>
    svg(`${sky([[0, '#ffcf7d'], [0.42, '#fb9a6c'], [0.62, '#e46b7a']])}${glow(600, 520, 110, '#fff0c4')}
      <rect y="540" width="${W}" height="360" fill="#7a4a86"/><rect y="540" width="${W}" height="120" fill="#a4577f" opacity=".6"/>${seaStripes(540, '#ffd9a0')}${boat(860, 640)}`),

  parisDusk: () => {
    const roofs = [[0, 640, 190], [180, 690, 170], [340, 620, 150], [760, 660, 200], [950, 610, 250]]
    const windows = (x, y) => [0, 1, 2].map((i) => `<rect x="${x + 26 + i * 46}" y="${y + 50}" width="20" height="30" rx="3" fill="#ffd27a"/><rect x="${x + 26 + i * 46}" y="${y + 120}" width="20" height="30" rx="3" fill="#ffd27a" opacity=".7"/>`).join('')
    return svg(`${sky([[0, '#3b3f8f'], [0.5, '#a667a8'], [0.85, '#f7a58a']])}
      <circle cx="210" cy="170" r="52" fill="#fff4d2"/>
      <path d="M600 90l14 150 38 210 60 260h-62l-30-120h-40l-30 120h-62l60-260 38-210z" fill="#2c2552"/><rect x="552" y="470" width="96" height="16" fill="#2c2552"/><rect x="574" y="300" width="52" height="11" fill="#2c2552"/>
      ${roofs.map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${H - y}" fill="#3a2d63"/><path d="M${x - 8} ${y}h${w + 16}l-24-34h${-(w - 32)}z" fill="#2a2149"/>${windows(x, y)}`).join('')}`)
  },

  blossom: () => {
    const flowers = [[120, 120, 90], [250, 70, 70], [60, 240, 70], [370, 130, 60], [190, 210, 76], [1040, 130, 90], [1140, 240, 80], [930, 80, 70], [1010, 230, 64]]
    return svg(`${sky([[0, '#bfe3f2'], [0.7, '#fbe6ea']])}
      <path d="M600 210l340 420H260z" fill="#8fa8cf"/><path d="M600 210l92 114-34 26-34-30-30 30-32-24-34 10z" fill="#fff"/>
      ${ridge(640, 18, 3, 0.4, '#a9c47a')}${ridge(730, 14, 4, 2, '#88ab5c')}
      <g fill="#d94f3d"><rect x="440" y="470" width="30" height="290"/><rect x="730" y="470" width="30" height="290"/><rect x="394" y="500" width="412" height="26"/><path d="M360 438q240 34 480 0l-14 42q-226 26-452 0z"/></g>
      <path d="M0 40q180 80 300 220" stroke="#6b4a3a" stroke-width="16" fill="none"/><path d="M1200 40q-180 80-300 220" stroke="#6b4a3a" stroke-width="16" fill="none"/>
      ${flowers.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? '#f9b9cd' : '#f6a3bd'}"/>`).join('')}`)
  },

  meadow: () => {
    const colors = ['#fff', '#ffd23f', '#f58fa8', '#b89bf2']
    let flowers = ''
    for (let i = 0; i < 70; i++) {
      const x = (i * 197) % W
      const y = 610 + ((i * 71) % 280)
      flowers += `<circle cx="${x}" cy="${y}" r="${9 + (i % 3) * 3}" fill="${colors[i % 4]}"/>`
    }
    const birch = (x) => `<rect x="${x}" y="240" width="30" height="400" fill="#f6f1e4"/><circle cx="${x + 15}" cy="210" r="120" fill="#8fbf5a"/><circle cx="${x - 60}" cy="270" r="84" fill="#7fb04e"/><circle cx="${x + 90}" cy="270" r="84" fill="#9acb63"/>`
    return svg(`${sky([[0, '#8fd3f4'], [0.7, '#e8f7ff']])}${glow(980, 170, 76, '#ffe07a')}
      ${ridge(520, 26, 2, 1, '#a7cf72')}${birch(170)}${birch(820)}${ridge(590, 22, 3, 2.4, '#85b94f')}${flowers}`)
  },

  lake: () =>
    svg(`${sky([[0, '#ffd9b0'], [0.55, '#f6b2a2']])}${glow(820, 260, 70, '#fff3cf')}
      <path d="M0 470l240-230 200 150 170-200 240 230 170-130 180 180v60H0z" fill="#8f89b8"/>
      ${ridge(470, 8, 5, 0, '#4f6d6a')}${[60, 140, 230, 330, 900, 1000, 1110].map((x, i) => pine(x, 510, 0.9 + (i % 3) * 0.2, '#31504d')).join('')}
      <rect y="505" width="${W}" height="395" fill="#7fa6bd"/><rect y="505" width="${W}" height="150" fill="#f3b9a3" opacity=".45"/>${seaStripes(505, '#fff1d6')}`),

  beach: () =>
    svg(`${sky([[0, '#7fd8ea'], [0.5, '#c8f1ef']])}
      <rect y="360" width="${W}" height="240" fill="#2fb7c4"/><rect y="360" width="${W}" height="60" fill="#54cfd6"/>
      <path d="M0 560q300-60 600-20t600-30v390H0z" fill="#fff4dc"/><path d="M0 590q300-60 600-20t600-30v360H0z" fill="#fde3b4"/>
      <path d="M760 720l40-340" stroke="#8a5a3b" stroke-width="12"/><path d="M570 400q230-200 460 0z" fill="#ef7b5b"/><path d="M660 400q140-190 280 0z" fill="#fff"/><path d="M740 400q60-170 120 0z" fill="#ef7b5b"/>
      <rect x="230" y="720" width="250" height="80" rx="12" fill="#ffc233"/><rect x="230" y="745" width="250" height="16" fill="#fff" opacity=".7"/>
      ${glow(190, 130, 66, '#fff6c9')}`),

  cafe: () =>
    svg(`<rect width="${W}" height="${H}" fill="#c98f5c"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect y="${i * 150}" width="${W}" height="4" fill="#a8703f"/>`).join('')}
      <circle cx="380" cy="360" r="190" fill="#fff"/><circle cx="380" cy="360" r="130" fill="#f1ebe0"/><circle cx="380" cy="360" r="100" fill="#6b3e26"/><circle cx="380" cy="360" r="74" fill="#8a5a3a"/><path d="M380 300c30 40-30 80 0 120 30-40-30-80 0-120z" fill="#f4dcbc"/>
      <circle cx="840" cy="560" r="190" fill="#fff"/><circle cx="840" cy="560" r="130" fill="#f1ebe0"/><circle cx="840" cy="560" r="100" fill="#6b3e26"/><circle cx="840" cy="560" r="74" fill="#8a5a3a"/>
      <path d="M700 170q120-90 280 0q-30 110-140 110t-140-110z" fill="#e9a94f"/><path d="M750 160l34 96M820 136l10 134M890 150l-24 112" stroke="#c9832d" stroke-width="12" stroke-linecap="round"/>
      <rect x="150" y="620" width="340" height="210" rx="14" fill="#fbf6ea" transform="rotate(-8 320 720)"/><g transform="rotate(-8 320 720)" fill="#c9bfa9"><rect x="180" y="650" width="280" height="14"/><rect x="180" y="690" width="240" height="10"/><rect x="180" y="716" width="260" height="10"/><rect x="180" y="742" width="210" height="10"/></g>`),

  medina: () => {
    const arch = (x, w, h, color, door) => `<path d="M${x} ${H}v${-h}a${w / 2} ${w / 2} 0 01${w} 0v${h}z" fill="${color}"/><path d="M${x + 34} ${H}v${-h + 30}a${w / 2 - 34} ${w / 2 - 34} 0 01${w - 68} 0v${h - 30}z" fill="${door}"/>`
    return svg(`<rect width="${W}" height="${H}" fill="#e58a5a"/><rect y="0" width="${W}" height="180" fill="#87c7e8"/><path d="M0 180h${W}v50H0z" fill="#d07243"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${i * 160} 180l40-46 40 46z" fill="#d07243"/>`).join('')}
      ${arch(80, 300, 450, '#f2b184', '#1f6f96')}${arch(450, 300, 520, '#f7c9a4', '#7a3b2a')}${arch(820, 300, 450, '#f2b184', '#1f6f96')}
      <circle cx="600" cy="340" r="26" fill="#ffd23f"/><path d="M600 240v74" stroke="#7a3b2a" stroke-width="6"/>`)
  },

  whiteVillage: () => {
    const houses = [[120, 500, 210], [320, 440, 190], [510, 380, 230], [730, 430, 190], [920, 500, 210], [220, 620, 240], [460, 580, 280], [760, 610, 260]]
    return svg(`${sky([[0, '#ffb86b'], [0.5, '#f98a6b'], [0.8, '#d46a8c']])}${glow(250, 230, 84, '#ffe6a6')}
      ${ridge(470, 70, 1.2, 2.6, '#a05a78')}
      ${houses.map(([x, y, w], i) => `<rect x="${x}" y="${y}" width="${w}" height="${H - y}" fill="${i % 2 ? '#fff4e6' : '#ffe9d4'}"/><path d="M${x - 14} ${y}l${w / 2 + 14}-62 ${w / 2 + 14} 62z" fill="#d9663f"/><rect x="${x + w / 2 - 22}" y="${y + 50}" width="44" height="72" rx="22" fill="#2f6f8f"/>`).join('')}`)
  },

  tram: () =>
    svg(`${sky([[0, '#8fd0ee'], [0.8, '#fff0d6']])}
      <rect x="0" y="210" width="430" height="690" fill="#f6c6a0"/><rect x="770" y="170" width="430" height="730" fill="#9fc9d9"/>
      ${[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => `<rect x="${60 + c * 120}" y="${270 + r * 130}" width="60" height="86" rx="6" fill="#fff"/>`).join('')).join('')}
      ${[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => `<rect x="${830 + c * 120}" y="${230 + r * 130}" width="60" height="86" rx="6" fill="#fff"/>`).join('')).join('')}
      <path d="M0 900l1200-120v120z" fill="#8a8580"/><path d="M0 870L1200 750" stroke="#5e5a55" stroke-width="10"/>
      <g transform="rotate(-5.7 600 640)"><rect x="330" y="430" width="540" height="300" rx="34" fill="#ffc233"/><rect x="330" y="610" width="540" height="120" rx="20" fill="#fff4dc"/>${[0, 1, 2, 3].map((i) => `<rect x="${362 + i * 124}" y="470" width="100" height="110" rx="12" fill="#5d8aa8"/>`).join('')}<circle cx="450" cy="745" r="34" fill="#3a3531"/><circle cx="750" cy="745" r="34" fill="#3a3531"/><path d="M600 430V320" stroke="#3a3531" stroke-width="8"/></g>`),

  aurora: () => {
    let stars = ''
    for (let i = 0; i < 60; i++) stars += `<circle cx="${(i * 283) % W}" cy="${(i * 137) % 420}" r="${2 + (i % 3)}" fill="#fff" opacity=".8"/>`
    return svg(`${sky([[0, '#0f1b3d'], [0.7, '#22406e']])}${stars}
      <path d="M0 300q240-180 480-50t420-90 300 60v200q-260-120-440-30t-420 40-340-20z" fill="#52e2a7" opacity=".55"/>
      <path d="M0 380q300-150 560-40t640-120v120q-320 90-560 40t-640 90z" fill="#7cf0c0" opacity=".4"/>
      <path d="M0 240q240-60 520 10t680-90v90q-340 80-600 30t-600 60z" fill="#a07cf0" opacity=".3"/>
      ${ridge(620, 16, 3, 1, '#16294a')}${[90, 220, 340, 800, 930, 1080].map((x, i) => pine(x, 660, 0.9 + (i % 2) * 0.3, '#0c1830')).join('')}<rect y="650" width="${W}" height="250" fill="#dfe9f5"/>`)
  },

  fireworks: () => {
    const burst = (x, y, r, color) => Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2
      return `<path d="M${x + Math.cos(a) * r * 0.25} ${y + Math.sin(a) * r * 0.25}L${x + Math.cos(a) * r} ${y + Math.sin(a) * r}" stroke="${color}" stroke-width="7" stroke-linecap="round"/><circle cx="${x + Math.cos(a) * r * 1.1}" cy="${y + Math.sin(a) * r * 1.1}" r="6" fill="${color}"/>`
    }).join('')
    return svg(`${sky([[0, '#141437'], [0.75, '#3c2a6e']])}${burst(320, 240, 170, '#ffc233')}${burst(830, 180, 140, '#f58fa8')}${burst(620, 380, 110, '#7fe0e8')}
      <path d="M0 640l180-90 120 50 200-150 160 130 180-50 360 140v270H0z" fill="#1d1a44"/><rect y="740" width="${W}" height="160" fill="#2c3a78"/><path d="M0 790q600-90 1200 0v110H0z" fill="#f2d9a8"/>`)
  },
}

const SKIN = { light: '#f6d3bb', warm: '#e9b48f', tan: '#c98a60', deep: '#8d5a3c' }

/** A friendly flat portrait of nobody in particular. */
export function portrait({ bg, skin, hair, top, style }) {
  const s = SKIN[skin]
  const back = {
    long: `<path d="M178 300q0-190 142-190t142 190v230H178z" fill="${hair}"/>`,
    bob: `<path d="M186 280q0-170 134-170t134 170v110H186z" fill="${hair}"/>`,
    curly: [[210, 200, 70], [280, 140, 76], [370, 145, 74], [434, 210, 68], [190, 290, 56], [452, 296, 54]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hair}"/>`).join(''),
    bun: `<circle cx="320" cy="96" r="56" fill="${hair}"/>`,
    short: '',
    beard: '',
  }[style]
  const front = {
    long: `<path d="M214 250q24-92 106-92t106 92q-70-14-106-54-36 40-106 54z" fill="${hair}"/>`,
    bob: `<path d="M210 262q6-110 110-110t110 110q-44-6-74-42-46 40-146 42z" fill="${hair}"/>`,
    curly: `<path d="M216 236q30-80 104-80t104 80q-104-46-208 0z" fill="${hair}"/>`,
    bun: `<path d="M212 250q10-104 108-104t108 104q-108-54-216 0z" fill="${hair}"/>`,
    short: `<path d="M204 262q-6-132 116-132t116 132q-20-52-60-66-84 26-152 6-10 18-20 60z" fill="${hair}"/>`,
    beard: `<path d="M204 262q-6-132 116-132t116 132q-20-52-60-66-84 26-152 6-10 18-20 60z" fill="${hair}"/><path d="M210 300q10 130 110 130t110-130q-16 34-44 38-66-18-132 0-28-4-44-38z" fill="${hair}"/>`,
  }[style]
  return svg(
    `<rect width="640" height="640" fill="${bg}"/>${back}
    <path d="M86 640q10-170 234-170t234 170z" fill="${top}"/>
    <path d="M276 380h88v104q-44 44-88 0z" fill="${s}" opacity=".92"/>
    <ellipse cx="320" cy="288" rx="112" ry="134" fill="${s}"/>
    <ellipse cx="274" cy="292" rx="9" ry="12" fill="#35241a"/><ellipse cx="366" cy="292" rx="9" ry="12" fill="#35241a"/>
    <circle cx="248" cy="326" r="20" fill="#f0765a" opacity=".18"/><circle cx="392" cy="326" r="20" fill="#f0765a" opacity=".18"/>
    ${style === 'beard' ? '' : '<path d="M290 346q30 26 60 0" stroke="#35241a" stroke-width="7" stroke-linecap="round" fill="none"/>'}
    ${front}`,
    640,
    640,
  )
}
