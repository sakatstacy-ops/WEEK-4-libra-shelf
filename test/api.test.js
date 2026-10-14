require('dotenv').config();

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');
const Genre = require('../models/Genre');
const Session = require('../models/Session');
const User = require('../models/User');

const testDatabase = 'library_catalog_api_test';
const mongoUri = process.env.TEST_MONGODB_URI || `mongodb://127.0.0.1:27017/${testDatabase}`;
let genre;
let otherGenre;
let librarianToken;

function bookPayload(overrides = {}) {
  return {
    title: 'Dune Test Edition',
    author: 'Frank Herbert',
    isbn: '9781234500001',
    description: 'A test book for API integration coverage.',
    coverImage: 'https://example.com/dune-test.jpg',
    totalCopies: 8,
    availableCopies: 5,
    genre: String(genre._id),
    ...overrides,
  };
}

before(async () => {
  await mongoose.connect(mongoUri);
  await Promise.all([Book.deleteMany({}), Genre.deleteMany({}), Session.deleteMany({}), User.deleteMany({})]);
  [genre, otherGenre] = await Genre.create([
    { name: 'Test Science Fiction', slug: 'test-science-fiction' },
    { name: 'Test Mystery', slug: 'test-mystery' },
  ]);
  await User.create({
    email: 'test-librarian@example.com',
    passwordHash: await bcrypt.hash('test-librarian-password-123', 4),
    role: 'librarian',
  });
  const login = await request(app).post('/api/auth/login').send({
    email: 'test-librarian@example.com',
    password: 'test-librarian-password-123',
  }).expect(200);
  librarianToken = login.body.token;
});

after(async () => {
  await Promise.all([Book.deleteMany({}), Genre.deleteMany({}), Session.deleteMany({}), User.deleteMany({})]);
  await mongoose.disconnect();
});

function asLibrarian(requestBuilder) {
  return requestBuilder.set('Authorization', `Bearer ${librarianToken}`);
}

test('health and book list return JSON with pagination metadata', async () => {
  await Book.create([
    bookPayload({ isbn: '9781234500002', title: 'Dune Test One' }),
    bookPayload({ isbn: '9781234500003', title: 'Dune Test Two' }),
    bookPayload({ isbn: '9781234500004', title: 'Other Test', author: 'Dune Author', genre: String(otherGenre._id) }),
  ]);

  const health = await request(app).get('/health').expect(200);
  assert.equal(health.body.status, 'ok');

  const response = await request(app)
    .get(`/books?genre=${genre._id}&search=dune&page=2&limit=1`)
    .expect(200);
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.pagination.total, 2);
  assert.equal(response.body.pagination.totalPages, 2);
  assert.equal(response.body.pagination.page, 2);
  assert.equal(response.body.data[0].genre.name, 'Test Science Fiction');
});

test('book search matches author case-insensitively and ignores regex syntax', async () => {
  const authorMatch = await request(app).get('/books?search=FRANK%20HERBERT&limit=20').expect(200);
  assert.equal(authorMatch.body.pagination.total, 2);

  const escaped = await request(app).get('/books?search=%5B&limit=20').expect(200);
  assert.equal(escaped.body.pagination.total, 0);
});

test('empty and malformed book bodies return field-specific 400 JSON', async () => {
  await request(app).post('/books').send({}).expect(401);

  const empty = await asLibrarian(request(app).post('/books')).send({}).expect(400);
  assert.equal(empty.body.error, 'Validation failed');
  assert.ok(empty.body.fields.some((issue) => issue.field === 'title'));
  assert.equal(JSON.stringify(empty.body).includes('ValidationError'), false);

  const wrongType = await asLibrarian(request(app).post('/books')).send(bookPayload({ totalCopies: 'many' })).expect(400);
  assert.ok(wrongType.body.fields.some((issue) => issue.field === 'totalCopies'));

  const missingGenre = await asLibrarian(request(app).post('/books')).send(bookPayload({ genre: '012345678901234567890123' })).expect(400);
  assert.ok(missingGenre.body.fields.some((issue) => issue.field === 'genre'));
});

test('book CRUD creates, reads, updates, and deletes with expected statuses', async () => {
  const created = await asLibrarian(request(app).post('/books')).send(bookPayload({ isbn: '9781234500010' })).expect(201);
  const id = created.body.data._id;
  assert.equal(created.body.data.genre.name, 'Test Science Fiction');

  const read = await request(app).get(`/books/${id}`).expect(200);
  assert.equal(read.body.data.isbn, '9781234500010');

  const updated = await asLibrarian(request(app).put(`/books/${id}`)).send(bookPayload({
    title: 'Updated Dune Test',
    isbn: '9781234500011',
  })).expect(200);
  assert.equal(updated.body.data.title, 'Updated Dune Test');

  await asLibrarian(request(app).delete(`/books/${id}`)).expect(204);
  await request(app).get(`/books/${id}`).expect(404);
});

