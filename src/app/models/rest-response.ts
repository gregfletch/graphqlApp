export interface RestResponse {
  result?: RestResponseResult;
  errors?: Array<RestResponseError>;
}

interface RestResponseResult {
  message: string;
}

interface RestResponseError {
  error: string;
}
