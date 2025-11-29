export type Result<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
};

export const ok = <T = void>(data?: T): Result<T> => ({
  success: true,
  data: data as T,
});

export const fail = (
  message: string,
  code?: string,
  stack?: string
): Result<never> => ({
  success: false,
  error: { message, code, stack },
});
