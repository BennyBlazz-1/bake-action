const jobDescriptions = {
  'test-node': 'Ejecuta las pruebas unitarias de la aplicación demo en Node + Express.',
  'validate-bake': 'Usa docker/bake-action para validar la definición declarativa de Docker Bake.',
  'build-smoke': 'Construye la imagen, arranca el contenedor y comprueba que responda correctamente.',
  'publish-ghcr': 'Publica la imagen automatizada en GitHub Container Registry.',
};

const internalBlueprint = [
  {
    id: 'event',
    title: 'Evento del repositorio',
    description: 'GitHub detecta un push o pull request y activa el workflow.',
  },
  {
    id: 'inputs',
    title: 'Entradas hacia bake-action',
    description: 'La acción recibe source, files y targets para ejecutar Bake dentro del fork.',
  },
  {
    id: 'validate-bake',
    title: 'Resolución de la definición Bake',
    description: 'Se interpreta docker-bake.hcl y se valida la configuración declarativa.',
  },
  {
    id: 'build-smoke',
    title: 'Ejecución del build',
    description: 'Buildx/Bake construye la imagen y se realiza una verificación básica del contenedor.',
  },
  {
    id: 'publish-ghcr',
    title: 'Publicación de artefactos',
    description: 'La imagen generada se publica en GHCR como resultado visible del pipeline.',
  },
  {
    id: 'dashboard',
    title: 'Observabilidad del proceso',
    description: 'El dashboard muestra el estado, las entradas, las salidas y la interpretación del flujo.',
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
  const normalized = (result || '').toLowerCase();

  if (normalized === 'success') return 'Correcto';
  if (normalized === 'failure') return 'Fallido';
  if (normalized === 'cancelled') return 'Cancelado';
  if (normalized === 'skipped') return 'Omitido';
  if (!normalized) return 'Sin dato';

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
    return 'El pipeline terminó correctamente y la automatización completó sus etapas principales en verde.';
  }

  if (result === 'failure') {
    return 'La ejecución contiene al menos un job fallido y requiere revisión.';
  }

  if (result === 'warning') {
    return 'La ejecución terminó con advertencias, cancelaciones o pasos omitidos.';
  }

  return 'No hay suficiente información para determinar un estado final claro.';
}

function heroTitle(result) {
  if (result === 'success') return 'Pipeline exitoso';
  if (result === 'failure') return 'Pipeline con fallos';
  if (result === 'warning') return 'Pipeline con advertencias';
  return 'Estado no determinado';
}

function heroText(result) {
  if (result === 'success') {
    return 'La automatización ejecutó correctamente las validaciones, el build y la publicación configurada.';
  }

  if (result === 'failure') {
    return 'Existe una etapa que falló y debe revisarse antes de considerar estable el flujo.';
  }

  if (result === 'warning') {
    return 'La ejecución no fue completamente limpia, aunque parte del proceso sí avanzó.';
  }

  return 'No fue posible reconstruir un estado final completo a partir de los datos disponibles.';
}

function computeStats(jobs = []) {
  const success = jobs.filter((job) => job.result === 'success').length;
  const failure = jobs.filter((job) => job.result === 'failure').length;
  const other = jobs.length - success - failure;
  const progress = jobs.length ? Math.round((success / jobs.length) * 100) : 0;

  return { success, failure, other, progress };
}

function getJobMap(jobs = []) {
  return jobs.reduce((accumulator, job) => {
    accumulator[job.id] = job;
    return accumulator;
  }, {});
}

function updateStatusVisuals(result, stats) {
  const style = normalizeResult(result);

  const banner = document.getElementById('statusBanner');
  banner.className = `status-banner ${style}`;
  banner.textContent = overallMessage(result);

  const heroBadge = document.getElementById('heroBadge');
  heroBadge.className = `badge ${style}`;
  heroBadge.textContent = badgeText(result);

  setText('heroTitle', heroTitle(result));
  setText('heroText', heroText(result));

  setText('successCount', String(stats.success));
  setText('failureCount', String(stats.failure));
  setText('otherCount', String(stats.other));
  setText('progressPercent', `${stats.progress}%`);
  setText(
    'progressText',
    `${stats.success} de ${stats.success + stats.failure + stats.other} jobs completados correctamente`
  );

  const progressFill = document.getElementById('progressFill');
  progressFill.className = `progress-fill ${style}`;
  progressFill.style.width = `${stats.progress}%`;
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

function renderInternalFlow(data) {
  const container = document.getElementById('internalFlow');
  container.innerHTML = '';

  const jobMap = getJobMap(data.jobs || []);

  internalBlueprint.forEach((step, index) => {
    let result = 'neutral';

    if (step.id === 'event' || step.id === 'inputs' || step.id === 'dashboard') {
      result = 'success';
    } else if (jobMap[step.id]) {
      result = normalizeResult(jobMap[step.id].result);
    }

    const article = document.createElement('article');
    article.className = `flow-card ${result}`;

    article.innerHTML = `
      <div class="flow-card-top">
        <div class="flow-index">${index + 1}</div>
        <span class="badge ${result}">${badgeText(jobMap[step.id]?.result || (step.id === 'event' || step.id === 'inputs' || step.id === 'dashboard' ? 'success' : 'neutral'))}</span>
      </div>
      <h3>${step.title}</h3>
      <p>${step.description}</p>
    `;

    container.appendChild(article);
  });
}

function renderInputs(data) {
  const container = document.getElementById('actionInputs');
  container.innerHTML = '';

  const items = [
    {
      title: 'Implementación usada',
      value: data.action?.implementation || 'uses: ./',
    },
    {
      title: 'Source',
      value: data.action?.source || './demo',
    },
    {
      title: 'Archivo Bake',
      value: data.action?.files || './docker-bake.hcl',
    },
    {
      title: 'Targets principales',
      value: Array.isArray(data.action?.targets) ? data.action.targets.join(', ') : '-',
    },
    {
      title: 'Motor de build',
      value: data.action?.engine || 'docker buildx bake',
    },
    {
      title: 'Propósito',
      value: data.action?.purpose || 'Validar, construir y automatizar el flujo de build del proyecto',
    },
  ];

  items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'info-item';
    article.innerHTML = `
      <strong>${item.title}</strong>
      <span><code>${item.value}</code></span>
    `;
    container.appendChild(article);
  });
}

