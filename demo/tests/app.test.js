/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-require-imports */

const request = require('supertest');
const app = require('../src/app');

describe('API bake-action-demo', () => {
  test('GET / debe responder correctamente', async () => {
    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.body.project).toBe('bake-action-demo');
    expect(response.body.docs.health).toBe('/health');
  });

  test('GET /health debe regresar status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /version debe regresar nombre y versión', async () => {
    const response = await request(app).get('/version');

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('bake-action-demo');
    expect(response.body.version).toBe('1.0.0');
  });

  test('GET /pipeline debe responder aunque esté fuera de GitHub Actions', async () => {
    const response = await request(app).get('/pipeline');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('repository');
    expect(response.body).toHaveProperty('sha');
  });
});