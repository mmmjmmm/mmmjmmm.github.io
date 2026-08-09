export class AppError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly code = 'INTERNAL_ERROR',
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '发生未知错误';
}
