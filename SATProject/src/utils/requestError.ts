interface RequestError {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export function toRequestError(error: unknown): RequestError {
  if (typeof error === 'string') {
    return { message: error };
  }
  if (typeof error === 'object' && error !== null) {
    return error as RequestError;
  }
  return {};
}
