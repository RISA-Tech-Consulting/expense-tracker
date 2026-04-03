// Type declarations for Google Identity Services (GIS) and GAPI

declare namespace google.accounts.oauth2 {
  interface TokenResponse {
    access_token: string;
    error?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }

  interface ClientConfigError {
    type: string;
    message?: string;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: ClientConfigError) => void;
  }

  interface TokenClient {
    callback: (response: TokenResponse) => void;
    error_callback: (error: ClientConfigError) => void;
    requestAccessToken(opts?: { prompt?: string }): void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
  function revoke(token: string, callback: () => void): void;
}

declare namespace gapi {
  function load(api: string, options: { callback: () => void; onerror: () => void }): void;

  namespace client {
    function init(config: Record<string, unknown>): Promise<void>;
    function request<T = unknown>(args: {
      path: string;
      method?: string;
      params?: Record<string, string | number>;
      headers?: Record<string, string>;
      body?: string;
    }): Promise<{ result: T; body: string; status: number }>;
  }
}
