/* eslint-disable @typescript-eslint/no-require-imports */

const express = require('express');

const app = express();
const APP_NAME = 'bake-action-demo';
const APP_VERSION = '1.0.0';

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    project: APP_NAME,
    message: 'API demo ejecutándose correctamente',
    description: 'Aplicación de prueba para automatización CI/CD con docker/bake-action',
    docs: {
      health: '/health',
      version: '/version',
      pipeline: '/pipeline',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/version', (req, res) => {
  res.status(200).json({
    name: APP_NAME,
    version: APP_VERSION,
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/pipeline', (req, res) => {
  res.status(200).json({
    repository: process.env.GITHUB_REPOSITORY || 'local',
    sha: process.env.GITHUB_SHA || 'local',
    ref: process.env.GITHUB_REF_NAME || 'local',
    runId: process.env.GITHUB_RUN_ID || 'local',
    actor: process.env.GITHUB_ACTOR || 'local',
  });
});

module.exports = app;