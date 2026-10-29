let reportSnapshotDataUrl = '';
let reportLastFocus = null;
let reportRefreshHandle = 0;

function escapeHtml(value) {
  const text = value === null || value === undefined ? '' : String(value);
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, character => entities[character]);
}

function reportStatusInfo(data) {
  const summary = (data && data.summary) || {};
  const status = String((data && data.status) || '').toUpperCase();
  const pass = Boolean(summary.pass) && status !== 'UNSTABLE' && status !== 'INVALID';
  const noLoad = status === 'OK' && Number(summary.totalLoad) <= 0;

  if (noLoad) return { label: 'Ready', tone: 'neutral', pass: true };
  if (status === 'OK' || (!status && pass)) return { label: 'Pass', tone: 'pass', pass: true };
  if (status === 'OVERLOADED') return { label: 'Overloaded', tone: 'fail', pass: false };
  if (status === 'UNSTABLE') return { label: 'Unstable', tone: 'fail', pass: false };
  if (status === 'INVALID') return { label: 'Invalid', tone: 'fail', pass: false };
  return { label: status || (pass ? 'Pass' : 'Fail'), tone: pass ? 'pass' : 'fail', pass };
}

function kpiTone(tone) {
  if (tone === 'overload') return 'is-fail';
  if (tone === 'high') return 'is-warn';
  if (tone === 'pass' || tone === 'low') return 'is-pass';
  return '';
}

function captureReportSnapshot() {
  try {
    if (typeof canvas !== 'undefined' && canvas && typeof canvas.toDataURL === 'function') {
      return canvas.toDataURL('image/png');
    }
  } catch (error) {
    return '';
  }
  return '';
}

function buildKpis(data) {
  const summary = data.summary || {};
  const budget = computeBudgetUsed();
  const supportCount = state.supports.length;
  const loadCount = state.loads.length;
  const governingMember = summary.maxForceMember && summary.maxForceMember !== 'BRIDGE' ? summary.maxForceMember : '\u2014';
  const items = [
    { label: 'Total load', value: formatNumber(summary.totalLoad, ' kN'), note: 'Applied downward load' },
    { label: 'Capacity', value: Number(summary.capacity) > 0 ? formatNumber(summary.capacity, ' kN') : '\u2014', note: 'Governing member estimate' },
    { label: 'Max utilization', value: formatNumber(summary.maxUtilization, '%'), note: '100% = member limit', tone: kpiTone(utilizationTone(summary.maxUtilization)) },
    { label: 'Governing member', value: governingMember, note: 'Highest utilization' },
    { label: 'Overloaded members', value: String(Number(summary.overloadedCount) || 0), note: 'At or above capacity', tone: Number(summary.overloadedCount) > 0 ? 'is-fail' : 'is-pass' },
    { label: 'Member length', value: formatNumber(summary.totalLength, ' u'), note: 'Total analyzed length' },
    { label: 'Budget used', value: formatCurrency(budget), note: 'Limit ' + formatCurrency(BUDGET_LIMIT), tone: budget > BUDGET_LIMIT ? 'is-warn' : '' },
    { label: 'Model', value: state.joints.length + 'J / ' + state.beams.length + 'B', note: supportCount + ' support' + (supportCount === 1 ? '' : 's') + ' \u00b7 ' + loadCount + ' load' + (loadCount === 1 ? '' : 's') }
  ];

  return '<div class="report-kpis">' + items.map(item => `
    <div class="report-kpi">
      <div class="report-kpi-label">${escapeHtml(item.label)}</div>
      <div class="report-kpi-value ${item.tone || ''}">${escapeHtml(item.value)}</div>
      <div class="report-kpi-note">${escapeHtml(item.note)}</div>
    </div>`).join('') + '</div>';
}

function buildGauge(data) {
  const summary = data.summary || {};
  const utilization = Number(summary.maxUtilization) || 0;
  const width = Math.min(100, Math.max(0, utilization));
  const tone = utilizationTone(utilization);

  return `
    <div class="report-gauge" aria-label="Stress utilization ${Math.round(utilization)} percent">
      <div class="report-gauge-track">
        <div class="report-gauge-fill" style="width:${width}%" data-tone="${escapeHtml(tone)}"></div>
        <span class="report-gauge-tick" aria-hidden="true"></span>
      </div>
      <div class="report-gauge-scale"><span>0%</span><span>65% caution</span><span>100% limit</span></div>
    </div>`;
}

