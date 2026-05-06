// Simplified auth — no Google SSO, everyone can access
// This can be swapped for a simple password or removed entirely

export const auth = async () => {
  return { user: { name: 'Team Member' }, accessToken: null };
};

export const signIn = async () => {};
export const signOut = async () => {};
