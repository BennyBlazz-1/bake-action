/* eslint-env browser */

async function loadDashboard() {
  const response = await fetch('./data/latest-run.json', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar latest-run.json (${response.status})`);
  }

  return response.json();
}

function shortSha(sha) {
  if (!sha) return '-';
  return sha.substring(0, 7);
}

function badgeClass(result) {
  const normalized = (result || '').toLowerCase();

  if (normalized === 'success') return 'success';
  if (normalized === 'failure') return 'failure';
  if (normalized === 'cancelled') return 'cancelled';
  if (normalized === 'skipped') return 'skipped';
  return 'neutral';
}

function overallResult(jobs = []) {
  if (!jobs.length) return 'neutral';
  if (jobs.some((job) => job.result === 'failure')) return 'failure';
  if (jobs.some((job) => job.result === 'cancelled')) return 'cancelled';
  if (jobs.every((job) => job.result === 'success')) return 'success';
  if (jobs.some((job) => job.result === 'skipped')) return 'skipped';
  return 'neutral';
}

function overallMessage(result) {
  switch (result) {
    case 'success':
      return 'Pipeline completado correctamente.';
    case 'failure':
      return 'El pipeline contiene al menos un job fallido.';
    case 'cancelled':
      return 'La ejecución fue cancelada.';
    case 'skipped':
      return 'La ejecución contiene jobs omitidos.';
    default:
      return 'Estado del pipeline disponible.';
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? '-';
}

function renderSummary(data) {
  setText('repository', data.repository);
  setText('workflow', data.workflow);
  setText('event', data.event);
  setText('branch', data.refName);
  setText('actor', data.actor);
  setText('runId', String(data.runId ?? '-'));
  setText('sha', shortSha(data.sha));
  setText('generatedAt', data.generatedAt);

  const link = document.getElementById('runLink');
  link.href = data.workflowUrl || '#';

  const result = overallResult(data.jobs);
  const banner = document.getElementById('statusBanner');
  banner.className = `status-banner ${badgeClass(result)}`;
  banner.textContent = overallMessage(result);
}

function renderJobs(jobs = []) {
  const container = document.getElementById('jobsContainer');
  container.innerHTML = '';

  jobs.forEach((job) => {
    const article = document.createElement('article');
    article.className = 'job-card';

    article.innerHTML = `
      <h3 class="job-title">${job.name}</h3>
      <span class="badge ${badgeClass(job.result)}">${job.result}</span>
      <p class="small">Job ID técnico: <code>${job.id}</code></p>
      <p class="small">Resultado registrado por GitHub Actions para esta etapa del pipeline.</p>
    `;

    container.appendChild(article);
  });
}

async function init() {
  try {
    const data = await loadDashboard();
    renderSummary(data);
    renderJobs(data.jobs || []);
  } catch (error) {
    const banner = document.getElementById('statusBanner');
    banner.className = 'status-banner failure';
    banner.textContent = `Error al cargar el dashboard: ${error.message}`;
  }
}

document.getElementById('reloadBtn').addEventListener('click', init);

init();