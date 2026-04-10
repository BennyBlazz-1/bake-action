const jobDescriptions = {
  'test-node': 'Ejecuta pruebas unitarias de la aplicación Node + Express.',
  'validate-bake': 'Valida la definición declarativa del build usando Docker Bake.',
  'build-smoke': 'Construye la imagen y verifica que el contenedor responda correctamente.',
  'publish-ghcr': 'Publica la imagen automatizada en GitHub Container Registry.',
};

const pipelineBlueprint = [
  {
    id: 'event',
    label: 'Evento recibido',
    description: 'GitHub detecta el push o pull request y dispara el workflow.',
  },
  {
    id: 'test-node',
    label: 'Pruebas unitarias',
    description: 'Validación inicial del comportamiento de la aplicación.',
  },
  {
    id: 'validate-bake',
    label: 'Validación Bake',
    description: 'Comprobación del flujo de construcción declarativo.',
  },
  {
    id: 'build-smoke',
    label: 'Build y smoke test',
    description: 'Construcción de imagen y arranque de prueba del contenedor.',
  },
  {
    id: 'publish-ghcr',
    label: 'Publicación de imagen',
    description: 'Envío automatizado de la imagen al registro de contenedores.',
  },
  {
    id: 'dashboard',
    label: 'Dashboard en línea',
    description: 'Publicación del tablero visual para seguimiento del pipeline.',
  },
];

function setLoading(isLoading) {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.toggle('active', isLoading);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value ?? '-';
  }
}

function shortSha(sha) {
  return sha ? sha.substring(0, 7) : '-';
}

function normalizeResult(result) {
  const normalized = (result || '').toLowerCase();

  if (normalized === 'success') return 'success';
  if (normalized === 'failure') return 'failure';
  if (normalized === 'cancelled' || normalized === 'skipped') return 'warning';
  return 'neutral';
}

function badgeText(result) {
  if (!result) return 'Sin dato';

  const normalized = result.toLowerCase();

  if (normalized === 'success') return 'Correcto';
  if (normalized === 'failure') return 'Fallido';
  if (normalized === 'cancelled') return 'Cancelado';
  if (normalized === 'skipped') return 'Omitido';

  return result;
}

function overallResult(jobs = []) {
  if (!jobs.length) return 'neutral';
  if (jobs.some((job) => job.result === 'failure')) return 'failure';
  if (jobs.some((job) => job.result === 'cancelled')) return 'warning';
  if (jobs.some((job) => job.result === 'skipped')) return 'warning';
  if (jobs.every((job) => job.result === 'success')) return 'success';
  return 'neutral';
}

function overallMessage(result) {
  if (result === 'success') {
    return 'Pipeline completado correctamente. La automatización terminó sin errores.';
  }

  if (result === 'failure') {
    return 'Se detectó al menos un fallo dentro del pipeline automatizado.';
  }

  if (result === 'warning') {
    return 'La ejecución terminó con advertencias, cancelaciones o pasos omitidos.';
  }

  return 'No fue posible determinar un estado final completamente claro.';
}

function heroTitle(result) {
  if (result === 'success') return 'Ejecución exitosa';
  if (result === 'failure') return 'Ejecución con fallos';
  if (result === 'warning') return 'Ejecución con advertencias';
  return 'Estado indefinido';
}

function heroText(result) {
  if (result === 'success') {
    return 'Todas las validaciones críticas del flujo terminaron en verde.';
  }

  if (result === 'failure') {
    return 'Hay al menos un job que requiere revisión antes de considerar estable el pipeline.';
  }

  if (result === 'warning') {
    return 'La ejecución presentó un estado intermedio o no completamente exitoso.';
  }

  return 'No hay suficiente información para mostrar un estado concluyente.';
}

function computeStats(jobs = []) {
  const success = jobs.filter((job) => job.result === 'success').length;
  const failure = jobs.filter((job) => job.result === 'failure').length;
  const other = jobs.length - success - failure;

  const progress = jobs.length ? Math.round((success / jobs.length) * 100) : 0;

  return { success, failure, other, progress };
}

