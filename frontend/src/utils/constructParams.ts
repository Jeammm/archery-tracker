import queryString from "query-string";

export const constructParams = (params: Record<string, string | number | null | undefined>) => {
  return queryString.stringify(params);
};
