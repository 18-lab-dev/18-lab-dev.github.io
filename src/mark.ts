/*
 * The 18-LAB mark, drawn on a 120-unit grid with a 12-unit stroke. Barlow Condensed 700's stem is
 * 17 units at the logotype size; matching it would close the R14 counter, so the mark stays lighter
 * than the type and relies on colour to hold its weight beside "-LAB".
 * "1": a stem with a 45° flag. "8": two tangent loops (A over B), so the glyph reads as a
 * numeral and as a drafting construction at the same time. Outer extents: x 16–102, y 21–101.
 */

export const MARK = {
  stem: { x: 28, y: 21, w: 12, h: 80 },
  flag: "28,21 16,33 16,49.97 28,37.97",
  flagLeft: 16,
  top: { cx: 76, cy: 41, r: 14 },
  bottom: { cx: 76, cy: 75, r: 20 },
  stroke: 12,
} as const;

const { stem, flag, flagLeft, top, bottom, stroke } = MARK;

/** The mark's solid geometry, in mark units. Callers wrap it in their own `<svg>` or `<g>`. */
export const markGeometry = `
  <rect x="${stem.x}" y="${stem.y}" width="${stem.w}" height="${stem.h}" />
  <polygon points="${flag}" />
  <circle cx="${top.cx}" cy="${top.cy}" r="${top.r}" fill="none" stroke="currentColor" stroke-width="${stroke}" />
  <circle cx="${bottom.cx}" cy="${bottom.cy}" r="${bottom.r}" fill="none" stroke="currentColor" stroke-width="${stroke}" />
`;

export function markSvg(className: string, label = ""): string {
  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
  return `<svg class="${className}" viewBox="0 0 120 120" fill="currentColor" ${a11y}>${markGeometry}</svg>`;
}

/**
 * Logotype: the mark stands in for the "18" of "18-LAB", so the mark and a typed "18" never
 * sit side by side. Text size 113.8 puts Barlow Condensed 700's cap height (0.703 em) at exactly
 * the mark's 80-unit height; the viewBox crops to cap height so CSS `height` sets the cap size.
 */
export const LOGOTYPE_VIEWBOX = { x: 16, y: 21, w: 284, h: 80 } as const;

export function logotypeGroup(markColor: string, dashColor: string, textColor: string): string {
  return `<g style="color:${markColor}" fill="currentColor">${markGeometry}</g>
    <text x="106" y="101" font-family="Barlow Condensed, sans-serif" font-weight="700" font-size="113.8"><tspan style="fill:${dashColor}">-</tspan><tspan style="fill:${textColor}">LAB</tspan></text>`;
}

export function logotypeSvg(className: string): string {
  const { x, y, w, h } = LOGOTYPE_VIEWBOX;
  return `<svg class="${className}" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="18-LAB">${logotypeGroup("var(--accent)", "var(--accent)", "var(--fg)")}</svg>`;
}

/**
 * FIG.01: the mark inside its construction drawing: a graduated instrument ring, crosshairs,
 * loop centres, and dimension callouts. Every stroke carries `pathLength=1` so the page can draw it in.
 */
