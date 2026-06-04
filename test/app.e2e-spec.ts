import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('App', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns REST health status', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200).expect(({ body }) => {
      expect(body.ok).toBe(true);
      expect(body.status).toBe('ok');
    });
  });

  it('returns GraphQL health status', async () => {
    await request(app.getHttpServer())
      .post('/api/graphql')
      .set('Content-Type', 'application/json')
      .set('Apollo-Require-Preflight', 'true')
      .send({
        query: '{ health { status message timestamp } }',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.health.status).toBe('ok');
      });
  });
});
