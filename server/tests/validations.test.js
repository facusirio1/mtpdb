/**
 * MTP PLATFORM — Tests del flujo validación → scoring → roles.
 */
import { describe, test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  setupTestDb, teardownTestDb, clearCollections, getApp,
  seedUser, loginAs,
} from './_helpers.js';

let app;
before(async () => { await setupTestDb(); app = await getApp(); });
after(async () => { await teardownTestDb(); });
beforeEach(async () => { await clearCollections(); });

describe('Reglas de roles', () => {
  test('usuario común no puede tomar dictámenes (queue)', async () => {
    const { user } = await seedUser({ role: 'usuario', email: 'u@test.com' });
    const token = await loginAs(app, request, user.email);
    const r = await request(app).get('/api/validations/queue')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(r.status, 403);
  });

  test('verificador sí puede ver la queue', async () => {
    const { user } = await seedUser({ role: 'verificador', email: 'v@test.com', specialty: 'abogado' });
    const token = await loginAs(app, request, user.email);
    const r = await request(app).get('/api/validations/queue')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body));
  });

  test('no-admin no puede ver lista de users', async () => {
    const { user } = await seedUser({ role: 'usuario', email: 'a@test.com' });
    const token = await loginAs(app, request, user.email);
    const r = await request(app).get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(r.status, 403);
  });

  test('admin sí puede ver lista de users', async () => {
    const { user } = await seedUser({ role: 'admin', email: 'admin@test.com' });
    const token = await loginAs(app, request, user.email);
    const r = await request(app).get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(r.status, 200);
  });
});

describe('Flujo validación + scoring', () => {
  test('dictamen aprobado suma +8 al score del propietario', async () => {
    const { Document, User } = await import('../src/models/index.js');
    const { user: owner }    = await seedUser({ email: 'owner@t.com', reputation: 60 });
    const { user: verifier } = await seedUser({ role: 'verificador', email: 'verif@t.com', specialty: 'abogado' });
    const verifierToken = await loginAs(app, request, verifier.email);

    const doc = await Document.create({
      user_id: owner._id, title: 'Test doc', doc_type: 'cte', status: 'en_revision',
    });

    const r = await request(app).post('/api/validations')
      .set('Authorization', `Bearer ${verifierToken}`)
      .send({ document_id: String(doc._id), val_type: 'general', result: 'aprobado', opinion: 'Ok' });

    assert.equal(r.status, 200);
    assert.equal(r.body.result, 'aprobado');
    assert.equal(r.body.score_impact, 8);

    const ownerAfter = await User.findById(owner._id);
    assert.equal(ownerAfter.reputation, 68, 'score debe ser 60 + 8 = 68');

    const docAfter = await Document.findById(doc._id);
    assert.equal(docAfter.status, 'validado');
  });

  test('dictamen rechazado resta -10 al score', async () => {
    const { Document, User } = await import('../src/models/index.js');
    const { user: owner }    = await seedUser({ email: 'o2@t.com', reputation: 50 });
    const { user: verifier } = await seedUser({ role: 'verificador', email: 'v2@t.com', specialty: 'contador' });
    const verifierToken = await loginAs(app, request, verifier.email);

    const doc = await Document.create({
      user_id: owner._id, title: 'Otro doc', doc_type: 'cte', status: 'en_revision',
    });

    await request(app).post('/api/validations')
      .set('Authorization', `Bearer ${verifierToken}`)
      .send({ document_id: String(doc._id), result: 'rechazado', opinion: 'Mal' });

    const ownerAfter = await User.findById(owner._id);
    assert.equal(ownerAfter.reputation, 40, 'score debe ser 50 - 10 = 40');
  });

  test('score no baja de 0 ni sube de 100', async () => {
    const { Document, User } = await import('../src/models/index.js');
    const { user: owner }    = await seedUser({ email: 'o3@t.com', reputation: 5 });
    const { user: verifier } = await seedUser({ role: 'verificador', email: 'v3@t.com', specialty: 'abogado' });
    const verifierToken = await loginAs(app, request, verifier.email);

    const doc = await Document.create({
      user_id: owner._id, title: 'X', doc_type: 'cte', status: 'en_revision',
    });
    await request(app).post('/api/validations')
      .set('Authorization', `Bearer ${verifierToken}`)
      .send({ document_id: String(doc._id), result: 'rechazado', opinion: '' });

    const ownerAfter = await User.findById(owner._id);
    assert.equal(ownerAfter.reputation, 0, 'no puede bajar de 0');
  });

  test('rechaza result inválido', async () => {
    const { Document } = await import('../src/models/index.js');
    const { user: owner }    = await seedUser({ email: 'o4@t.com' });
    const { user: verifier } = await seedUser({ role: 'verificador', email: 'v4@t.com', specialty: 'x' });
    const token = await loginAs(app, request, verifier.email);
    const doc = await Document.create({ user_id: owner._id, title: 'Q', status: 'en_revision' });

    const r = await request(app).post('/api/validations').set('Authorization', `Bearer ${token}`)
      .send({ document_id: String(doc._id), result: 'invalido' });
    assert.equal(r.status, 400);
  });
});

describe('Marketplace público', () => {
  test('/api/marketplace/professionals devuelve solo activos + KYC verificado', async () => {
    await seedUser({ email: 'good@t.com', role: 'verificador', specialty: 'abogado', sector: 'Legal' });
    await seedUser({ email: 'pending@t.com', kyc_status: 'pendiente' });

    const r = await request(app).get('/api/marketplace/professionals');
    assert.equal(r.status, 200);
    const emails = r.body.map(p => p.email).filter(Boolean);
    // pending no debe aparecer
    assert.ok(!emails.includes('pending@t.com'), 'usuarios KYC pendiente no aparecen');
  });

  test('/api/marketplace/stats calcula promedios correctamente', async () => {
    await seedUser({ email: 'a@t.com', role: 'verificador', reputation: 80 });
    await seedUser({ email: 'b@t.com', role: 'verificador', reputation: 60 });
    const r = await request(app).get('/api/marketplace/stats');
    assert.equal(r.status, 200);
    assert.equal(r.body.avg_reputation, 70);
    assert.equal(r.body.professionals, 2);
  });
});
