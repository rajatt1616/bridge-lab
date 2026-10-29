const canvas = document.getElementById('bridgeCanvas');
const ctx = canvas.getContext('2d');

function roundRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawGrid() {
  if (!state.showGrid) return;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = SCENE.colors.gridMinor;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += SCENE.gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += SCENE.gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();

  ctx.strokeStyle = SCENE.colors.gridMajor;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += SCENE.gridSize * 5) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += SCENE.gridSize * 5) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
  ctx.restore();
}

let dragJoint = null;
let dragOffset = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const j = findJointAt(x, y, 18);
  if (j && state.mode === 'SELECT') {
    dragJoint = j;
    dragOffset = { x: x - j.x, y: y - j.y };
    if (typeof invalidateAnalysis === 'function') invalidateAnalysis();
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const coords = document.getElementById('cursorCoords');
  if (coords) coords.textContent = `Coordinates: (${Math.round(x)}, ${Math.round(y)})`;
  if (dragJoint) {
    dragJoint.x = x - dragOffset.x;
    dragJoint.y = y - dragOffset.y;
    draw();
  }
});

canvas.addEventListener('mouseup', () => {
  if (dragJoint) pushHistory();
  dragJoint = null;
});

function easeAnimation(durationMs) {
  const start = performance.now();
  function frame() {
    const elapsed = performance.now() - start;
    const progress = Math.min(elapsed / durationMs, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    return ease;
  }
  return { frame };
}

function hasPerMemberResults() {
  if (!state.lastAnalysis) return false;
  const members = Array.isArray(state.lastAnalysis.members) ? state.lastAnalysis.members : [];
  return members.some(member => member && member.id && member.id !== 'BRIDGE');
}

function getAggregateColor(utilization) {
  const value = Number(utilization);
  if (!Number.isFinite(value)) return SCENE.colors.beamSafe;
  if (value >= 100) return SCENE.colors.beamCompression;
  if (value >= 65) return SCENE.colors.beamOverload;
  if (value >= 25) return SCENE.colors.beamTension;
  return SCENE.colors.beamSafe;
}

function getMemberColor(beam) {
  if (!state.lastAnalysis) {
    return SCENE.colors.beamDefault;
  }
  const members = Array.isArray(state.lastAnalysis.members) ? state.lastAnalysis.members : [];
  const result = members.find(member => member && member.id === beam.id);
  if (result) {
    const utilization = Number(result.utilization);
    if (result.overloaded || (Number.isFinite(utilization) && utilization >= 100)) {
      return SCENE.colors.beamOverload;
    }
    const type = String(result.type || '').toUpperCase();
    if (type === 'TENSION') return SCENE.colors.beamTension;
    if (type === 'COMPRESSION') return SCENE.colors.beamCompression;
    return SCENE.colors.beamSafe;
  }
  const summary = state.lastAnalysis.summary;
  return getAggregateColor(summary && summary.maxUtilization);
}

function drawMember(from, to, color) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return;
  const nx = -dy / length;
  const ny = dx / length;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = SCENE.colors.beamShadow;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(from.x + 1.5, from.y + 2);
  ctx.lineTo(to.x + 1.5, to.y + 2);
  ctx.stroke();

  ctx.strokeStyle = SCENE.colors.beamOutline;
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(from.x + nx * 1.1, from.y + ny * 1.1);
  ctx.lineTo(to.x + nx * 1.1, to.y + ny * 1.1);
  ctx.stroke();
  ctx.restore();
}

function drawBrokenMember(from, to, color) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return;

  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const breakX = from.x + dx * 0.55;
  const breakY = from.y + dy * 0.55;
  const gap = Math.min(16, length * 0.12);
  const gapA = { x: breakX - ux * gap / 2, y: breakY - uy * gap / 2 };
  const gapB = { x: breakX + ux * gap / 2, y: breakY + uy * gap / 2 };

  drawMember(from, gapA, color);
  drawMember(gapB, to, color);

  ctx.save();
  ctx.strokeStyle = SCENE.colors.beamOverload;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  drawCrack(gapA, ux, uy, nx, ny, 1);
  drawCrack(gapB, ux, uy, nx, ny, -1);
  ctx.restore();
}

