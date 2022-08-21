export type ErrorResponse<
  T extends Record<string, string> | string = Record<string, string | string>
> = {
  errors: T;
};
