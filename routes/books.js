const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Genre = require('../models/Genre');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function parsePositiveInteger(value, field, defaultValue, maxValue = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) {
    return defaultValue;
  }
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > maxValue) {
    const error = new Error(`${field} must be an integer between 1 and ${maxValue}`);
    error.status = 400;
    error.fields = [{ field, message: `must be an integer between 1 and ${maxValue}` }];
    throw error;
  }
  return Number(value);
}

function requireObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(Object.assign(new Error('id must be a valid MongoDB ObjectId'), { status: 400 }));
  }
  return next();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', asyncRoute(async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 'page', 1);
  const limit = parsePositiveInteger(req.query.limit, 'limit', 10, 100);
  const filter = {};

  if (req.query.genre !== undefined) {
    if (!mongoose.isValidObjectId(req.query.genre)) {
      const error = new Error('genre must be a valid Genre ObjectId');
      error.status = 400;
      error.fields = [{ field: 'genre', message: 'must be a valid Genre ObjectId' }];
      throw error;
    }
    if (!await Genre.exists({ _id: req.query.genre })) {
      const error = new Error('genre does not reference an existing genre');
      error.status = 400;
      error.fields = [{ field: 'genre', message: 'does not reference an existing genre' }];
      throw error;
    }
    filter.genre = req.query.genre;
  }

  if (req.query.search !== undefined && req.query.search.trim()) {
    const expression = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ title: expression }, { author: expression }];
  }

  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate('genre', 'name slug')
      .sort({ title: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Book.countDocuments(filter),
  ]);

  return res.status(200).json({
    data: books,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

router.get('/:id', requireObjectId, asyncRoute(async (req, res, next) => {
  const book = await Book.findById(req.params.id).populate('genre', 'name slug');
  if (!book) {
    return next(Object.assign(new Error('Book not found'), { status: 404 }));
  }
  return res.status(200).json({ data: book });
}));

router.post('/', authenticate, authorize('librarian'), validate('book'), asyncRoute(async (req, res) => {
  const book = await Book.create(req.body);
  await book.populate('genre', 'name slug');
  res.status(201).json({ data: book });
}));

router.put('/:id', authenticate, authorize('librarian'), requireObjectId, validate('book'), asyncRoute(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return next(Object.assign(new Error('Book not found'), { status: 404 }));
  }
  book.set(req.body);
  await book.save();
  await book.populate('genre', 'name slug');
  return res.status(200).json({ data: book });
}));

router.delete('/:id', authenticate, authorize('librarian'), requireObjectId, asyncRoute(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return next(Object.assign(new Error('Book not found'), { status: 404 }));
  }
  await book.deleteOne();
  return res.status(204).end();
}));

module.exports = router;