test('genre CRUD and referenced-genre delete protection work', async () => {
  const created = await request(app).post('/genres').send({ name: 'Temporary Genre', slug: 'temporary-genre' }).expect(201);
  const id = created.body.data._id;

  const list = await request(app).get('/genres').expect(200);
  assert.ok(list.body.data.some((item) => item._id === id));

  const read = await request(app).get(`/genres/${id}`).expect(200);
  assert.equal(read.body.data.slug, 'temporary-genre');

  await request(app).put(`/genres/${id}`).send({ name: 'Renamed Genre', slug: 'renamed-genre' }).expect(200);
  await request(app).delete(`/genres/${id}`).expect(204);

  await asLibrarian(request(app).post('/books')).send(bookPayload({ isbn: '9781234500012' })).expect(201);
  await request(app).delete(`/genres/${genre._id}`).expect(409);
});

test('invalid IDs and paging values are JSON errors, not server errors', async () => {
  const invalidId = await request(app).get('/genres/not-an-id').expect(400);
  assert.ok(invalidId.body.error);

  const invalidPage = await request(app).get('/books?page=0').expect(400);
  assert.ok(invalidPage.body.fields.some((issue) => issue.field === 'page'));

  await request(app).get('/books/aaaaaaaaaaaaaaaaaaaaaaaa').expect(404);
  await request(app).get('/genres/aaaaaaaaaaaaaaaaaaaaaaaa').expect(404);
  const missingRoute = await request(app).get('/not-a-route').expect(404);
  assert.ok(missingRoute.body.error);
  assert.equal(JSON.stringify(missingRoute.body).includes('stack'), false);
});

test('registration always creates a patron with a bcrypt hash', async () => {
  const registered = await request(app).post('/api/auth/register').send({
    email: 'new-patron@example.com',
    password: 'patron-password-123',
    role: 'librarian',
  }).expect(201);

  assert.equal(registered.body.data.role, 'patron');
  assert.ok(registered.body.token);
  assert.match(registered.headers['set-cookie'][0], /HttpOnly/);
  assert.match(registered.headers['set-cookie'][0], /SameSite=Strict/i);
  await request(app)
    .get('/api/users/profile')
    .set('Cookie', registered.headers['set-cookie'][0].split(';')[0])
    .expect(200);

  const storedUser = await User.findOne({ email: 'new-patron@example.com' }).select('+passwordHash');
  assert.equal(storedUser.role, 'patron');
  assert.notEqual(storedUser.passwordHash, 'patron-password-123');
  assert.ok(await bcrypt.compare('patron-password-123', storedUser.passwordHash));
  assert.match(storedUser.passwordHash, /^\$2[aby]\$/);
});

test('login rejects bad credentials and issues a revocable librarian session', async () => {
  await request(app).post('/api/auth/login').send({
    email: 'test-librarian@example.com',
    password: 'incorrect-password-123',
  }).expect(401);

  const login = await request(app).post('/api/auth/login').send({
    email: 'test-librarian@example.com',
    password: 'test-librarian-password-123',
  }).expect(200);
  const token = login.body.token;

  const anonymous = await request(app).post('/books').send(bookPayload({ isbn: '9781234500020' })).expect(401);
  assert.equal(anonymous.body.error, 'Authentication required');

  const patron = await request(app).post('/api/auth/register').send({
    email: 'role-check-patron@example.com',
    password: 'patron-password-456',
  }).expect(201);
  await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${patron.body.token}`)
    .send(bookPayload({ isbn: '9781234500021' }))
    .expect(403);

  await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${token}`)
    .send(bookPayload({ isbn: '9781234500022' }))
    .expect(201);

  for (const method of ['post', 'put', 'delete']) {
    const endpoint = method === 'post' ? '/books' : '/books/aaaaaaaaaaaaaaaaaaaaaaaa';
    const anonymousMutation = request(app)[method](endpoint);
    const patronMutation = request(app)[method](endpoint)
      .set('Authorization', `Bearer ${patron.body.token}`);
    if (method !== 'delete') {
      anonymousMutation.send({});
      patronMutation.send({});
    }
    await anonymousMutation.expect(401);
    await patronMutation.expect(403);
  }
});

test('profile identity comes only from the authenticated token and logout revokes it', async () => {
  const login = await request(app).post('/api/auth/login').send({
    email: 'test-librarian@example.com',
    password: 'test-librarian-password-123',
  }).expect(200);
  const token = login.body.token;

  const profile = await request(app)
    .get('/api/users/profile?userId=aaaaaaaaaaaaaaaaaaaaaaaa')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.equal(profile.body.data.email, 'test-librarian@example.com');
  assert.equal(profile.body.data.role, 'librarian');
  assert.equal(Object.hasOwn(profile.body.data, 'passwordHash'), false);

  const tokenHash = require('../middleware/auth').hashToken(token);
  const session = await Session.findOne({ tokenHash }).select('+tokenHash');
  assert.ok(session);
  assert.notEqual(session.tokenHash, token);

  const logout = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.match(logout.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/i);
  await request(app)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${token}`)
    .expect(401);
});