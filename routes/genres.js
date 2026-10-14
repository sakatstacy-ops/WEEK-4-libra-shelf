const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Genre = require('../models/Genre');
const validate = require('../middleware/validate');

const router = express.Router();

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requireObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(Object.assign(new Error('id must be a valid MongoDB ObjectId'), { status: 400 }));
  }
  return next();
}

router.get('/', asyncRoute(async (req, res) => {
  const genres = await Genre.find().sort({ name: 1 });
  res.status(200).json({ data: genres });
}));

router.get('/:id', requireObjectId, asyncRoute(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) {
    return next(Object.assign(new Error('Genre not found'), { status: 404 }));
  }
  return res.status(200).json({ data: genre });
}));

router.post('/', validate('genre'), asyncRoute(async (req, res) => {
  const genre = await Genre.create(req.body);
  res.status(201).json({ data: genre });
}));

router.put('/:id', requireObjectId, validate('genre'), asyncRoute(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) {
    return next(Object.assign(new Error('Genre not found'), { status: 404 }));
  }
  genre.set(req.body);
  await genre.save();
  return res.status(200).json({ data: genre });
}));

router.delete('/:id', requireObjectId, asyncRoute(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) {
    return next(Object.assign(new Error('Genre not found'), { status: 404 }));
  }

  if (await Book.exists({ genre: genre._id })) {
    return next(Object.assign(new Error('Genre is in use by books and cannot be deleted'), { status: 409 }));
  }

  await genre.deleteOne();
  return res.status(204).end();
}));

module.exports = router;