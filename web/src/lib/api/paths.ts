export function getApiPaths() {
  return {
    /** v1 註冊（`login_flow`：POST `/api/v1/signup`） */
    register: import.meta.env.VITE_API_PATH_AUTH_REGISTER ?? '/api/v1/signup',
    /** v1 登入 */
    login: import.meta.env.VITE_API_PATH_AUTH_LOGIN ?? '/api/v1/login',
    /** v1 以 refresh 換新 access */
    token: import.meta.env.VITE_API_PATH_AUTH_TOKEN ?? '/api/v1/token',
    games: import.meta.env.VITE_API_PATH_LOBBY_GAMES ?? '/api/lobby/games',
    me: import.meta.env.VITE_API_PATH_USER_ME ?? '/api/user/me',
    deposit: import.meta.env.VITE_API_PATH_PAYMENT_DEPOSIT ?? '/api/payment/deposit',
  } as const
}
