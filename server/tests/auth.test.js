/**
 * MTP PLATFORM — Tests de autenticación + consentimientos legales.
 */
import { describe, test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestDb, teardownTestDb, clearCollections, getApp } from './_helpers.js';

let app;

before(async () => {
  await setupTestDb();
  app = await getApp();
});

after(async () => { await teardownTestDb(); });
beforeEach(async () => { await clearCollections(); });

describe('POST /api/auth/register', () => {
  test('rechaza registro sin los 3 consentimientos legales', async () => {
    const r = await request(app).post('/api/auth/register').send({
      full_name: 'Pepe', email: 'pepe@test.com', password: 'secret123',
      accept_terms: true, accept_privacy: true, accept_kyc: false,
    });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /Términos.*Privacidad.*KYC/);
  });

  test('rechaza password de menos de 6 caracteres', async () => {
    const r = await request(app).post('/api/auth/register').send({
      full_name: 'Pepe', email: 'pepe@test.com', password: '123',
      accept_terms: true, accept_privacy: true, accept_kyc: true,
    });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /6 caracteres/);
  });

  test('rechaza registro con email duplicado', async () => {
    const body = {
      full_name: 'Pepe', email: 'dup@test.com', password: 'secret123',
      accept_terms: true, accept_privacy: true, accept_kyc: true,
    };
    await request(app).post('/api/auth/register').send(body);
    const r2 = await request(app).post('/api/auth/register').send(body);
    assert.equal(r2.status, 409);
  });

  test('registro válido devuelve token + crea 3 consentimientos legales en la DB', async () => {
    const r = await request(app).post('/api/auth/register').send({
      full_name: 'María García', email: 'maria@test.com', password: 'mtp1234',
      accept_terms: true, accept_privacy: true, accept_kyc: true,
      sector: 'Legal',
    });
    assert.equal(r.status, 200);
    assert.ok(r.body.token, 'debe devolver JWT');
    assert.equal(r.body.user.email, 'maria@test.com');
    assert.equal(r.body.user.role, 'usuario');
    assert.ok(!r.body.user.password_hash, 'no debe exponer password_hash');

    // Las 3 filas en legal_consents
    const { LegalConsent } = await import('../src/models/index.js');
    const consents = await LegalConsent.find({ user_id: r.body.user.id });
    assert.equal(consents.length, 3, 'debe haber 3 consentimientos (terms+privacy+kyc)');
    const types = consents.map(c => c.document_type).sort();
    assert.deepEqual(types, ['kyc', 'privacy', 'terms']);
  });

  test('as_verifier=true crea cuenta con rol verificador', async () => {
    const r = await request(app).post('/api/auth/register').send({
      full_name: 'Dr. Juan', email: 'juan@test.com', password: 'mtp1234',
      accept_terms: true, accept_privacy: true, accept_kyc: true,
      as_verifier: true, specialty: 'contador',
    });
    assert.equal(r.body.user.role, 'verificador');
  });
});

describe('POST /api/auth/login', () => {
  test('rechaza credenciales inválidas', async () => {
    const r = await request(app).post('/api/auth/login')
      .send({ email: 'no@existe.com', password: 'wrong' });
    assert.equal(r.status, 401);
  });

  test('login válido devuelve token', async () => {
    await request(app).post('/api/auth/register').send({
      full_name: 'X', email: 'x@test.com', password: 'mtp1234',
      accept_terms: true, accept_privacy: true, accept_kyc: true,
    });
    const r = await request(app).post('/api/auth/login')
      .send({ email: 'x@test.com', password: 'mtp1234' });
    assert.equal(r.status, 200);
    assert.ok(r.body.token);
  });
});

describe('GET /api/auth/me', () => {
  test('requiere autenticación', async () => {
    const r = await request(app).get('/api/auth/me');
    assert.equal(r.status, 401);
  });

  test('devuelve el usuario logueado', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      full_name: 'Y', email: 'y@test.com', password: 'mtp1234',
      accept_terms: true, accept_privacy: true, accept_kyc: true,
    });
    const r = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.user.email, 'y@test.com');
  });
});
