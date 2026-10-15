import type { Tokens } from "./types";

// Trade-off: the access token (sent on every request) lives only in memory;
// the refresh token goes to localStorage so a page reload keeps the session.
// An XSS bug could still read the refresh token, but the backend can revoke
// it (token blacklist). httpOnly cookies would be safer but need backend work.

const REFRESH_KEY = "weatherpulse.refresh";

let accessToken: string | null = null;

export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(tokens: Tokens) {
    accessToken = tokens.access;
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },
  clear() {
    accessToken = null;
    localStorage.removeItem(REFRESH_KEY);
  },
};