function renderArtifacts(data) {
  const container = document.getElementById('artifactsList');
  container.innerHTML = '';

  const items = [
    {
      title: 'Imagen latest',
      value: data.artifacts?.imageLatest || '-',
    },
    {
      title: 'Imagen por SHA',
      value: data.artifacts?.imageSha || '-',
    },
    {
      title: 'Registro',
      value: data.artifacts?.registry || 'GHCR',
    },
    {
      title: 'Puerto de la app',
      value: data.artifacts?.appPort || '3000',
    },
    {
      title: 'URL de la ejecución',
      value: data.workflowUrl || '-',
    },
    {
      title: 'Ubicación del paquete',
      value: data.artifacts?.packageLocation || 'GitHub > Packages',
    },
  ];

  items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'info-item';
    article.innerHTML = `
      <strong>${item.title}</strong>
      <span><code>${item.value}</code></span>
    `;
    container.appendChild(article);
  });
}

function renderJobs(jobs = []) {
  const container = document.getElementById('jobsContainer');
  container.innerHTML = '';

  jobs.forEach((job) => {
    const style = normalizeResult(job.result);
    const description =
      jobDescriptions[job.id] ||
      'Job reportado por GitHub Actions dentro del flujo automatizado.';

    const article = document.createElement('article');
    article.className = `job-card ${style}`;

    article.innerHTML = `
      <div class="job-header">
        <h3 class="job-title">${job.name}</h3>
        <span class="badge ${style}">${badgeText(job.result)}</span>
      </div>
      <p class="job-description">${description}</p>
      <div class="job-meta">
        <strong>ID técnico:</strong> <code>${job.id}</code>
      </div>
    `;

    container.appendChild(article);
  });
}

function renderTimeline(data) {
  const container = document.getElementById('activityLog');
  container.innerHTML = '';

  const entries = [
    {
      title: 'Activación del workflow',
      text: `Se recibió el evento ${data.event} en la rama ${data.refName}, lo que disparó la automatización del repositorio.`,
      status: 'success',
    },
    {
      title: 'Configuración de la acción',
      text: `El fork usa docker/bake-action mediante ${data.action?.implementation || 'uses: ./'} con source ${data.action?.source || './demo'} y definición ${data.action?.files || './docker-bake.hcl'}.`,
      status: 'success',
    },
    ...(data.jobs || []).map((job) => ({
      title: job.name,
      text: `Resultado registrado por GitHub Actions: ${badgeText(job.result)}.`,
      status: normalizeResult(job.result),
    })),
    {
      title: 'Artefactos resultantes',
      text: `El flujo deja evidencia visible mediante el dashboard, la imagen publicada y la ejecución accesible en GitHub Actions.`,
      status: 'success',
    },
  ];

  entries.forEach((entry) => {
    const article = document.createElement('article');
    article.className = 'timeline-item';

    article.innerHTML = `
      <span class="timeline-dot ${entry.status}"></span>
      <div>
        <strong>${entry.title}</strong>
        <p>${entry.text}</p>
      </div>
    `;

    container.appendChild(article);
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
    renderInternalFlow(data);
    renderInputs(data);
    renderArtifacts(data);
    renderJobs(data.jobs || []);
    renderTimeline(data);
  } catch (error) {
    const banner = document.getElementById('statusBanner');
    banner.className = 'status-banner failure';
    banner.textContent = `Error al cargar el dashboard: ${error.message}`;

    const heroBadge = document.getElementById('heroBadge');
    heroBadge.className = 'badge failure';
    heroBadge.textContent = 'Error';

    setText('heroTitle', 'No se pudo construir la vista');
    setText('heroText', 'Verifica que latest-run.json exista y que el workflow lo haya generado correctamente.');
  } finally {
    setLoading(false);
  }
}

document.getElementById('reloadBtn').addEventListener('click', init);

init();