function drawCrack(point, ux, uy, nx, ny, direction) {
  const size = 6;
  ctx.beginPath();
  ctx.moveTo(point.x + nx * size, point.y + ny * size);
  ctx.lineTo(point.x + ux * size * direction + nx * size * 0.2,
             point.y + uy * size * direction + ny * size * 0.2);
  ctx.lineTo(point.x - nx * size, point.y - ny * size);
  ctx.stroke();
}

function drawFailureBurst() {
  const beam = state.beams.find(item => item.id === failureEffect.memberId);
  if (!beam) return;
  const from = state.joints.find(joint => joint.id === beam.from);
  const to = state.joints.find(joint => joint.id === beam.to);
  if (!from || !to) return;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return;

  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const breakX = from.x + dx * 0.55;
  const breakY = from.y + dy * 0.55;
  const elapsed = performance.now() - failureEffect.start;
  const flashing = elapsed < failureEffect.flashDuration;
  const flash = flashing ? 0.5 + 0.5 * Math.sin(elapsed / 70) : 0;

  ctx.save();
  if (flash > 0) {
    ctx.strokeStyle = 'rgba(245,166,35,' + (0.75 * flash) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(breakX, breakY, 9 + flash * 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(229,72,75,' + (0.8 * flash) + ')';
    ctx.lineWidth = 1.8;
    for (const offset of [-1, 1]) {
      const spread = 12 + flash * 10;
      ctx.beginPath();
      ctx.moveTo(breakX + nx * offset * 4, breakY + ny * offset * 4);
      ctx.lineTo(breakX + nx * offset * spread + ux * 4,
                 breakY + ny * offset * spread + uy * 4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function findFailingMemberId() {
  const analysis = state.lastAnalysis;
  if (!analysis) return null;
  const members = Array.isArray(analysis.members) ? analysis.members : [];
  const beamIds = new Set(state.beams.map(beam => beam.id));
  const overloaded = members.find(member => member && member.overloaded && beamIds.has(member.id));
  if (overloaded) return overloaded.id;
  const summary = analysis.summary || {};
  if (summary.maxForceMember && beamIds.has(summary.maxForceMember)) {
    return summary.maxForceMember;
  }
  let best = null;
  for (const member of members) {
    if (!member || !beamIds.has(member.id)) continue;
    if (!best || Number(member.utilization) > Number(best.utilization)) best = member;
  }
  return best ? best.id : null;
}

function drawBeamLabel(cx, cy, text) {
  ctx.save();
  ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
  const textWidth = ctx.measureText(text).width;
  const width = textWidth + 10;
  const height = 16;
  roundRectPath(ctx, cx - width / 2, cy - height / 2, width, height, 8);
  ctx.fillStyle = SCENE.colors.labelPanel;
  ctx.fill();
  ctx.strokeStyle = SCENE.colors.labelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = SCENE.colors.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}

function formatMemberLabel(beam, result) {
  if (!result) return beam.id;
  const type = String(result.type || '').toUpperCase();
  const force = Math.abs(Number(result.force) || 0);
  const unit = type === 'TENSION' ? 'T' : type === 'COMPRESSION' ? 'C' : '';
  return unit ? `${beam.id} ${unit} ${force.toFixed(0)} kN` : beam.id;
}

function drawJoint(joint) {
  ctx.save();
  ctx.fillStyle = SCENE.colors.jointShadow;
  ctx.beginPath();
  ctx.ellipse(joint.x + 1, joint.y + 3, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SCENE.colors.jointOuter;
  ctx.beginPath();
  ctx.arc(joint.x, joint.y, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SCENE.colors.jointFace;
  ctx.beginPath();
  ctx.arc(joint.x, joint.y, 5.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SCENE.colors.beamDefault;
  ctx.beginPath();
  ctx.arc(joint.x, joint.y, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 3;
  ctx.strokeStyle = SCENE.colors.labelHalo;
  ctx.strokeText(joint.id, joint.x + 10, joint.y - 10);
  ctx.fillStyle = SCENE.colors.text;
  ctx.fillText(joint.id, joint.x + 10, joint.y - 10);
  ctx.restore();
}

function drawSupport(support, joint) {
  const pinned = support.type === 'PINNED' || support.type === 'Pinned';
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (pinned) {
    const topY = joint.y + 2;
    const baseY = joint.y + 24;
    ctx.fillStyle = SCENE.colors.supportPinned;
    ctx.strokeStyle = SCENE.colors.supportOutline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(joint.x, topY);
    ctx.lineTo(joint.x + 16, baseY);
    ctx.lineTo(joint.x - 16, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(joint.x - 8, baseY - 3);
    ctx.lineTo(joint.x, topY + 5);
    ctx.lineTo(joint.x + 8, baseY - 3);
    ctx.stroke();

    ctx.strokeStyle = SCENE.colors.supportOutline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(joint.x - 21, baseY);
    ctx.lineTo(joint.x + 21, baseY);
    ctx.stroke();
    for (let i = -19; i <= 19; i += 5) {
      ctx.beginPath();
      ctx.moveTo(joint.x + i, baseY);
      ctx.lineTo(joint.x + i - 3, baseY + 7);
      ctx.stroke();
    }
  } else {
    const bodyY = joint.y + 4;
    const bodyWidth = 34;
    const bodyHeight = 14;
    ctx.fillStyle = SCENE.colors.supportRoller;
    ctx.strokeStyle = SCENE.colors.supportOutline;
    ctx.lineWidth = 1.8;
    roundRectPath(ctx, joint.x - bodyWidth / 2, bodyY, bodyWidth, bodyHeight, 7);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(joint.x, joint.y);
    ctx.lineTo(joint.x, bodyY);
    ctx.stroke();

    for (const dx of [-8, 8]) {
      ctx.fillStyle = SCENE.colors.supportOutline;
      ctx.beginPath();
      ctx.arc(joint.x + dx, bodyY + bodyHeight + 4, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = SCENE.colors.jointFace;
      ctx.beginPath();
      ctx.arc(joint.x + dx, bodyY + bodyHeight + 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const groundY = bodyY + bodyHeight + 9.5;
    ctx.strokeStyle = SCENE.colors.supportOutline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(joint.x - 21, groundY);
    ctx.lineTo(joint.x + 21, groundY);
    ctx.stroke();
    for (let i = -19; i <= 19; i += 5) {
      ctx.beginPath();
      ctx.moveTo(joint.x + i, groundY);
      ctx.lineTo(joint.x + i - 3, groundY + 7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLoad(load, joint) {
  const label = Math.abs(load.fy || load.load || 0) + ' kN';
  const startY = joint.y + 4;
  const endY = joint.y + 40;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = SCENE.colors.loadOutline;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(joint.x, startY);
  ctx.lineTo(joint.x, endY);
  ctx.stroke();

  ctx.strokeStyle = SCENE.colors.loadArrow;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(joint.x, startY);
  ctx.lineTo(joint.x, endY);
  ctx.stroke();

  ctx.fillStyle = SCENE.colors.loadOutline;
  ctx.beginPath();
  ctx.moveTo(joint.x - 7, endY - 10);
  ctx.lineTo(joint.x + 7, endY - 10);
  ctx.lineTo(joint.x, endY + 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.loadArrow;
  ctx.beginPath();
  ctx.moveTo(joint.x - 4.5, endY - 9);
  ctx.lineTo(joint.x + 4.5, endY - 9);
  ctx.lineTo(joint.x, endY);
  ctx.closePath();
  ctx.fill();

  ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
  const textWidth = ctx.measureText(label).width;
  const pillX = joint.x + 12;
  const pillY = joint.y + 16;
  roundRectPath(ctx, pillX, pillY, textWidth + 12, 18, 9);
  ctx.fillStyle = SCENE.colors.labelPanel;
  ctx.fill();
  ctx.strokeStyle = SCENE.colors.labelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = SCENE.colors.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, pillX + 6, pillY + 9.5);
  ctx.restore();
}

function drawReactions() {
  const reactions = state.lastAnalysis && Array.isArray(state.lastAnalysis.reactions)
    ? state.lastAnalysis.reactions
    : [];
  for (const reaction of reactions) {
    const joint = state.joints.find(item => item.id === reaction.joint);
    if (!joint) continue;
    const ry = Number(reaction.ry) || 0;
    const rx = Number(reaction.rx) || 0;
    if (Math.abs(ry) < 0.05 && Math.abs(rx) < 0.05) continue;
    drawReaction(joint, rx, ry);
  }
}

function drawReaction(joint, rx, ry) {
  if (Math.abs(ry) < 0.05) return;
  const up = ry >= 0;
  const tailY = up ? joint.y - 8 : joint.y + 8;
  const tipY = up ? joint.y - 34 : joint.y + 34;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = SCENE.colors.labelHalo;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(joint.x, tailY);
  ctx.lineTo(joint.x, tipY);
  ctx.stroke();

  ctx.strokeStyle = SCENE.colors.supportPinned;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(joint.x, tailY);
  ctx.lineTo(joint.x, tipY);
  ctx.stroke();

  ctx.fillStyle = SCENE.colors.supportPinned;
  const baseY = tipY + (up ? 6 : -6);
  ctx.beginPath();
  ctx.moveTo(joint.x, tipY);
  ctx.lineTo(joint.x - 5, baseY);
  ctx.lineTo(joint.x + 5, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (state.showLabels) {
    const labelX = joint.x + (joint.x < canvas.width / 2 ? 46 : -46);
    const labelY = tipY + (up ? -10 : 10);
    const rxPart = Math.abs(rx) >= 0.5 ? '  Rx ' + rx.toFixed(1) : '';
    drawBeamLabel(labelX, labelY, 'Ry ' + Math.abs(ry).toFixed(1) + rxPart);
  }
}

function drawLegend(w, h) {
  const x = 18;
  const y = h - 88;
  const width = 210;
  const height = 70;

  ctx.save();
  roundRectPath(ctx, x, y, width, height, 14);
  ctx.fillStyle = SCENE.colors.legendPanel;
  ctx.fill();
  ctx.strokeStyle = SCENE.colors.labelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = SCENE.colors.text;
  ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Stress Overlay', x + 12, y + 18);

  const perMember = hasPerMemberResults();
  const items = perMember
    ? [
        ['Safe', SCENE.colors.beamSafe, x + 12, y + 34],
        ['Tension', SCENE.colors.beamTension, x + 108, y + 34],
        ['Compression', SCENE.colors.beamCompression, x + 12, y + 54],
        ['Overload', SCENE.colors.beamOverload, x + 108, y + 54],
      ]
    : [
        ['Low', SCENE.colors.beamSafe, x + 12, y + 34],
        ['Moderate', SCENE.colors.beamTension, x + 108, y + 34],
        ['High', SCENE.colors.beamOverload, x + 12, y + 54],
        ['Overload', SCENE.colors.beamCompression, x + 108, y + 54],
      ];
  for (const [label, color, sx, sy] of items) {
    roundRectPath(ctx, sx, sy - 8, 9, 9, 2.5);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = SCENE.colors.textMuted;
    ctx.font = '500 9.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(label, sx + 14, sy);
  }
  ctx.restore();
}

function drawStats(w, h) {
  const budget = typeof computeBudgetUsed === 'function' ? computeBudgetUsed() : 0;
  const formatter = typeof formatCurrency === 'function'
    ? formatCurrency
    : (value) => '$' + Number(value || 0);
  const text = `Nodes: ${state.joints.length}   |   Beams: ${state.beams.length}   |   Budget Used: ${formatter(budget)}`;

  ctx.save();
  ctx.font = '600 11.5px "Segoe UI", system-ui, sans-serif';
  const textWidth = ctx.measureText(text).width;
  const padX = 16;
  const height = 34;
  const width = textWidth + padX * 2;
  const x = w - width - 18;
  const y = h - height - 18;

  roundRectPath(ctx, x, y, width, height, 12);
  ctx.fillStyle = SCENE.colors.legendPanel;
  ctx.fill();
  ctx.strokeStyle = SCENE.colors.labelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = SCENE.colors.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + height / 2 + 0.5);
  ctx.restore();
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawBackground(ctx, w, h);
  drawGrid();

  const memberResults = new Map();
  if (state.lastAnalysis && Array.isArray(state.lastAnalysis.members)) {
    for (const member of state.lastAnalysis.members) {
      memberResults.set(member.id, member);
    }
  }

  const labels = [];
  for (const beam of state.beams) {
    const from = state.joints.find(joint => joint.id === beam.from);
    const to = state.joints.find(joint => joint.id === beam.to);
    if (!from || !to) continue;
    const color = getMemberColor(beam);
    if (failureEffect && failureEffect.memberId === beam.id) {
      drawBrokenMember(from, to, color);
    } else {
      drawMember(from, to, color);
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    labels.push({
      x: (from.x + to.x) / 2 + nx * 15,
      y: (from.y + to.y) / 2 + ny * 15,
      text: formatMemberLabel(beam, memberResults.get(beam.id)),
    });
  }

  for (const support of state.supports || []) {
    const joint = state.joints.find(item => item.id === support.joint);
    if (joint) drawSupport(support, joint);
  }

  for (const joint of state.joints) {
    drawJoint(joint);
  }

  if (state.showLabels) {
    for (const label of labels) {
      drawBeamLabel(label.x, label.y, label.text);
    }
  }

  if (failureEffect) drawFailureBurst();

  const loadsByJoint = new Map();
  for (const load of state.loads || []) {
    const magnitude = Math.abs(load.fy ?? load.load ?? 0);
    loadsByJoint.set(load.joint, (loadsByJoint.get(load.joint) || 0) + magnitude);
  }
  for (const [jointId, magnitude] of loadsByJoint) {
    const joint = state.joints.find(item => item.id === jointId);
    if (joint) drawLoad({ joint: jointId, fy: -magnitude }, joint);
  }

  drawReactions();

  if (state.showLegend) drawLegend(w, h);
  drawStats(w, h);
  if (testResult) {
    if (testResult.car) {
      drawTestCar(testResult.car.x, testResult.car.y, testResult.car.rotation);
    }
    drawTestBanner(w, h, testResult.text, testResult.pass);
  }
  if (typeof updateStatusBar === 'function') updateStatusBar();
}

let testActive = false;
let testBusy = false;
let testProgress = 0;
let testOutcome = 'PASS';
let testPath = null;
let testResult = null;
let testRequestId = 0;
let failureEffect = null;

function setTestButtonBusy(busy) {
  const button = document.getElementById('runTestBtn');
  if (!button) return;
  button.disabled = busy;
  const label = button.querySelector('span');
  if (label) {
    label.textContent = busy ? 'Testing...' : 'Run Test';
  }
  const analyzeButton = document.getElementById('analyzeBtn');
  if (analyzeButton) analyzeButton.disabled = busy;
}

function clearTestVisuals() {
  testRequestId++;
  testActive = false;
  testBusy = false;
  testPath = null;
  testResult = null;
  failureEffect = null;
  setTestButtonBusy(false);
}

function getTestPath() {
  const joints = state.joints || [];
  if (!joints.length) return null;
  const xs = joints.map(joint => joint.x);
  const ys = joints.map(joint => joint.y);
  const supportJoints = (state.supports || [])
    .map(support => joints.find(joint => joint.id === support.joint))
    .filter(Boolean);
  const supportXs = supportJoints.map(joint => joint.x);
  const supportYs = supportJoints.map(joint => joint.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const supportMinX = supportXs.length ? Math.min(...supportXs) : minX;
  const supportMaxX = supportXs.length ? Math.max(...supportXs) : maxX;
  const deckY = supportYs.length ? Math.max(...supportYs) : Math.max(...ys);
  const startX = Math.max(20, Math.min(minX, supportMinX) - 25);
  const endX = Math.min(canvas.width - 20, Math.max(maxX, supportMaxX) + 25);
  const failX = (supportMinX + supportMaxX) / 2;
  const span = endX - startX;
  const failProgress = span > 0
    ? Math.min(0.9, Math.max(0.1, (failX - startX) / span))
    : 0.5;
  return { startX, endX, deckY, failProgress };
}

function incompleteAnalysis(message) {
  return {
    status: 'UNSTABLE',
    message,
    members: [],
    reactions: [],
    summary: {
      maxForceMember: 'BRIDGE',
      maxUtilization: 0,
      overloadedCount: 0,
      totalLength: 0,
      pass: false,
      totalLoad: 0,
      capacity: 0
    }
  };
}

function finishImmediateFailure(data) {
  testBusy = false;
  testActive = false;
  testPath = null;
  state.lastAnalysis = data;
  if (typeof renderAnalysis === 'function') renderAnalysis(data);
  if (typeof setStatusBadge === 'function') setStatusBadge('FAIL', 'fail');
  if (typeof setResultMessage === 'function') {
    setResultMessage('FAIL: ' + (data.message || 'Bridge cannot be tested.'), 'fail');
  }
  testResult = {
    pass: false,
    text: 'Bridge cannot be tested',
    car: null
  };
  setTestButtonBusy(false);
  draw();
}

async function startTest() {
  if (testBusy || testActive) return;

  clearTestVisuals();
  if (typeof clearResults === 'function') clearResults();
  state.lastAnalysis = null;
  draw();

  testBusy = true;
  setTestButtonBusy(true);
  if (typeof setStatusBadge === 'function') setStatusBadge('TESTING', '');
  if (typeof setResultMessage === 'function') {
    setResultMessage('Testing design and checking load capacity...', '');
  }

  const requestId = ++testRequestId;

  if (!state.joints.length || !state.beams.length || !state.supports.length) {
    finishImmediateFailure(incompleteAnalysis('Bridge incomplete: add joints, beams, and supports before testing.'));
    return;
  }

  try {
    const data = await requestAnalysis();
    if (requestId !== testRequestId) return;

    testPath = getTestPath();
    if (!testPath) {
      finishImmediateFailure(incompleteAnalysis('Bridge geometry is incomplete.'));
      return;
    }

    state.lastAnalysis = data;
    if (typeof refreshReport === 'function') refreshReport();

    if (data.status === 'OK' && data.summary && data.summary.pass) {
      testOutcome = 'PASS';
      testProgress = 0;
      testBusy = false;
      testActive = true;
      if (typeof setResultMessage === 'function') {
        setResultMessage('Testing: vehicle driving across bridge...', '');
      }
      draw();
      requestAnimationFrame(testFrame);
      return;
    }

    if (data.status === 'OVERLOADED') {
      testOutcome = 'FAIL';
      testProgress = 0;
      testBusy = false;
      testActive = true;
      if (typeof setResultMessage === 'function') {
        setResultMessage('Testing: load limit reached, vehicle advancing to midspan...', 'fail');
      }
      draw();
      requestAnimationFrame(testFrame);
      return;
    }

    finishImmediateFailure(data);
  } catch (error) {
    if (requestId !== testRequestId) return;
    finishImmediateFailure(incompleteAnalysis(
      'Unable to analyze the bridge: ' + (error && error.message ? error.message : error)
    ));
  }
}

function drawTestCar(cx, cy, rotation) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  ctx.fillStyle = 'rgba(20,14,30,0.24)';
  ctx.beginPath();
  ctx.ellipse(0, 13, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  roundRectPath(ctx, -17, -8, 34, 16, 5);
  ctx.fillStyle = SCENE.colors.beamOutline;
  ctx.fill();

  roundRectPath(ctx, -15, -6, 30, 12, 4);
  ctx.fillStyle = SCENE.colors.beamDefault;
  ctx.fill();

  ctx.fillStyle = SCENE.colors.beamOutline;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(-5, -13);
  ctx.lineTo(6, -13);
  ctx.lineTo(9, -6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.carWindow;
  ctx.beginPath();
  ctx.moveTo(-6.5, -7);
  ctx.lineTo(-4, -11.5);
  ctx.lineTo(5, -11.5);
  ctx.lineTo(7, -7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE.colors.carLight;
  roundRectPath(ctx, 12, -3, 4, 4, 1.5);
  ctx.fill();

  for (const wx of [-9, 9]) {
    ctx.fillStyle = SCENE.colors.beamOutline;
    ctx.beginPath();
    ctx.arc(wx, 8, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SCENE.colors.jointFace;
    ctx.beginPath();
    ctx.arc(wx, 8, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTestBanner(w, h, text, pass) {
  const label = text || (pass ? 'Crossed successfully' : 'Test failed');
  const accent = pass ? SCENE.colors.supportPinned : SCENE.colors.beamCompression;
  const border = pass ? 'rgba(124,206,139,0.65)' : 'rgba(229,72,75,0.72)';

  ctx.save();
  ctx.font = '700 14px "Segoe UI", system-ui, sans-serif';
  const textWidth = ctx.measureText(label).width;
  const width = textWidth + 64;
  const height = 42;
  const x = w / 2 - width / 2;
  const y = 20;

  roundRectPath(ctx, x, y, width, height, 21);
  ctx.fillStyle = 'rgba(27,20,42,0.84)';
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + 23, y + height / 2, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#f5fff7';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (pass) {
    ctx.moveTo(x + 19, y + height / 2);
    ctx.lineTo(x + 22, y + height / 2 + 3);
    ctx.lineTo(x + 28, y + height / 2 - 4);
  } else {
    ctx.moveTo(x + 19, y + height / 2 - 4);
    ctx.lineTo(x + 27, y + height / 2 + 4);
    ctx.moveTo(x + 27, y + height / 2 - 4);
    ctx.lineTo(x + 19, y + height / 2 + 4);
  }
  ctx.stroke();

  ctx.fillStyle = SCENE.colors.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 38, y + height / 2 + 0.5);
  ctx.restore();
}

function testFrame() {
  if (!testActive || !testPath) return;
  testProgress += 0.003;

  const stopProgress = testOutcome === 'FAIL' ? testPath.failProgress : 1;

  if (testProgress >= stopProgress) {
    testProgress = stopProgress;
    testActive = false;
    testBusy = false;

    const finalX = testPath.startX + (testPath.endX - testPath.startX) * stopProgress;
    const finalY = testPath.deckY - 14;
    const rotation = testOutcome === 'FAIL' ? 0.12 : 0;
    const data = state.lastAnalysis || incompleteAnalysis('No analysis result available.');

    if (typeof renderAnalysis === 'function') renderAnalysis(data);

    if (testOutcome === 'FAIL') {
      const failedMemberId = findFailingMemberId();
      if (failedMemberId) {
        failureEffect = {
          memberId: failedMemberId,
          start: performance.now(),
          flashDuration: 1400
        };
      }
      if (typeof setStatusBadge === 'function') setStatusBadge('FAIL', 'fail');
      if (typeof setResultMessage === 'function') {
        setResultMessage('FAIL: ' + (data.message || 'The bridge exceeded its load limit.') + ' The vehicle stopped at midspan.', 'fail');
      }
      testResult = {
        pass: false,
        text: 'Load limit reached — test failed',
        car: { x: finalX, y: finalY, rotation }
      };
    } else {
      if (typeof setStatusBadge === 'function') setStatusBadge('PASS', 'pass');
      if (typeof setResultMessage === 'function') {
        setResultMessage('PASS: ' + (data.message || 'Vehicle crossed successfully.'), 'pass');
      }
      testResult = {
        pass: true,
        text: 'Crossed successfully',
        car: { x: finalX, y: finalY, rotation }
      };
    }

    setTestButtonBusy(false);
    draw();
    if (failureEffect) requestAnimationFrame(failureFlashFrame);
    return;
  }

  draw();
  const cx = testPath.startX + (testPath.endX - testPath.startX) * testProgress;
  const cy = testPath.deckY - 14;
  drawTestCar(cx, cy, 0);
  requestAnimationFrame(testFrame);
}

function failureFlashFrame() {
  if (!failureEffect) return;
  draw();
  if (performance.now() - failureEffect.start < failureEffect.flashDuration) {
    requestAnimationFrame(failureFlashFrame);
  }
}

window.startTest = startTest;
window.clearTestVisuals = clearTestVisuals;
