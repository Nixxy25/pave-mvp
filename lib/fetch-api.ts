type TokenFn = () => Promise<string | null>;
type UserIdFn = () => string | null;

let _getToken: TokenFn = async () => null;
let _getUserId: UserIdFn = () => null;

export function setTokenGetter(fn: TokenFn) {
  _getToken = fn;
}

export function setUserIdGetter(fn: UserIdFn) {
  _getUserId = fn;
}

export function getCurrentUserId(): string | null {
  return _getUserId();
}

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await _getToken();
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}
