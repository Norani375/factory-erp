import { createClient } from '@libsql/client/web';

let _client: any = null;

function getClient() {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

// Proxy forwards all calls to lazy-initialized client
// This prevents createClient from running at build time
const db = new Proxy({} as any, {
  get(_target, prop) {
    const client = getClient();
    const value = client[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default db;
