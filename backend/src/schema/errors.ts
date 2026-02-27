import { builder } from './builder';

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class UnknownError extends Error {
  constructor(message = 'An unknown error occurred') {
    super(message);
    this.name = 'UnknownError';
  }
}

export class ValidationError extends Error {
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

builder.objectType(NotFoundError, {
  name: 'NotFoundError',
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
});

builder.objectType(UnauthorizedError, {
  name: 'UnauthorizedError',
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
});

builder.objectType(UnknownError, {
  name: 'UnknownError',
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
});

builder.objectType(ValidationError, {
  name: 'ValidationError',
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
});
