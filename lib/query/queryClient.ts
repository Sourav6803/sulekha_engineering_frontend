export const buildQueryString = <T extends Record<string, unknown> | undefined>(params?: T): string => {
  if (!params) {
    return '';
  }

  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (entries.length === 0) {
    return '';
  }

  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
};

export const createUrlWithQuery = <T extends Record<string, unknown> | undefined>(path: string, params?: T): string => {
  return `${path}${buildQueryString(params)}`;
};
