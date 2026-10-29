function addPoint(x, y) {
  const j = { id: 'J' + (state.joints.length + 1), x, y };
  state.joints.push(j);
  pushHistory();
  draw();
}

function findJointAt(x, y, radius = 18) {
  for (const j of state.joints) {
    const dx = j.x - x; const dy = j.y - y;
    if (Math.sqrt(dx*dx + dy*dy) < radius) return j;
  }
  return null;
}

let analysisRequestId = 0;

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.innerText = text;
}

function currentLoadStep() {
  const step = Number(state.loadStep);
  return Number.isFinite(step) && step > 0 ? step : 100;
}

function setLoadStep(value) {
  const step = Number(value);
  if (!Number.isFinite(step) || step <= 0) return;
  state.loadStep = step;
  const select = document.getElementById('loadStep');
  if (select && Number(select.value) !== step) select.value = String(step);
}

function totalLoadMagnitude() {
  return (state.loads || []).reduce((sum, load) => sum + Math.abs(Number(load.fy) || 0), 0);
}

function supportsReady() {
  const supports = state.supports || [];
  const hasPinned = supports.some(support => String(support.type).toUpperCase() === 'PINNED');
  return supports.length >= 2 && hasPinned;
}

function updateDemoGuide() {
  const status = state.lastAnalysis && state.lastAnalysis.status;
  const steps = {
    supports: supportsReady(),
    load: totalLoadMagnitude() > 0,
    test: status === 'OK' || status === 'OVERLOADED'
  };
  const firstPending = ['supports', 'load', 'test'].find(step => !steps[step]);
  document.querySelectorAll('#demoGuide .guide-step').forEach(button => {
    const done = Boolean(steps[button.dataset.step]);
    button.classList.toggle('done', done);
    button.classList.toggle('active', button.dataset.step === firstPending);
  });
}

function formatNumber(value, suffix = '') {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) + suffix : '-';
}

function utilizationTone(value) {
  const utilization = Number(value);
  if (!Number.isFinite(utilization) || utilization < 25) return 'low';
  if (utilization >= 100) return 'overload';
  if (utilization >= 65) return 'high';
  return 'moderate';
}

function updateUtilizationMeter(value) {
  const fill = document.getElementById('utilFill');
  if (!fill) return;
  const utilization = Number(value);
  const clamped = Number.isFinite(utilization)
    ? Math.min(100, Math.max(0, utilization))
    : 0;
  fill.style.width = clamped + '%';
  fill.dataset.tone = utilizationTone(utilization);
  const row = fill.closest('.util-meter-row');
  if (row) {
    row.setAttribute('aria-label', 'Stress utilization ' + Math.round(clamped) + ' percent');
  }
}

function setStatusBadge(text, tone) {
  const badge = document.getElementById('statusBadge');
  if (!badge) return;
  badge.innerText = text || '-';
  badge.classList.toggle('status-pass', tone === 'pass');
  badge.classList.toggle('status-fail', tone === 'fail');
}

function setResultMessage(text, tone) {
  const message = document.getElementById('resultMessage');
  if (!message) return;
  message.hidden = !text;
  message.textContent = text || '';
  message.classList.toggle('is-pass', tone === 'pass');
  message.classList.toggle('is-fail', tone === 'fail');
}

function setOverloadDisplay(count) {
  setText('overloadCount', Number(count) > 0 ? 'Yes (' + Number(count) + ')' : 'No');
}

function clearResults() {
  analysisRequestId++;
  state.lastAnalysis = null;
  setStatusBadge('Ready', '');
  setText('maxUtil', '0%');
  setText('totalLoad', '0 kN');
  setText('capacity', '\u2014');
  setOverloadDisplay(0);
  updateUtilizationMeter(0);
  setResultMessage('', '');
  const tbody = document.getElementById('memberTableBody');
  if (tbody) tbody.innerHTML = '';
  const resultsContent = document.getElementById('resultsContent');
  if (resultsContent) resultsContent.innerText = 'Run Test to see results.';
  updateDemoGuide();
  if (typeof refreshReport === 'function') refreshReport();
}

