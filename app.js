const express = require('express');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth');
const booksRouter = require('./routes/books');
const genresRouter = require('./routes/genres');
const usersRouter = require('./routes/users');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/books', booksRouter);
app.use('/genres', genresRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;