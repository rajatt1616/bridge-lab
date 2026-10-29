const MODE_LABELS = {
  SELECT: 'Select',
  ADD_JOINT: 'Add Joint',
  ADD_BEAM: 'Add Beam',
  SET_SUPPORT: 'Support',
  APPLY_LOAD: 'Load'
};

const MODE_KEYS = {
  v: 'SELECT',
  j: 'ADD_JOINT',
  b: 'ADD_BEAM',
  s: 'SET_SUPPORT',
  l: 'APPLY_LOAD'
};

function updateStatusBar() {
  const summary = document.getElementById('statusSummary');
  const text = `Active: ${MODE_LABELS[state.mode] || state.mode} | Joints: ${state.joints.length} | Beams: ${state.beams.length} | Supports: ${state.supports.length} | Loads: ${state.loads.length}`;
  if (summary && summary.textContent !== text) summary.textContent = text;

  document.querySelectorAll('.toolbar button[data-mode]').forEach(button => {
    const active = button.dataset.mode === state.mode;
    if (button.classList.contains('active') !== active) {
      button.classList.toggle('active', active);
    }
  });

  const budgetValue = document.getElementById('budgetValue');
  if (budgetValue) budgetValue.textContent = formatCurrency(BUDGET_LIMIT);

  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) undoBtn.disabled = !canUndo();
  if (redoBtn) redoBtn.disabled = !canRedo();

  syncViewControls();
}

function syncViewControls() {
  const grid = document.getElementById('settingGrid');
  const labels = document.getElementById('settingLabels');
  const legend = document.getElementById('settingLegend');
  if (grid) grid.checked = state.showGrid;
  if (labels) labels.checked = state.showLabels;
  if (legend) legend.checked = state.showLegend;

  const checks = {
    'toggle-grid': state.showGrid,
    'toggle-labels': state.showLabels,
    'toggle-legend': state.showLegend
  };
  Object.entries(checks).forEach(([action, enabled]) => {
    const button = document.querySelector(`.menu-dropdown button[data-action="${action}"] .check`);
    if (button) button.classList.toggle('off', !enabled);
  });
}

function afterViewChange() {
  syncViewControls();
  draw();
  updateStatusBar();
}

function toggleGrid() {
  state.showGrid = !state.showGrid;
  afterViewChange();
}

function toggleLabels() {
  state.showLabels = !state.showLabels;
  afterViewChange();
}

function toggleLegend() {
  state.showLegend = !state.showLegend;
  afterViewChange();
}

function closeMenus() {
  document.querySelectorAll('.menu.open').forEach(menu => {
    menu.classList.remove('open');
    const trigger = menu.querySelector('.menu-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function closeSettings() {
  const popover = document.getElementById('settingsPopover');
  if (popover) popover.hidden = true;
}

function toggleSettings() {
  const popover = document.getElementById('settingsPopover');
  if (!popover) return;
  popover.hidden = !popover.hidden;
  if (!popover.hidden) {
    closeMenus();
    syncViewControls();
  }
}

function openAbout() {
  const modal = document.getElementById('aboutModal');
  if (modal) modal.hidden = false;
}

function closeAbout() {
  const modal = document.getElementById('aboutModal');
  if (modal) modal.hidden = true;
}

function handleMenuAction(action) {
  switch (action) {
    case 'new': newDesign(); break;
    case 'save': saveDesign(); break;
    case 'load': document.getElementById('loadFile').click(); break;
    case 'export': exportImage(); break;
    case 'undo': undo(); break;
    case 'redo': redo(); break;
    case 'reset': reset(); break;
    case 'toggle-grid': toggleGrid(); break;
    case 'toggle-labels': toggleLabels(); break;
    case 'toggle-legend': toggleLegend(); break;
    case 'about': openAbout(); break;
    default: break;
  }
}

window.setMode = setMode;
window.analyze = analyze;
window.reset = reset;
window.undo = undo;
window.redo = redo;
window.updateStatusBar = updateStatusBar;
window.toggleSettings = toggleSettings;
window.openAbout = openAbout;
window.closeAbout = closeAbout;

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (e.ctrlKey || e.metaKey) {
    if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return; }
  }
  if (e.key === 'Escape') {
    if (typeof isReportOpen === 'function' && isReportOpen()) {
      closeReport();
      return;
    }
    closeMenus();
    closeSettings();
    closeAbout();
    setMode('SELECT');
    return;
  }
  if (e.key === 'Delete') { reset(); return; }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && MODE_KEYS[key]) {
    setMode(MODE_KEYS[key]);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  initHistory();
  updateStatusBar();

  document.querySelectorAll('.menu-trigger').forEach(trigger => {
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const menu = trigger.parentElement;
      const wasOpen = menu.classList.contains('open');
      closeMenus();
      if (!wasOpen) {
        menu.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.querySelectorAll('.menu-dropdown button').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      closeMenus();
      handleMenuAction(action);
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.menu')) closeMenus();
    if (!event.target.closest('#settingsPopover') && !event.target.closest('#settingsBtn')) closeSettings();
  });

  ['settingGrid', 'settingLabels', 'settingLegend'].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('change', () => {
      state.showGrid = document.getElementById('settingGrid').checked;
      state.showLabels = document.getElementById('settingLabels').checked;
      state.showLegend = document.getElementById('settingLegend').checked;
      afterViewChange();
    });
  });

  const loadFile = document.getElementById('loadFile');
  if (loadFile) {
    loadFile.addEventListener('change', () => {
      loadDesign(loadFile.files && loadFile.files[0]);
      loadFile.value = '';
    });
  }

  const modal = document.getElementById('aboutModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeAbout();
    });
  }

  draw();
  if (typeof updateDemoGuide === 'function') updateDemoGuide();
  console.log('BridgeLab Web loaded. Shortcuts: V/J/B/S/L modes, Ctrl+Z undo, Ctrl+Y redo, Esc select.');
});