function invalidateAnalysis() {
  if (typeof clearTestVisuals === 'function') clearTestVisuals();
  clearResults();
}

function buildAnalysisPayload() {
  return {
    joints: state.joints.map(joint => ({ id: joint.id, x: joint.x, y: joint.y })),
    beams: state.beams.map(beam => ({ id: beam.id || '', from: beam.from, to: beam.to, material: 'STEEL' })),
    supports: state.supports.map(support => ({ joint: support.joint, type: support.type })),
    loads: state.loads.map(load => ({ joint: load.joint, fx: load.fx || 0, fy: load.fy ?? -100 })),
    overloadLimit: 300
  };
}

function requestAnalysis() {
  return api.analyze(buildAnalysisPayload());
}

function renderAnalysis(data) {
  state.lastAnalysis = data;
  const summary = (data && data.summary) || {};
  const pass = Boolean(summary.pass);
  const tone = pass ? 'pass' : 'fail';

  const resultsContent = document.getElementById('resultsContent');
  if (resultsContent) resultsContent.innerText = JSON.stringify(data, null, 2);

  setStatusBadge((data && data.status) || (pass ? 'OK' : 'FAIL'), tone);
  setText('maxUtil', formatNumber(summary.maxUtilization, '%'));
  updateUtilizationMeter(summary.maxUtilization);
  setOverloadDisplay(summary.overloadedCount);
  setText('totalLoad', formatNumber(summary.totalLoad, ' kN'));
  setText('capacity', Number(summary.capacity) > 0 ? formatNumber(summary.capacity, ' kN') : '\u2014');
  setResultMessage((data && data.message) || (pass ? 'Analysis completed.' : 'Analysis failed.'), tone);

  const tbody = document.getElementById('memberTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    const members = data && Array.isArray(data.members) ? data.members : [];
    members.forEach(member => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${member.id ?? '-'}</td><td>${member.type ?? '-'}</td><td>${formatNumber(member.force)}</td><td>${formatNumber(member.utilization)}</td>`;
      tbody.appendChild(row);
    });
  }
  updateDemoGuide();
  if (typeof refreshReport === 'function') refreshReport();
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const j = findJointAt(x, y, 18);
  if (state.mode === 'ADD_JOINT') {
    addPoint(x, y);
    invalidateAnalysis();
  }
  else if (state.mode === 'SET_SUPPORT') {
    if (j) {
      const existingPinned = state.supports.find(s => s.joint === j.id && s.type === 'PINNED');
      const existingRoller = state.supports.find(s => s.joint === j.id && s.type === 'ROLLER');
      if (existingPinned) {
        state.supports = state.supports.filter(s => !(s.joint === j.id && s.type === 'PINNED'));
        state.supports.push({ joint: j.id, type: 'ROLLER' });
      } else if (existingRoller) {
        state.supports = state.supports.filter(s => !(s.joint === j.id && s.type === 'ROLLER'));
      } else {
        state.supports.push({ joint: j.id, type: 'PINNED' });
      }
      pushHistory();
      invalidateAnalysis();
      draw();
    }
  }
  else if (state.mode === 'APPLY_LOAD') {
    if (j) {
      const step = currentLoadStep();
      const existing = state.loads.find(load => load.joint === j.id);
      if (existing) {
        existing.fy = (existing.fy || 0) - step;
      } else {
        state.loads.push({ joint: j.id, fy: -step });
      }
      pushHistory();
      invalidateAnalysis();
      draw();
    }
  }
  else if (state.mode === 'ADD_BEAM') {
    if (!state.firstBeamJoint) {
      if (j) state.firstBeamJoint = j.id;
    } else {
      if (j && j.id !== state.firstBeamJoint) {
        state.beams.push({ id: 'B' + (state.beams.length + 1), from: state.firstBeamJoint, to: j.id });
        pushHistory();
        invalidateAnalysis();
      }
      state.firstBeamJoint = null;
      draw();
    }
  }
  draw();
});

function analyze() {
  if (typeof clearTestVisuals === 'function') clearTestVisuals();
  const requestId = ++analysisRequestId;
  setStatusBadge('Analyzing', '');
  setResultMessage('Analyzing current design...', '');
  draw();
  return requestAnalysis()
    .then(data => {
      if (requestId !== analysisRequestId) return;
      renderAnalysis(data);
      draw();
      return data;
    })
    .catch(error => {
      if (requestId !== analysisRequestId) return;
      state.lastAnalysis = null;
      draw();
      const message = error && error.message ? error.message : String(error);
      setStatusBadge('Error', 'fail');
      setResultMessage('Analysis failed: ' + message, 'fail');
      updateUtilizationMeter(0);
      const tbody = document.getElementById('memberTableBody');
      if (tbody) tbody.innerHTML = '';
      updateDemoGuide();
      if (typeof refreshReport === 'function') refreshReport();
    });
}

function reset() {
  if (typeof clearTestVisuals === 'function') clearTestVisuals();
  state.joints = []; state.beams = []; state.supports = []; state.loads = [];
  state.lastAnalysis = null;
  state.firstBeamJoint = null;
  clearResults();
  pushHistory();
  draw();
}

function newDesign() {
  if (typeof clearTestVisuals === 'function') clearTestVisuals();
  state.joints = []; state.beams = []; state.supports = []; state.loads = [];
  state.lastAnalysis = null;
  state.firstBeamJoint = null;
  state.history = [];
  state.historyIndex = -1;
  initHistory();
  clearResults();
  draw();
  if (typeof updateStatusBar === 'function') updateStatusBar();
}

function loadScenario(name) {
  const overload = name === 'overload';
  if (typeof clearTestVisuals === 'function') clearTestVisuals();
  const design = createDemoDesign();
  state.joints = design.joints;
  state.beams = design.beams;
  state.supports = [
    { joint: 'J1', type: 'PINNED' },
    { joint: 'J3', type: 'ROLLER' }
  ];
  state.loads = [{ joint: 'J2', fy: overload ? -300 : -200 }];
  state.lastAnalysis = null;
  state.firstBeamJoint = null;
  state.selectedJoint = null;
  clearResults();
  pushHistory();
  draw();
  if (typeof updateStatusBar === 'function') updateStatusBar();
  return analyze();
}

function saveDesign() {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    joints: state.joints,
    beams: state.beams,
    supports: state.supports,
    loads: state.loads
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'bridgelab-design.json');
}

function loadDesign(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const joints = Array.isArray(data.joints) ? data.joints : [];
      const beams = Array.isArray(data.beams) ? data.beams : [];
      const supports = Array.isArray(data.supports) ? data.supports : [];
      const loads = Array.isArray(data.loads) ? data.loads : [];
      const jointIds = new Set(joints.map(joint => joint.id));
      const validBeams = beams.filter(beam => jointIds.has(beam.from) && jointIds.has(beam.to));
      state.joints = joints.map(joint => ({ id: joint.id, x: Number(joint.x), y: Number(joint.y) }));
      state.beams = validBeams.map(beam => ({ id: beam.id, from: beam.from, to: beam.to }));
      state.supports = supports.filter(support => jointIds.has(support.joint));
      state.loads = loads.filter(load => jointIds.has(load.joint));
      state.firstBeamJoint = null;
      invalidateAnalysis();
      pushHistory();
      draw();
      if (typeof updateStatusBar === 'function') updateStatusBar();
    } catch (error) {
      window.alert('Could not load that file: ' + (error && error.message ? error.message : error));
    }
  };
  reader.readAsText(file);
}

function exportImage() {
  const link = document.createElement('a');
  link.download = 'bridgelab-design.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
