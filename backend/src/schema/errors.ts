import { builder } from './builder';

export class GraphQLError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends GraphQLError {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends GraphQLError {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class UnknownError extends GraphQLError {
  constructor(message = 'An unknown error occurred') {
    super(message);
    this.name = 'UnknownError';
  }
}

export class ValidationError extends GraphQLError {
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AlreadyExistsError extends GraphQLError {
  constructor(message: string) {
    super(message);
    this.name = 'AlreadyExistsError';
  }
}

builder.interfaceType(GraphQLError, {
  name: 'Error',
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
});

builder.objectType(NotFoundError, {
  name: 'NotFoundError',
  interfaces: [GraphQLError],
});

builder.objectType(UnauthorizedError, {
  name: 'UnauthorizedError',
  interfaces: [GraphQLError],
});

builder.objectType(UnknownError, {
  name: 'UnknownError',
  interfaces: [GraphQLError],
});

builder.objectType(ValidationError, {
  name: 'ValidationError',
  interfaces: [GraphQLError],
});

builder.objectType(AlreadyExistsError, {
  name: 'AlreadyExistsError',
  interfaces: [GraphQLError],
});