function buildMemberSection(data) {
  const members = Array.isArray(data.members) ? data.members : [];
  if (!members.length) return '';

  const summary = data.summary || {};
  const sorted = [...members].sort((a, b) => Number(b.utilization) - Number(a.utilization));
  const rows = sorted.map(member => {
    const utilization = Number(member.utilization) || 0;
    const tone = utilizationTone(utilization);
    const overloaded = Boolean(member.overloaded) || utilization >= 100;
    const type = String(member.type || '').toUpperCase();
    const typeClass = type === 'TENSION' ? 'is-tension' : type === 'COMPRESSION' ? 'is-compression' : 'is-zero';
    const governing = member.id === summary.maxForceMember;
    const width = Math.min(100, Math.max(0, utilization));

    return `<tr class="${governing ? 'is-governing' : ''}">
      <td class="num">${escapeHtml(member.id || '-')}${governing ? ' <span class="report-tag is-governing">Governing</span>' : ''}</td>
      <td><span class="report-type ${typeClass}">${escapeHtml(type || '-')}</span></td>
      <td class="num">${escapeHtml(formatNumber(member.force))}</td>
      <td><div class="report-util"><div class="report-util-track"><div class="report-util-fill" style="width:${width}%" data-tone="${escapeHtml(tone)}"></div></div><span class="report-util-value">${escapeHtml(formatNumber(utilization, '%'))}</span></div></td>
      <td>${overloaded ? '<span class="report-tag is-overload">Overload</span>' : '<span class="report-tag is-ok">OK</span>'}</td>
    </tr>`;
  }).join('');

  return `<section class="report-section">
    <h3>Member results</h3>
    <div class="report-table-wrap">
      <table class="report-table">
        <thead><tr><th>Member</th><th>Type</th><th>Force (kN)</th><th>Utilization</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

function buildReactionSection(data) {
  const reactions = Array.isArray(data.reactions) ? data.reactions : [];
  if (!reactions.length) return '';

  const supportTypes = new Map((state.supports || []).map(support => [support.joint, support.type]));
  const rows = reactions.filter(reaction =>
    Math.abs(Number(reaction.rx) || 0) > 0.05 || Math.abs(Number(reaction.ry) || 0) > 0.05
  );
  if (!rows.length) return '';

  return `<section class="report-section">
    <h3>Support reactions</h3>
    <div class="report-table-wrap">
      <table class="report-table">
        <thead><tr><th>Joint</th><th>Support</th><th>Rx (kN)</th><th>Ry (kN)</th></tr></thead>
        <tbody>${rows.map(reaction => `<tr>
          <td class="num">${escapeHtml(reaction.joint || '-')}</td>
          <td>${escapeHtml(supportTypes.get(reaction.joint) || '\u2014')}</td>
          <td class="num">${escapeHtml(formatNumber(reaction.rx))}</td>
          <td class="num">${escapeHtml(formatNumber(reaction.ry))}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  </section>`;
}

function buildDesignSection(data) {
  const summary = data.summary || {};
  const budget = computeBudgetUsed();
  const items = [
    ['Material', 'Steel'],
    ['Joints', String(state.joints.length)],
    ['Beams', String(state.beams.length)],
    ['Supports', String(state.supports.length)],
    ['Loads', String(state.loads.length)],
    ['Analyzed length', formatNumber(summary.totalLength, ' u')],
    ['Budget used', formatCurrency(budget)],
    ['Budget limit', formatCurrency(BUDGET_LIMIT)]
  ];

  return `<section class="report-section">
    <h3>Design summary</h3>
    <div class="report-summary-grid">
      ${items.map(([label, value]) => `<div class="report-summary-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}
    </div>
  </section>`;
}

function buildGuidance(data) {
  const status = String((data && data.status) || '').toUpperCase();
  if (status !== 'UNSTABLE' && status !== 'INVALID') return '';

  return `<div class="report-callout">
    <strong>What to check</strong>
    <ul>
      <li>Add at least two supports, including one pinned support.</li>
      <li>Make sure every member connects to the supported load path.</li>
      <li>Apply the load to a joint that is part of the bridge.</li>
    </ul>
  </div>`;
}

function buildReportHtml(data) {
  const status = reportStatusInfo(data);
  const summary = (data && data.summary) || {};
  const overloadedCount = Number(summary.overloadedCount) || 0;
  const rawMessage = (data && data.message) || (status.pass ? 'Analysis completed.' : 'Analysis failed.');
  const message = rawMessage.replace('member(s)', overloadedCount === 1 ? 'member' : 'members');
  const snapshot = reportSnapshotDataUrl
    ? `<figure class="report-snapshot">
        <img src="${reportSnapshotDataUrl}" alt="Current bridge design with stress overlay">
        <figcaption>Current design with stress overlay</figcaption>
      </figure>`
    : '';

  return `
    <header class="report-header">
      <div class="report-header-main">
        <h2 class="report-title" id="reportTitle">Analysis report</h2>
        <p class="report-subtitle">${escapeHtml(message)}</p>
        <p class="report-meta">Generated ${escapeHtml(new Date().toLocaleString())} \u00b7 BridgeLab</p>
      </div>
      <span class="report-status is-${status.tone}">${escapeHtml(status.label)}</span>
    </header>
    ${snapshot}
    <section class="report-section">
      <h3>Key metrics</h3>
      ${buildKpis(data)}
      ${buildGauge(data)}
    </section>
    ${buildMemberSection(data)}
    ${buildReactionSection(data)}
    ${buildDesignSection(data)}
    ${buildGuidance(data)}
    <p class="report-disclaimer">Educational simulation only. Not a certified engineering tool.</p>
    <div class="report-actions">
      <button class="btn-secondary" type="button" data-report-action="print">Print / Save as PDF</button>
      <button class="btn-secondary" type="button" data-report-action="download" ${reportSnapshotDataUrl ? '' : 'disabled'}>Download bridge PNG</button>
      <button class="btn-primary" type="button" data-report-action="close">Close</button>
    </div>
  `;
}

function buildEmptyReportHtml() {
  return `
    <header class="report-header">
      <div class="report-header-main">
        <h2 class="report-title" id="reportTitle">Analysis report</h2>
        <p class="report-subtitle">No analysis yet. Run Analyze or Run Test to generate a report.</p>
      </div>
      <span class="report-status is-neutral">No data</span>
    </header>
    <div class="report-empty">
      <h3>Nothing to report yet</h3>
      <p>Add supports and a load, then analyze the bridge. The report will include member forces, support reactions, utilization, and a bridge snapshot.</p>
      <button class="btn-primary" type="button" data-report-action="analyze">Analyze now</button>
    </div>
    <div class="report-actions">
      <button class="btn-secondary" type="button" data-report-action="close">Close</button>
    </div>
  `;
}

function downloadReportImage() {
  const source = reportSnapshotDataUrl || captureReportSnapshot();
  if (!source) return;
  const link = document.createElement('a');
  link.download = 'bridgelab-bridge.png';
  link.href = source;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printReport() {
  document.body.classList.add('printing-report');
  try {
    window.print();
  } catch (error) {
    document.body.classList.remove('printing-report');
    throw error;
  }
}

function refreshReport(immediate) {
  const modal = document.getElementById('reportModal');
  if (!modal || modal.hidden) return;
  const content = document.getElementById('reportContent');
  if (!content) return;

  const render = () => {
    if (modal.hidden) return;

    const data = state.lastAnalysis;
    reportSnapshotDataUrl = captureReportSnapshot();
    content.innerHTML = data ? buildReportHtml(data) : buildEmptyReportHtml();

    const analyzeButton = content.querySelector('[data-report-action="analyze"]');
    if (analyzeButton) {
      analyzeButton.addEventListener('click', () => {
        analyzeButton.disabled = true;
        analyzeButton.textContent = 'Analyzing...';
        Promise.resolve(analyze()).finally(() => refreshReport());
      });
    }

    const printButton = content.querySelector('[data-report-action="print"]');
    if (printButton) printButton.addEventListener('click', printReport);

    const downloadButton = content.querySelector('[data-report-action="download"]');
    if (downloadButton) downloadButton.addEventListener('click', downloadReportImage);

    content.querySelectorAll('[data-report-action="close"]').forEach(button => {
      button.addEventListener('click', closeReport);
    });
  };

  if (reportRefreshHandle) {
    cancelAnimationFrame(reportRefreshHandle);
    reportRefreshHandle = 0;
  }

  if (immediate) {
    render();
    return;
  }

  reportRefreshHandle = requestAnimationFrame(() => {
    reportRefreshHandle = 0;
    render();
  });
}

function openReport() {
  const modal = document.getElementById('reportModal');
  if (!modal) return;
  reportLastFocus = document.activeElement;
  modal.hidden = false;
  refreshReport(true);
  const closeButton = modal.querySelector('.modal-close');
  if (closeButton) closeButton.focus();
}

function closeReport() {
  const modal = document.getElementById('reportModal');
  if (!modal || modal.hidden) return;
  if (reportRefreshHandle) {
    cancelAnimationFrame(reportRefreshHandle);
    reportRefreshHandle = 0;
  }
  modal.hidden = true;
  if (reportLastFocus && typeof reportLastFocus.focus === 'function') {
    reportLastFocus.focus();
  }
  reportLastFocus = null;
}

function isReportOpen() {
  const modal = document.getElementById('reportModal');
  return Boolean(modal && !modal.hidden);
}

window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('reportModal');
  if (!modal) return;
  modal.addEventListener('click', event => {
    if (event.target === modal) closeReport();
  });
});

window.addEventListener('beforeprint', () => {
  if (isReportOpen()) document.body.classList.add('printing-report');
});

window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-report');
});

window.openReport = openReport;
window.closeReport = closeReport;
window.refreshReport = refreshReport;
window.isReportOpen = isReportOpen;
window.printReport = printReport;
