const Book = require('../models/Book');
const Genre = require('../models/Genre');

const configurations = {
  book: {
    Model: Book,
    fields: ['title', 'author', 'isbn', 'description', 'coverImage', 'totalCopies', 'availableCopies', 'genre'],
  },
  genre: {
    Model: Genre,
    fields: ['name', 'slug'],
  },
};

function validationError(fields) {
  const error = new Error('Validation failed');
  error.status = 400;
  error.fields = fields;
  return error;
}

function validate(resource) {
  const configuration = configurations[resource];

  if (!configuration) {
    throw new Error(`Unknown validation resource: ${resource}`);
  }

  return async function validatePayload(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return next(validationError([{ field: 'body', message: 'must be a JSON object' }]));
    }

    const issues = [];
    const allowedFields = new Set(configuration.fields);

    for (const key of Object.keys(req.body)) {
      if (!allowedFields.has(key)) {
        issues.push({ field: key, message: 'is not an allowed field' });
      }
    }

    for (const field of configuration.fields) {
      const value = req.body[field];
      const schemaType = configuration.Model.schema.path(field).instance;

      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        issues.push({ field, message: 'is required' });
        continue;
      }

      if (schemaType === 'String' && typeof value !== 'string') {
        issues.push({ field, message: 'must be a string' });
      } else if (schemaType === 'Number' && (typeof value !== 'number' || !Number.isFinite(value))) {
        issues.push({ field, message: 'must be a number' });
      } else if (field === 'genre' && (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value))) {
        issues.push({ field, message: 'must be a valid Genre ObjectId' });
      }
    }

    if (issues.length) {
      return next(validationError(issues));
    }

    if (resource === 'book') {
      const genreExists = await Genre.exists({ _id: req.body.genre });
      if (!genreExists) {
        return next(validationError([{ field: 'genre', message: 'does not reference an existing genre' }]));
      }
    }

    const document = new configuration.Model(req.body);
    const mongooseError = document.validateSync();
    if (mongooseError) {
      const mongooseIssues = Object.entries(mongooseError.errors).map(([field, error]) => ({
        field,
        message: error.kind === 'required' ? 'is required' : error.message,
      }));
      return next(validationError(mongooseIssues));
    }

    return next();
  };
}

module.exports = validate;