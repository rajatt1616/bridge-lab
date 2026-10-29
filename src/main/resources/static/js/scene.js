const SCENE = {
  gridSize: 50,
  waterline: 0.62,
  colors: {
    skyTop: '#2b2148',
    skyMid: '#43326b',
    skyHorizon: '#6b4f9e',
    skyHaze: '#8a6fbf',
    cloud: '#f5f0ff',
    cloudShade: '#d2c6ea',
    hillFar: '#a7d98b',
    hillNear: '#8cc96f',
    hillMain: '#79c452',
    hillLight: '#93dc66',
    hillShade: '#5aa63a',
    hillDeep: '#47882c',
    treeDark: '#4a8a39',
    treeMid: '#63aa4a',
    treeLight: '#86cf60',
    trunk: '#7a5537',
    rockBase: '#5b5054',
    rockLight: '#786765',
    rockMedium: '#6b5a5b',
    rockDark: '#453c46',
    rockWarm: '#8a756a',
    rockOutline: '#332c38',
    waterTop: '#a7e9f1',
    waterMid: '#6fd0e2',
    waterDeep: '#3faacb',
    gridMinor: 'rgba(28,44,66,0.07)',
    gridMajor: 'rgba(28,44,66,0.13)',
    beamDefault: '#d93838',
    beamTension: '#3b82f6',
    beamCompression: '#e5484b',
    beamOverload: '#f5a623',
    beamSafe: '#5b5d6e',
    beamOutline: '#2a1f33',
    beamShadow: 'rgba(20,14,30,0.28)',
    supportPinned: '#4caf6a',
    supportRoller: '#4caf6a',
    supportOutline: '#20352a',
    loadArrow: '#ff7a59',
    loadOutline: '#3a2330',
    anchor: '#d93838',
    anchorDark: '#7f202b',
    anchorRing: '#f3e7ee',
    jointFace: '#f3ece2',
    jointOuter: '#2a1f33',
    jointShadow: 'rgba(20,14,30,0.25)',
    carWindow: '#f5efe3',
    carLight: '#ffd166',
    text: '#f5f0fa',
    textMuted: '#c3b5d6',
    labelPanel: 'rgba(28,20,42,0.78)',
    labelBorder: 'rgba(255,255,255,0.15)',
    labelHalo: 'rgba(33,24,45,0.72)',
    legendPanel: 'rgba(24,18,38,0.76)',
  },
  camera: { x: 0, y: 0, zoom: 1 },
};

function drawTerrain(ctx, w, h) {
  const waterLine = h * SCENE.waterline;
  drawSky(ctx, w, h);
  drawClouds(ctx, w, h);
  drawDistantHills(ctx, w, h, waterLine);
  drawWater(ctx, w, h, waterLine);
  drawBank(ctx, w, h, 'left');
  drawBank(ctx, w, h, 'right');
  drawShoreRocks(ctx, w, h);
}

