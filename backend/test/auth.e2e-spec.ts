import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const response = await agent
        .post('/v1/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'SecurePass123!',
          displayName: 'E2E Test',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate registration', async () => {
      const email = `dup-${Date.now()}@example.com`;

      await agent.post('/v1/auth/register').send({
        email,
        password: 'SecurePass123!',
      });

      await agent
        .post('/v1/auth/register')
        .send({
          email,
          password: 'SecurePass123!',
        })
        .expect(409);
    });

    it('should reject weak passwords', async () => {
      await agent
        .post('/v1/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should authenticate and set cookies', async () => {
      const email = `login-${Date.now()}@example.com`;
      const password = 'SecurePass123!';

      await agent.post('/v1/auth/register').send({ email, password });

      const response = await agent
        .post('/v1/auth/login')
        .send({ email, password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('access_token')]),
      );
    });

    it('should reject invalid credentials', async () => {
      await agent
        .post('/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' })
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user data when authenticated', async () => {
      const email = `me-${Date.now()}@example.com`;
      await agent.post('/v1/auth/register').send({
        email,
        password: 'SecurePass123!',
      });

      const response = await agent.get('/v1/auth/me').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(email);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should throttle excessive login attempts', async () => {
      const email = `rate-${Date.now()}@example.com`;
      await agent.post('/v1/auth/register').send({ email, password: 'SecurePass123!' });

      // Make 6 rapid requests (limit is 5/min)
      const requests = Array(6)
        .fill(null)
        .map(() =>
          agent.post('/v1/auth/login').send({ email, password: 'SecurePass123!' }),
        );

      const responses = await Promise.all(requests);
      const throttled = responses.filter((r) => r.status === 429);
      expect(throttled.length).toBeGreaterThan(0);
    });
  });
});
