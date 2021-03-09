export interface AuthResponse {
  result?: AuthResponseResult;
  errors?: Array<AuthResponseError>;
}

interface AuthResponseResult {
  message: string;
  user: {
    id: string;
    session_id: string;
  };
}

interface AuthResponseError {
  error: string;
}
