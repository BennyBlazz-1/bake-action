const express = require('express');
const pkg = require('../package.json');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    project: 'bake-action-demo',
    message: 'API demo ejecutándose correctamente',
    description: 'Aplicación de prueba para automatización CI/CD con docker/bake-action',
    docs: {
      health: '/health',
      version: '/version',
      pipeline: '/pipeline'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/version', (req, res) => {
  res.status(200).json({
    name: pkg.name,
    version: pkg.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/pipeline', (req, res) => {
  res.status(200).json({
    repository: process.env.GITHUB_REPOSITORY || 'local',
    sha: process.env.GITHUB_SHA || 'local',
    ref: process.env.GITHUB_REF_NAME || 'local',
    runId: process.env.GITHUB_RUN_ID || 'local',
    actor: process.env.GITHUB_ACTOR || 'local'
  });
});

module.exports = app;