function updateStatusVisuals(result, stats) {
  const normalized = normalizeResult(result);

  const banner = document.getElementById('statusBanner');
  banner.className = `status-banner ${normalized}`;
  banner.textContent = overallMessage(result);

  const heroPill = document.getElementById('heroStatusPill');
  heroPill.className = `status-pill ${normalized}`;
  heroPill.textContent = badgeText(result);

  setText('heroStatusTitle', heroTitle(result));
  setText('heroStatusText', heroText(result));

  setText('successCount', String(stats.success));
  setText('failureCount', String(stats.failure));
  setText('otherCount', String(stats.other));
  setText('progressPercent', `${stats.progress}%`);
  setText('progressText', `${stats.success} de ${stats.success + stats.failure + stats.other} jobs correctos`);

  const fill = document.getElementById('progressFill');
  fill.className = `progress-fill ${normalized}`;
  fill.style.width = `${stats.progress}%`;
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

  const runLink = document.getElementById('runLink');
  runLink.href = data.workflowUrl || '#';

  const stats = computeStats(data.jobs || []);
  const result = overallResult(data.jobs || []);
  updateStatusVisuals(result, stats);
}

function getJobMap(jobs = []) {
  return jobs.reduce((accumulator, job) => {
    accumulator[job.id] = job;
    return accumulator;
  }, {});
}

function renderPipeline(data) {
  const container = document.getElementById('pipelineSteps');
  container.innerHTML = '';

  const jobMap = getJobMap(data.jobs || []);

  pipelineBlueprint.forEach((step, index) => {
    let status = 'neutral';

    if (step.id === 'event') {
      status = 'success';
    } else if (step.id === 'dashboard') {
      status = 'success';
    } else if (jobMap[step.id]) {
      status = normalizeResult(jobMap[step.id].result);
    }

    const card = document.createElement('article');
    card.className = `pipeline-step ${status}`;

    card.innerHTML = `
      <div class="step-top">
        <div class="step-index">${index + 1}</div>
        <span class="step-status">${badgeText(jobMap[step.id]?.result || (step.id === 'event' || step.id === 'dashboard' ? 'success' : 'neutral'))}</span>
      </div>
      <h3>${step.label}</h3>
      <p>${step.description}</p>
    `;

    container.appendChild(card);
  });
}

function renderJobs(jobs = []) {
  const container = document.getElementById('jobsContainer');
  container.innerHTML = '';

  jobs.forEach((job) => {
    const normalized = normalizeResult(job.result);
    const description = jobDescriptions[job.id] || 'Job reportado por GitHub Actions dentro del pipeline.';

    const article = document.createElement('article');
    article.className = `job-card ${normalized}`;

    article.innerHTML = `
      <div class="job-header">
        <h3 class="job-title">${job.name}</h3>
        <span class="status-pill ${normalized}">${badgeText(job.result)}</span>
      </div>
      <p class="job-description">${description}</p>
      <div class="job-meta">
        <strong>ID técnico:</strong> <code>${job.id}</code>
      </div>
    `;

    container.appendChild(article);
  });
}

function renderActivityLog(data) {
  const container = document.getElementById('activityLog');
  container.innerHTML = '';

  const entries = [
    {
      title: 'Workflow activado',
      text: `Se detectó el evento ${data.event} en la rama ${data.refName}.`,
      status: 'success',
    },
    ...(data.jobs || []).map((job) => ({
      title: job.name,
      text: `Resultado reportado por GitHub Actions: ${badgeText(job.result)}.`,
      status: normalizeResult(job.result),
    })),
    {
      title: 'Dashboard generado',
      text: 'La visualización fue publicada y refleja el estado más reciente del pipeline.',
      status: 'success',
    },
  ];

  entries.forEach((entry) => {
    const item = document.createElement('article');
    item.className = 'activity-item';

    item.innerHTML = `
      <span class="activity-dot ${entry.status}"></span>
      <div>
        <strong>${entry.title}</strong>
        <p>${entry.text}</p>
      </div>
    `;

    container.appendChild(item);
  });
}

async function loadDashboard() {
  const response = await fetch('./data/latest-run.json', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar latest-run.json (${response.status})`);
  }

  return response.json();
}

async function init() {
  try {
    setLoading(true);

    const data = await loadDashboard();

    renderSummary(data);
    renderPipeline(data);
    renderJobs(data.jobs || []);
    renderActivityLog(data);
  } catch (error) {
    const banner = document.getElementById('statusBanner');
    banner.className = 'status-banner failure';
    banner.textContent = `Error al cargar el dashboard: ${error.message}`;

    const heroPill = document.getElementById('heroStatusPill');
    heroPill.className = 'status-pill failure';
    heroPill.textContent = 'Error';

    setText('heroStatusTitle', 'No se pudo cargar el dashboard');
    setText('heroStatusText', 'Verifica que latest-run.json exista y que el workflow haya publicado la información.');
  } finally {
    setLoading(false);
  }
}

document.getElementById('reloadBtn').addEventListener('click', init);

init();