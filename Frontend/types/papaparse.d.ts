declare module "papaparse" {
  interface ParseResult<T> {
    data: T[];
    errors: unknown[];
    meta: { fields?: string[]; [key: string]: unknown };
  }
  interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean;
    transformHeader?: (header: string) => string;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: { message: string }) => void;
    [key: string]: unknown;
  }
  function parse<T = unknown>(input: string, config?: ParseConfig<T>): void;
  const Papa: {
    parse: typeof parse;
  };
  export default Papa;
}
