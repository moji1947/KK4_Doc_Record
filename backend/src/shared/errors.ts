// Error response shape เดียวกันทั้งระบบ — ดู docs/skills/04-coding-standards.md
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }

  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details ?? {},
      },
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super("NOT_FOUND", `${resource} with id "${id}" not found`, 404, { resource, id });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 422, details);
  }
}