function drawSky(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  grad.addColorStop(0, SCENE.colors.skyTop);
  grad.addColorStop(0.46, SCENE.colors.skyMid);
  grad.addColorStop(0.82, SCENE.colors.skyHorizon);
  grad.addColorStop(1, SCENE.colors.skyHaze);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawClouds(ctx, w, h) {
  const clouds = [
    { x: w * 0.14, y: h * 0.14, scale: 1.05, alpha: 0.95 },
    { x: w * 0.43, y: h * 0.08, scale: 0.62, alpha: 0.8 },
    { x: w * 0.70, y: h * 0.16, scale: 0.95, alpha: 0.9 },
    { x: w * 0.86, y: h * 0.09, scale: 0.55, alpha: 0.72 },
  ];
  for (const cloud of clouds) {
    drawCloud(ctx, cloud.x, cloud.y, cloud.scale, cloud.alpha);
  }
}

function drawCloud(ctx, cx, cy, scale, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const cloudPath = () => {
    ctx.beginPath();
    ctx.moveTo(cx - 62 * scale, cy + 16 * scale);
    ctx.bezierCurveTo(cx - 80 * scale, cy + 2 * scale, cx - 60 * scale, cy - 20 * scale, cx - 38 * scale, cy - 12 * scale);
    ctx.bezierCurveTo(cx - 30 * scale, cy - 36 * scale, cx + 8 * scale, cy - 39 * scale, cx + 24 * scale, cy - 17 * scale);
    ctx.bezierCurveTo(cx + 45 * scale, cy - 31 * scale, cx + 73 * scale, cy - 11 * scale, cx + 64 * scale, cy + 16 * scale);
    ctx.closePath();
  };

  ctx.fillStyle = SCENE.colors.cloudShade;
  cloudPath();
  ctx.fill();

  ctx.translate(0, -3 * scale);
  ctx.fillStyle = SCENE.colors.cloud;
  cloudPath();
  ctx.fill();

  ctx.restore();
}

function drawDistantHills(ctx, w, h, waterLine) {
  ctx.save();

  ctx.fillStyle = SCENE.colors.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, waterLine);
  ctx.bezierCurveTo(w * 0.08, h * 0.5, w * 0.16, h * 0.47, w * 0.25, waterLine);
  ctx.bezierCurveTo(w * 0.35, h * 0.49, w * 0.46, h * 0.45, w * 0.56, waterLine);
  ctx.bezierCurveTo(w * 0.67, h * 0.48, w * 0.78, h * 0.46, w * 0.87, waterLine);
  ctx.bezierCurveTo(w * 0.93, h * 0.51, w * 0.98, h * 0.52, w, waterLine);
  ctx.lineTo(w, waterLine + 40);
  ctx.lineTo(0, waterLine + 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, waterLine);
  ctx.bezierCurveTo(w * 0.1, h * 0.55, w * 0.2, h * 0.53, w * 0.31, waterLine);
  ctx.bezierCurveTo(w * 0.43, h * 0.54, w * 0.53, h * 0.51, w * 0.64, waterLine);
  ctx.bezierCurveTo(w * 0.76, h * 0.54, w * 0.86, h * 0.52, w, waterLine);
  ctx.lineTo(w, waterLine + 40);
  ctx.lineTo(0, waterLine + 40);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawWater(ctx, w, h, waterLine) {
  const waterHeight = h - waterLine;
  const grad = ctx.createLinearGradient(0, waterLine, 0, h);
  grad.addColorStop(0, SCENE.colors.waterTop);
  grad.addColorStop(0.4, SCENE.colors.waterMid);
  grad.addColorStop(1, SCENE.colors.waterDeep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, waterLine, w, waterHeight);

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.moveTo(0, waterLine + waterHeight * 0.06);
  ctx.bezierCurveTo(w * 0.24, waterLine + waterHeight * 0.01, w * 0.56, waterLine + waterHeight * 0.12, w, waterLine + waterHeight * 0.04);
  ctx.lineTo(w, waterLine + waterHeight * 0.24);
  ctx.bezierCurveTo(w * 0.62, waterLine + waterHeight * 0.32, w * 0.3, waterLine + waterHeight * 0.17, 0, waterLine + waterHeight * 0.28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(31,141,177,0.16)';
  ctx.beginPath();
  ctx.moveTo(0, waterLine + waterHeight * 0.52);
  ctx.bezierCurveTo(w * 0.3, waterLine + waterHeight * 0.47, w * 0.62, waterLine + waterHeight * 0.58, w, waterLine + waterHeight * 0.5);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(18,125,166,0.18)';
  ctx.beginPath();
  ctx.moveTo(0, waterLine + waterHeight * 0.8);
  ctx.bezierCurveTo(w * 0.32, waterLine + waterHeight * 0.74, w * 0.7, waterLine + waterHeight * 0.86, w, waterLine + waterHeight * 0.8);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.46)';
  ctx.lineWidth = 2;
  const glints = [
    [0.26, 0.1, 0.06], [0.48, 0.07, 0.05], [0.66, 0.12, 0.04],
    [0.34, 0.24, 0.05], [0.58, 0.22, 0.07], [0.74, 0.28, 0.035],
    [0.22, 0.42, 0.045], [0.42, 0.38, 0.065], [0.63, 0.46, 0.05],
    [0.3, 0.62, 0.08], [0.52, 0.58, 0.05], [0.72, 0.66, 0.06],
  ];
  for (const [x, y, length] of glints) {
    const gx = w * x;
    const gy = waterLine + waterHeight * y;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + w * length * 0.5, gy - 2, gx + w * length, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    const y = waterLine + waterHeight * (0.16 + i * 0.12);
    ctx.beginPath();
    ctx.moveTo(w * (0.24 + (i % 3) * 0.03), y);
    ctx.bezierCurveTo(w * 0.38, y - 3, w * 0.58, y + 3, w * (0.7 + (i % 2) * 0.04), y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBank(ctx, w, h, side) {
  const waterLine = h * SCENE.waterline;
  ctx.save();
  if (side === 'right') {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }

  ctx.fillStyle = SCENE.colors.hillMain;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.3);
  ctx.bezierCurveTo(w * 0.03, h * 0.24, w * 0.1, h * 0.25, w * 0.15, h * 0.33);
  ctx.bezierCurveTo(w * 0.2, h * 0.4, w * 0.235, h * 0.5, w * 0.225, waterLine);
  ctx.lineTo(0, waterLine);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.hillShade;
  ctx.beginPath();
  ctx.moveTo(w * 0.095, h * 0.3);
  ctx.bezierCurveTo(w * 0.16, h * 0.37, w * 0.21, h * 0.47, w * 0.225, waterLine);
  ctx.lineTo(0, waterLine);
  ctx.lineTo(0, h * 0.44);
  ctx.bezierCurveTo(w * 0.04, h * 0.37, w * 0.08, h * 0.34, w * 0.095, h * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.hillLight;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.3);
  ctx.bezierCurveTo(w * 0.03, h * 0.24, w * 0.1, h * 0.25, w * 0.15, h * 0.33);
  ctx.bezierCurveTo(w * 0.1, h * 0.33, w * 0.04, h * 0.31, 0, h * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.hillDeep;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.55);
  ctx.bezierCurveTo(w * 0.08, h * 0.52, w * 0.16, h * 0.55, w * 0.225, waterLine);
  ctx.lineTo(0, waterLine);
  ctx.closePath();
  ctx.fill();

  drawRockBluff(ctx, w, h);
  drawTree(ctx, w * 0.055, h * 0.305, 0.95);
  drawBush(ctx, w * 0.1, h * 0.39, 0.8);
  drawBush(ctx, w * 0.19, h * 0.52, 0.6);

  ctx.restore();
}

function drawRockBluff(ctx, w, h) {
  ctx.fillStyle = 'rgba(18,94,124,0.18)';
  ctx.beginPath();
  ctx.ellipse(w * 0.19, h * 0.86, w * 0.06, h * 0.024, 0, 0, Math.PI * 2);
  ctx.fill();

  const rock = [
    [0, 0.52], [0.055, 0.49], [0.11, 0.52], [0.165, 0.56],
    [0.205, 0.62], [0.235, 0.69], [0.225, 0.78], [0.205, 0.87],
    [0.17, 0.92], [0.13, 0.95], [0.08, 0.91], [0.04, 0.88], [0, 0.9],
  ];
  ctx.fillStyle = SCENE.colors.rockBase;
  ctx.beginPath();
  rock.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(w * x, h * y);
    else ctx.lineTo(w * x, h * y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = SCENE.colors.rockOutline;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = SCENE.colors.rockLight;
  ctx.beginPath();
  ctx.moveTo(w * 0.005, h * 0.525);
  ctx.lineTo(w * 0.055, h * 0.495);
  ctx.lineTo(w * 0.108, h * 0.525);
  ctx.lineTo(w * 0.14, h * 0.62);
  ctx.lineTo(w * 0.08, h * 0.68);
  ctx.lineTo(w * 0.005, h * 0.655);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.rockMedium;
  ctx.beginPath();
  ctx.moveTo(w * 0.108, h * 0.525);
  ctx.lineTo(w * 0.165, h * 0.56);
  ctx.lineTo(w * 0.205, h * 0.62);
  ctx.lineTo(w * 0.225, h * 0.72);
  ctx.lineTo(w * 0.19, h * 0.82);
  ctx.lineTo(w * 0.14, h * 0.78);
  ctx.lineTo(w * 0.135, h * 0.64);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.rockWarm;
  ctx.beginPath();
  ctx.moveTo(w * 0.005, h * 0.655);
  ctx.lineTo(w * 0.08, h * 0.68);
  ctx.lineTo(w * 0.14, h * 0.78);
  ctx.lineTo(w * 0.13, h * 0.88);
  ctx.lineTo(w * 0.08, h * 0.91);
  ctx.lineTo(w * 0.04, h * 0.88);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.rockDark;
  ctx.beginPath();
  ctx.moveTo(w * 0.205, h * 0.62);
  ctx.lineTo(w * 0.235, h * 0.69);
  ctx.lineTo(w * 0.225, h * 0.78);
  ctx.lineTo(w * 0.205, h * 0.87);
  ctx.lineTo(w * 0.17, h * 0.92);
  ctx.lineTo(w * 0.16, h * 0.83);
  ctx.lineTo(w * 0.18, h * 0.72);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(40,31,45,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.09, h * 0.56);
  ctx.lineTo(w * 0.112, h * 0.68);
  ctx.lineTo(w * 0.102, h * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.6);
  ctx.lineTo(w * 0.18, h * 0.74);
  ctx.stroke();

  ctx.strokeStyle = SCENE.colors.hillDeep;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.52);
  ctx.quadraticCurveTo(w * 0.08, h * 0.5, w * 0.14, h * 0.535);
  ctx.quadraticCurveTo(w * 0.19, h * 0.565, w * 0.225, h * 0.65);
  ctx.stroke();
}

function drawShoreRocks(ctx, w, h) {
  const rocks = [
    { x: 0.235, y: 0.765, size: 0.85 },
    { x: 0.255, y: 0.83, size: 0.5 },
    { x: 0.775, y: 0.79, size: 0.7 },
    { x: 0.745, y: 0.86, size: 0.45 },
  ];
  for (const rock of rocks) {
    const cx = w * rock.x;
    const cy = h * rock.y;
    const s = rock.size;
    ctx.fillStyle = SCENE.colors.rockBase;
    ctx.beginPath();
    ctx.moveTo(cx - 18 * s, cy + 8 * s);
    ctx.lineTo(cx - 10 * s, cy - 10 * s);
    ctx.lineTo(cx + 6 * s, cy - 14 * s);
    ctx.lineTo(cx + 18 * s, cy + 2 * s);
    ctx.lineTo(cx + 10 * s, cy + 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = SCENE.colors.rockOutline;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = SCENE.colors.rockLight;
    ctx.beginPath();
    ctx.moveTo(cx - 10 * s, cy - 10 * s);
    ctx.lineTo(cx + 6 * s, cy - 14 * s);
    ctx.lineTo(cx + 2 * s, cy - 2 * s);
    ctx.lineTo(cx - 6 * s, cy - 1 * s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawTree(ctx, x, y, scale) {
  ctx.save();
  ctx.fillStyle = 'rgba(25,70,35,0.16)';
  ctx.beginPath();
  ctx.ellipse(x + 2 * scale, y + 20 * scale, 18 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SCENE.colors.trunk;
  ctx.fillRect(x - 2.5 * scale, y - 2 * scale, 5 * scale, 20 * scale);

  ctx.fillStyle = SCENE.colors.treeDark;
  ctx.beginPath();
  ctx.arc(x - 10 * scale, y - 8 * scale, 13 * scale, 0, Math.PI * 2);
  ctx.arc(x + 9 * scale, y - 10 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.arc(x, y - 20 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SCENE.colors.treeMid;
  ctx.beginPath();
  ctx.arc(x - 6 * scale, y - 14 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.arc(x + 8 * scale, y - 18 * scale, 11 * scale, 0, Math.PI * 2);
  ctx.arc(x - scale, y - 24 * scale, 12 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SCENE.colors.treeLight;
  ctx.beginPath();
  ctx.arc(x - 7 * scale, y - 22 * scale, 6 * scale, 0, Math.PI * 2);
  ctx.arc(x + 4 * scale, y - 26 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBush(ctx, x, y, scale) {
  ctx.save();
  ctx.fillStyle = SCENE.colors.treeDark;
  ctx.beginPath();
  ctx.arc(x - 7 * scale, y, 8 * scale, 0, Math.PI * 2);
  ctx.arc(x + 5 * scale, y - 2 * scale, 9 * scale, 0, Math.PI * 2);
  ctx.arc(x + 12 * scale, y + 1 * scale, 6 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SCENE.colors.treeMid;
  ctx.beginPath();
  ctx.arc(x - 4 * scale, y - 4 * scale, 6 * scale, 0, Math.PI * 2);
  ctx.arc(x + 6 * scale, y - 5 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAnchors(ctx, w, h) {
  const anchors = [
    { x: w * 0.12, y: h * 0.42 },
    { x: w * 0.88, y: h * 0.42 },
  ];
  for (const anchor of anchors) {
    ctx.save();
    ctx.fillStyle = 'rgba(19,12,28,0.32)';
    ctx.beginPath();
    ctx.ellipse(anchor.x, anchor.y + 9, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = SCENE.colors.anchorDark;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SCENE.colors.beamOutline;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = SCENE.colors.anchorRing;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = SCENE.colors.anchor;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(anchor.x - 1, anchor.y - 1, 7.2, Math.PI * 1.05, Math.PI * 1.55);
    ctx.stroke();
    ctx.restore();
  }
}

const backgroundImage = new Image();
let backgroundReady = false;
backgroundImage.onload = () => {
  backgroundReady = true;
  if (typeof draw === 'function') draw();
};
backgroundImage.onerror = () => {
  backgroundReady = false;
};
backgroundImage.src = 'assets/bridge-background.png';

function drawBackground(ctx, w, h) {
  if (backgroundReady && backgroundImage.naturalWidth > 0) {
    const scale = Math.max(w / backgroundImage.naturalWidth, h / backgroundImage.naturalHeight);
    const dw = backgroundImage.naturalWidth * scale;
    const dh = backgroundImage.naturalHeight * scale;
    ctx.drawImage(backgroundImage, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return;
  }
  const fallback = ctx.createLinearGradient(0, 0, 0, h);
  fallback.addColorStop(0, '#9db8d6');
  fallback.addColorStop(0.6, '#c4d6e6');
  fallback.addColorStop(1, '#7fc9cf');
  ctx.fillStyle = fallback;
  ctx.fillRect(0, 0, w, h);
}