export function constructionFigure(): string {
  const ticks: string[] = [];
  for (let deg = 0; deg < 360; deg += 3) {
    const major = deg % 30 === 0;
    const mid = deg % 15 === 0;
    const r1 = 232;
    const r2 = major ? 214 : mid ? 221 : 226;
    const rad = ((deg - 90) * Math.PI) / 180;
    const x1 = (Math.cos(rad) * r1).toFixed(2);
    const y1 = (Math.sin(rad) * r1).toFixed(2);
    const x2 = (Math.cos(rad) * r2).toFixed(2);
    const y2 = (Math.sin(rad) * r2).toFixed(2);
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${major ? "tick-major" : "tick"}" />`);
    if (major) {
      const lx = (Math.cos(rad) * 247).toFixed(2);
      const ly = (Math.sin(rad) * 247).toFixed(2);
      ticks.push(
        `<text x="${lx}" y="${ly}" class="fig-label" text-anchor="middle" dominant-baseline="central">${String(deg).padStart(3, "0")}</text>`,
      );
    }
  }

  // Mark placed so its 120-unit box is centred on the origin at 2.2× scale.
  const s = 2.2;
  const ox = -59 * s;
  const oy = -61 * s;
  const at = (x: number, y: number) => [+(ox + x * s).toFixed(2), +(oy + y * s).toFixed(2)] as const;
  const [tcx, tcy] = at(top.cx, top.cy);
  const [bcx, bcy] = at(bottom.cx, bottom.cy);
  const [stemL] = at(stem.x, 0);
  const [stemR] = at(stem.x + stem.w, 0);
  const [, stemTop] = at(0, stem.y);
  const [, stemBottom] = at(0, stem.y + stem.h);
  const [flagX] = at(flagLeft, 0);
  const [loopR] = at(bottom.cx + bottom.r + stroke / 2, 0);

  return `
<svg class="fig" viewBox="-260 -260 520 520" aria-labelledby="fig01-title">
  <title id="fig01-title">FIG.01 — construction drawing of the 18-LAB mark</title>
  <g class="fig-ring">
    <circle r="232" class="hair draw" pathLength="1" style="--d:0" />
    ${ticks.join("")}
  </g>

  <g class="fig-construction">
    <line x1="-250" y1="0" x2="250" y2="0" class="hair dashed fade-in" style="--d:150" />
    <line x1="0" y1="-250" x2="0" y2="250" class="hair dashed fade-in" style="--d:200" />
    <rect x="-150" y="-150" width="300" height="300" class="hair draw" pathLength="1" style="--d:300" />
    <circle r="150" class="hair dashed fade-in" style="--d:350" />
    <line x1="-150" y1="-150" x2="150" y2="150" class="hair faint draw" pathLength="1" style="--d:400" />
    <line x1="150" y1="-150" x2="-150" y2="150" class="hair faint draw" pathLength="1" style="--d:420" />

    <!-- loop construction -->
    <circle cx="${tcx}" cy="${tcy}" r="${top.r * s}" class="hair signal draw" pathLength="1" style="--d:600" />
    <circle cx="${bcx}" cy="${bcy}" r="${bottom.r * s}" class="hair signal draw" pathLength="1" style="--d:680" />
    <line x1="${tcx}" y1="${tcy - 70}" x2="${bcx}" y2="${bcy + 70}" class="hair signal dashed fade-in" style="--d:720" />
    <line x1="${stemL - 40}" y1="${stemTop}" x2="${loopR + 40}" y2="${stemTop}" class="hair faint draw" pathLength="1" style="--d:760" />
    <line x1="${stemL - 40}" y1="${stemBottom}" x2="${loopR + 40}" y2="${stemBottom}" class="hair faint draw" pathLength="1" style="--d:780" />
    <path d="M${tcx - 6} ${tcy} h12 M${tcx} ${tcy - 6} v12 M${bcx - 6} ${bcy} h12 M${bcx} ${bcy - 6} v12" class="hair strong fade-in" style="--d:800" />
  </g>

  <g class="fig-mark fade-in" style="--d:900" transform="translate(${ox} ${oy}) scale(${s})" fill="currentColor">
    ${markGeometry}
  </g>

  <g class="fig-dims fade-in" style="--d:1100">
    <!-- overall height -->
    <path d="M${flagX - 34} ${stemTop} v${stemBottom - stemTop} M${flagX - 40} ${stemTop} h12 M${flagX - 40} ${stemBottom} h12" class="hair strong" />
    <text x="${flagX - 46}" y="${(stemTop + stemBottom) / 2}" class="fig-label" text-anchor="middle" transform="rotate(-90 ${flagX - 46} ${(stemTop + stemBottom) / 2})">H 80</text>
    <!-- stem width -->
    <path d="M${stemL} ${stemBottom + 22} h${stemR - stemL} M${stemL} ${stemBottom + 16} v12 M${stemR} ${stemBottom + 16} v12" class="hair strong" />
    <text x="${(stemL + stemR) / 2}" y="${stemBottom + 40}" class="fig-label" text-anchor="middle">${stem.w}</text>
    <!-- loop radii -->
    <path d="M${tcx} ${tcy} L${tcx + 100} ${tcy - 60} h28" class="hair accent" />
    <text x="${tcx + 132}" y="${tcy - 60}" class="fig-label fig-label--accent" dominant-baseline="central">A · R${top.r}</text>
    <path d="M${bcx} ${bcy} L${bcx + 96} ${bcy + 50} h28" class="hair accent" />
    <text x="${bcx + 128}" y="${bcy + 50}" class="fig-label fig-label--accent" dominant-baseline="central">B · R${bottom.r}</text>
    <text x="${flagX - 8}" y="${stemTop - 14}" class="fig-label">45°</text>
    <text x="-146" y="-160" class="fig-label">GRID 120 · STROKE ${stroke}</text>
    <text x="146" y="166" class="fig-label" text-anchor="end">SCALE 2.2 : 1</text>
  </g>
</svg>`;
}
