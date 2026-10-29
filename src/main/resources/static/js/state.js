const BUDGET_LIMIT = 50000;

const COSTS = {
  joint: 1000,
  beam: 2500,
  support: 1500
};

function createDemoDesign() {
  return {
    joints: [
      { id: 'J1', x: 268, y: 262 },
      { id: 'J2', x: 466.5, y: 259.5 },
      { id: 'J3', x: 665, y: 257 },
      { id: 'J4', x: 367.25, y: 150.75 },
      { id: 'J5', x: 565.75, y: 148.25 }
    ],
    beams: [
      { id: 'B1', from: 'J1', to: 'J2' },
      { id: 'B2', from: 'J2', to: 'J3' },
      { id: 'B3', from: 'J1', to: 'J4' },
      { id: 'B4', from: 'J4', to: 'J2' },
      { id: 'B5', from: 'J2', to: 'J5' },
      { id: 'B6', from: 'J5', to: 'J3' },
      { id: 'B7', from: 'J4', to: 'J5' }
    ]
  };
}

const demoDesign = createDemoDesign();

const state = {
  mode: 'SELECT',
  joints: demoDesign.joints,
  beams: demoDesign.beams,
  supports: [],
  loads: [],
  selectedJoint: null,
  firstBeamJoint: null,
  lastAnalysis: null,
  showGrid: true,
  showLabels: true,
  showLegend: true,
  loadStep: 100,
  history: [],
  historyIndex: -1
};

function setMode(m) {
  state.mode = m;
  if (m !== 'ADD_BEAM') state.firstBeamJoint = null;
  if (typeof updateStatusBar === 'function') updateStatusBar();
}

function getState() { return state; }

function snapshotDesign() {
  return JSON.parse(JSON.stringify({
    joints: state.joints,
    beams: state.beams,
    supports: state.supports,
    loads: state.loads
  }));
}

function applySnapshot(snapshot) {
  state.joints = JSON.parse(JSON.stringify(snapshot.joints));
  state.beams = JSON.parse(JSON.stringify(snapshot.beams));
  state.supports = JSON.parse(JSON.stringify(snapshot.supports));
  state.loads = JSON.parse(JSON.stringify(snapshot.loads));
  state.firstBeamJoint = null;
}

function initHistory() {
  state.history = [snapshotDesign()];
  state.historyIndex = 0;
}

function pushHistory() {
  if (!state.history.length) {
    initHistory();
    return;
  }
  const snapshot = snapshotDesign();
  const current = state.history[state.historyIndex];
  if (current && JSON.stringify(current) === JSON.stringify(snapshot)) {
    if (typeof updateStatusBar === 'function') updateStatusBar();
    return;
  }
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  if (state.history.length > 80) state.history.shift();
  state.historyIndex = state.history.length - 1;
  if (typeof updateStatusBar === 'function') updateStatusBar();
}

function restoreHistory(index) {
  state.historyIndex = index;
  applySnapshot(state.history[index]);
  if (typeof invalidateAnalysis === 'function') invalidateAnalysis();
  if (typeof draw === 'function') draw();
  if (typeof updateStatusBar === 'function') updateStatusBar();
}

function undo() {
  if (state.historyIndex <= 0) return;
  restoreHistory(state.historyIndex - 1);
}

function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  restoreHistory(state.historyIndex + 1);
}

function canUndo() { return state.historyIndex > 0; }
function canRedo() { return state.historyIndex < state.history.length - 1; }

function computeBudgetUsed() {
  return state.joints.length * COSTS.joint
    + state.beams.length * COSTS.beam
    + state.supports.length * COSTS.support;
}

function formatCurrency(value) {
  const number = Number(value);
  return '$' + (Number.isFinite(number) ? Math.round(number).toLocaleString('en-US') : '0');
}
