export function getApiPaths() {
  return {
    register: import.meta.env.VITE_API_PATH_AUTH_REGISTER ?? '/api/auth/register',
    login: import.meta.env.VITE_API_PATH_AUTH_LOGIN ?? '/api/auth/login',
    games: import.meta.env.VITE_API_PATH_LOBBY_GAMES ?? '/api/lobby/games',
    me: import.meta.env.VITE_API_PATH_USER_ME ?? '/api/user/me',
    deposit: import.meta.env.VITE_API_PATH_PAYMENT_DEPOSIT ?? '/api/payment/deposit',
  } as const
}
