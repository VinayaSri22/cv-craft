import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { openDatabase } from './db/database.js';
import { createRateLimiter } from './http/rateLimit.js';

function buildApp(db, extra = {}) {
  const printer = { print: vi.fn(async () => new Uint8Array([1, 2, 3])) };
  const renderer = { renderResume: vi.fn(async () => ({ html: '<p>x</p>', title: 'Resume' })) };
  const app = createApp({ db, renderer, printer, logger: { error: vi.fn() }, ...extra });
  return { app, printer, renderer };
}

async function register(app, email = `user-${crypto.randomUUID()}@example.com`, password = 'password123') {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ email, password, displayName: 'Ada' });
  expect(res.status).toBe(201);
  return { agent, email, password, user: res.body.user };
}

describe('auth', () => {
  it('registers, returns the current user, and rejects a duplicate email', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const { agent, email, user } = await register(app);

    const me = await agent.get('/api/auth/me');
    expect(me.body.user).toMatchObject({ email, displayName: 'Ada', mustChangePassword: false });
    expect(me.body.user.id).toBe(user.id);

    const again = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('logs in and logs out', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const { email, password } = await register(app);

    const agent = request.agent(app);
    const bad = await agent.post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.message).toBe('Invalid email or password.');

    const good = await agent.post('/api/auth/login').send({ email, password });
    expect(good.status).toBe(200);
    expect(await agent.get('/api/auth/me')).toMatchObject({ status: 200 });

    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('rejects short passwords and a foreign origin', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const short = await request(app).post('/api/auth/register').send({ email: 'a@b.co', password: 'short' });
    expect(short.status).toBe(422);

    const evil = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'https://evil.test')
      .send({ email: 'a@b.co', password: 'password123' });
    expect(evil.status).toBe(403);
    expect(evil.body.error.code).toBe('BAD_ORIGIN');
  });

  it('rate-limits repeated login attempts', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db, { rateLimit: createRateLimiter({ limit: 2, windowMs: 60_000 }) });
    const body = { email: 'a@b.co', password: 'password123' };
    expect((await request(app).post('/api/auth/login').send(body)).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send(body)).status).toBe(401);
    const limited = await request(app).post('/api/auth/login').send(body);
    expect(limited.status).toBe(429);
  });

  it('changes the password and drops other sessions', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const { agent, email, password } = await register(app);
    const other = request.agent(app);
    await other.post('/api/auth/login').send({ email, password });

    const changed = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: password, newPassword: 'new-password' });
    expect(changed.status).toBe(200);
    expect((await other.get('/api/auth/me')).status).toBe(401);
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const relog = await request(app).post('/api/auth/login').send({ email, password: 'new-password' });
    expect(relog.status).toBe(200);
  });
});

describe('profile and resumes', () => {
  it('keeps one user’s data away from another', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const ada = await register(app, 'ada@example.com');
    const grace = await register(app, 'grace@example.com');

    const adaProfile = await ada.agent.get('/api/profile');
    const graceProfile = await grace.agent.get('/api/profile');
    expect(adaProfile.body.id).not.toBe(graceProfile.body.id);

    const resumes = await ada.agent.get('/api/resumes');
    expect(resumes.body.resumes).toHaveLength(1);
    const resumeId = resumes.body.resumes[0].id;

    expect((await grace.agent.get(`/api/resumes/${resumeId}`)).status).toBe(404);
    expect((await grace.agent.get(`/api/resumes/${resumeId}/pdf`)).status).toBe(404);
    expect((await request(app).get('/api/profile')).status).toBe(401);
  });

  it('saves a profile and resumes, and rejects a stale revision', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const { agent } = await register(app);

    const profile = await agent.get('/api/profile');
    const updated = structuredClone(profile.body.profile);
    updated.basics.fullName = 'Ada Lovelace';
    const saved = await agent.put('/api/profile').send({ revision: profile.body.revision, profile: updated });
    expect(saved.status).toBe(200);
    expect(saved.body.profile.basics.fullName).toBe('Ada Lovelace');
    expect(saved.body.revision).toBe(profile.body.revision + 1);

    const stale = await agent.put('/api/profile').send({ revision: profile.body.revision, profile: updated });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('CONFLICT');

    const resume = await agent.get(`/api/resumes/${(await agent.get('/api/resumes')).body.resumes[0].id}`);
    const renamed = await agent
      .put(`/api/resumes/${resume.body.id}`)
      .send({ revision: resume.body.revision, name: 'Research', settings: resume.body.settings });
    expect(renamed.body.name).toBe('Research');

    const second = await agent.post('/api/resumes').send({ name: 'Teaching', templateId: 'classic' });
    expect(second.status).toBe(201);
    expect((await agent.get('/api/resumes')).body.resumes).toHaveLength(2);

    expect((await agent.delete(`/api/resumes/${second.body.id}`)).status).toBe(200);
    expect((await agent.get(`/api/resumes/${second.body.id}`)).status).toBe(404);
  });

  it('renders a saved resume to a PDF', async () => {
    const db = openDatabase(':memory:');
    const { app, renderer } = buildApp(db);
    const { agent } = await register(app);
    const profile = await agent.get('/api/profile');
    const next = structuredClone(profile.body.profile);
    next.basics.fullName = 'Ada Lovelace';
    await agent.put('/api/profile').send({ revision: profile.body.revision, profile: next });
    const resumeId = (await agent.get('/api/resumes')).body.resumes[0].id;

    const pdf = await agent.get(`/api/resumes/${resumeId}/pdf`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(renderer.renderResume).toHaveBeenCalledOnce();
    expect(renderer.renderResume.mock.calls[0][0].basics.fullName).toBe('Ada Lovelace');
  });
});
