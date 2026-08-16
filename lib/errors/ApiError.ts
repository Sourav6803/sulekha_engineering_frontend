export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: string[];

  constructor(statusCode: number, message: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static fromResponse(statusCode: number, message: string, details?: string[]) {
    return new ApiError(statusCode, message, details);
  }
}
