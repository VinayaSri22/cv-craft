import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { openDatabase } from './db/database.js';

const dirs = [];

function buildApp(db) {
  const uploadDir = mkdtempSync(join(tmpdir(), 'cv-craft-'));
  dirs.push(uploadDir);
  const renderer = { renderResume: vi.fn(async () => ({ html: '<p>x</p>', title: 'Resume' })) };
  const printer = { print: vi.fn(async () => new Uint8Array([1])) };
  const app = createApp({ db, renderer, printer, logger: { error: vi.fn() }, uploadDir });
  return { app, renderer };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

async function register(app) {
  const agent = request.agent(app);
  const email = `user-${crypto.randomUUID()}@example.com`;
  const res = await agent.post('/api/auth/register').send({ email, password: 'password123' });
  expect(res.status).toBe(201);
  return agent;
}

describe('json export and import', () => {
  it('downloads the profile and resumes, without a photo', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const agent = await register(app);
    const profile = (await agent.get('/api/profile')).body;
    profile.profile.basics.fullName = 'Ada Lovelace';
    profile.profile.basics.photo = { id: 'ph_missing', width: 600, height: 600 };
    expect(
      (await agent.put('/api/profile').send({ revision: profile.revision, profile: profile.profile })).status,
    ).toBe(200);

    const exported = await agent.get('/api/profile/export');
    expect(exported.status).toBe(200);
    expect(exported.headers['content-disposition']).toContain('Ada-Lovelace.json');
    expect(exported.body.format).toBe('cv-craft-export');
    expect(exported.body.profile.basics.fullName).toBe('Ada Lovelace');
    expect(exported.body.profile.basics.photo).toBeNull();
    expect(exported.body.resumes).toHaveLength(1);
    expect(exported.body.resumes[0].name).toBe('My resume');
  });

  it('replaces the account and rejects a file that is not an export', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const agent = await register(app);
    const exported = (await agent.get('/api/profile/export')).body;
    exported.profile.basics.fullName = 'Grace Hopper';
    exported.profile.basics.photo = { id: 'ph_other', width: 10, height: 10 };
    exported.resumes[0].name = 'Systems';
    exported.resumes.push({ ...exported.resumes[0], name: 'Teaching' });

    const imported = await agent.post('/api/profile/import').send(exported);
    expect(imported.status).toBe(200);
    expect(imported.body.profile.basics.fullName).toBe('Grace Hopper');
    expect(imported.body.profile.basics.photo).toBeNull();

    const resumes = await agent.get('/api/resumes');
    expect(resumes.body.resumes.map((resume) => resume.name).sort()).toEqual(['Systems', 'Teaching']);

    const bad = await agent.post('/api/profile/import').send({ format: 'other' });
    expect(bad.status).toBe(422);
    expect((await agent.get('/api/profile')).body.profile.basics.fullName).toBe('Grace Hopper');
  });
});

describe('profile photo', () => {
  it('stores a square JPEG for the owner and embeds it in the PDF', async () => {
    const db = openDatabase(':memory:');
    const { app, renderer } = buildApp(db);
    const owner = await register(app);
    const other = await register(app);
    const png = await sharp({
      create: { width: 12, height: 4, channels: 3, background: { r: 200, g: 20, b: 20 } },
    })
      .png()
      .toBuffer();

    const uploaded = await owner
      .post('/api/profile/photo')
      .field('revision', '1')
      .attach('photo', png, 'face.png');
    expect(uploaded.status).toBe(200);
    expect(uploaded.body.photo).toMatchObject({ width: 600, height: 600 });

    const photo = await owner.get(`/api/photos/${uploaded.body.photo.id}`);
    expect(photo.status).toBe(200);
    expect(photo.headers['content-type']).toBe('image/jpeg');
    expect(photo.body[0]).toBe(0xff);
    expect((await other.get(`/api/photos/${uploaded.body.photo.id}`)).status).toBe(404);

    const profile = (await owner.get('/api/profile')).body.profile;
    const settings = (await owner.get('/api/resumes')).body.resumes;
    const resume = await owner.get(`/api/resumes/${settings[0].id}`);
    await owner.post('/api/pdf').send({ profile, settings: resume.body.settings });
    const printed = renderer.renderResume.mock.calls.at(-1)[0];
    expect(printed.basics.photo.src).toMatch(/^data:image\/jpeg;base64,/);

    const removed = await owner.delete('/api/profile/photo').send({ revision: uploaded.body.revision });
    expect(removed.status).toBe(200);
    expect(removed.body.photo).toBeNull();
    expect((await owner.get(`/api/photos/${uploaded.body.photo.id}`)).status).toBe(404);
  });

  it('rejects a file that is not an image', async () => {
    const db = openDatabase(':memory:');
    const { app } = buildApp(db);
    const agent = await register(app);
    const rejected = await agent
      .post('/api/profile/photo')
      .field('revision', '1')
      .attach('photo', Buffer.from('not an image'), 'notes.txt');
    expect(rejected.status).toBe(422);
  });
});
