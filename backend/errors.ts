export const isMyError = (error: Error): error is MyError => {
  return typeof (error as MyError).status === 'number';
};

class MyError extends Error {
  public status: number;
  constructor(status: number, message?: string) {
    super(message);
    this.status = status;
  }
}

export class UnauthorizedError extends MyError {
  constructor(message?: string) {
    super(401, message);
  }
}

export class UnprocessableEntityError extends MyError {
  constructor(message?: string) {
    super(422, message);
  }
}
