// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// API クライアント - メイン実装
// 関数型プログラミングの原則に基づいた型安全で堅牢なREST APIクライアント

// ===========================================
// 型定義
// ===========================================

// Either型（エラーハンドリング用）
type Either<L, R> = Left<L> | Right<R>;
interface Left<L> { readonly _tag: 'Left'; readonly left: L; }
interface Right<R> { readonly _tag: 'Right'; readonly right: R; }

const left = <L, R = never>(value: L): Either<L, R> => ({ _tag: 'Left', left: value });
const right = <L = never, R = never>(value: R): Either<L, R> => ({ _tag: 'Right', right: value });
const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => either._tag === 'Left';
const isRight = <L, R>(either: Either<L, R>): either is Right<R> => either._tag === 'Right';

// HTTP関連の型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

type ApiError = {
  readonly type: 'NetworkError' | 'HttpError' | 'ParseError' | 'TimeoutError' | 'AbortError';
  readonly message: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly cause?: Error;
  readonly timestamp: Date;
};

type ApiResponse<T> = {
  readonly data: T;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly url: string;
  readonly duration: number;
};

type RequestConfig<TBody = unknown, TResponse = unknown> = {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers?: Record<string, string>;
  readonly body?: TBody;
  readonly timeout?: number;
  readonly retries?: number;
  readonly retryDelay?: number;
  readonly validateStatus?: (status: number) => boolean;
  readonly transformRequest?: (data: TBody) => unknown;
  readonly transformResponse?: (data: unknown) => TResponse;
  readonly signal?: AbortSignal;
};

// TaskEither for async operations
class TaskEither<L, R> {
  constructor(private task: Promise<Either<L, R>>) {}

  static of<L, R>(value: R): TaskEither<L, R> {
    return new TaskEither(Promise.resolve(right(value)));
  }

  static left<L, R>(error: L): TaskEither<L, R> {
    return new TaskEither(Promise.resolve(left(error)));
  }

  static fromPromise<L, R>(
    promise: Promise<R>,
    onError: (error: unknown) => L
  ): TaskEither<L, R> {
    return new TaskEither(
      promise
        .then(value => right<L, R>(value))
        .catch(error => left<L, R>(onError(error)))
    );
  }

  map<U>(fn: (value: R) => U): TaskEither<L, U> {
    return new TaskEither(
      this.task.then(either => 
        isRight(either) ? right(fn(either.right)) : either
      )
    );
  }

  flatMap<U>(fn: (value: R) => TaskEither<L, U>): TaskEither<L, U> {
    return new TaskEither(
      this.task.then(either => 
        isRight(either) ? fn(either.right).run() : Promise.resolve(either)
      )
    );
  }

  mapLeft<U>(fn: (error: L) => U): TaskEither<U, R> {
    return new TaskEither(
      this.task.then(either => 
        isLeft(either) ? left(fn(either.left)) : either
      )
    );
  }

  fold<U>(onLeft: (error: L) => U, onRight: (value: R) => U): Promise<U> {
    return this.task.then(either => 
      isLeft(either) ? onLeft(either.left) : onRight(either.right)
    );
  }

  run(): Promise<Either<L, R>> {
    return this.task;
  }
}

// ===========================================
// APIクライアント実装
// ===========================================

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private cache: Map<string, { data: any; expiry: number }>;
  private interceptors: {
    request: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>;
    response: Array<(response: ApiResponse<unknown>) => ApiResponse<unknown> | Promise<ApiResponse<unknown>>>;
    error: Array<(error: ApiError) => ApiError | Promise<ApiError>>;
  };

  constructor(
    baseUrl: string,
    defaultHeaders: Record<string, string> = {},
    options: {
      timeout?: number;
      enableCache?: boolean;
    } = {}
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = defaultHeaders;
    this.defaultTimeout = options.timeout || 30000;
    this.cache = options.enableCache ? new Map() : new Map();
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };
  }

  // ===========================================
  // インターセプター管理
  // ===========================================

  addRequestInterceptor(
    interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  ): () => void {
    this.interceptors.request.push(interceptor);
    return () => {
      const index = this.interceptors.request.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.request.splice(index, 1);
      }
    };
  }

  addResponseInterceptor(
    interceptor: (response: ApiResponse<unknown>) => ApiResponse<unknown> | Promise<ApiResponse<unknown>>
  ): () => void {
    this.interceptors.response.push(interceptor);
    return () => {
      const index = this.interceptors.response.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.response.splice(index, 1);
      }
    };
  }

  addErrorInterceptor(
    interceptor: (error: ApiError) => ApiError | Promise<ApiError>
  ): () => void {
    this.interceptors.error.push(interceptor);
    return () => {
      const index = this.interceptors.error.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.error.splice(index, 1);
      }
    };
  }

  // ===========================================
  // HTTP メソッド
  // ===========================================

  get<T>(url: string, config: Partial<RequestConfig<any, T>> = {}): TaskEither<ApiError, ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  post<T, B = unknown>(
    url: string, 
    body?: B, 
    config: Partial<RequestConfig<B, T>> = {}
  ): TaskEither<ApiError, ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, body });
  }

  put<T, B = unknown>(
    url: string, 
    body?: B, 
    config: Partial<RequestConfig<B, T>> = {}
  ): TaskEither<ApiError, ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, body });
  }

  patch<T, B = unknown>(
    url: string, 
    body?: B, 
    config: Partial<RequestConfig<B, T>> = {}
  ): TaskEither<ApiError, ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, body });
  }

  delete<T>(url: string, config: Partial<RequestConfig<any, T>> = {}): TaskEither<ApiError, ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // ===========================================
  // メインリクエスト処理
  // ===========================================

  private request<T>(config: Partial<RequestConfig<any, T>>): TaskEither<ApiError, ApiResponse<T>> {
    const fullConfig: RequestConfig<any, T> = {
      method: 'GET',
      url: '',
      timeout: this.defaultTimeout,
      retries: 0,
      retryDelay: 1000,
      validateStatus: (status) => status >= 200 && status < 300,
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...config.headers
      }
    } as RequestConfig<any, T>;

    // キャッシュチェック（GETリクエストのみ）
    if (fullConfig.method === 'GET') {
      const cacheKey = this.getCacheKey(fullConfig);
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return TaskEither.of(cached);
      }
    }

    return this.executeRequestWithRetry<any, T>(fullConfig);
  }

  private executeRequestWithRetry<B, T>(
    config: RequestConfig<B, T>,
    attempt: number = 0
  ): TaskEither<ApiError, ApiResponse<T>> {
    return TaskEither.fromPromise(
      this.executeRequest<any, T>(config),
      (error: unknown) => this.createApiError(error)
    ).flatMap(response => {
      // リトライ判定
      if (!config.validateStatus!(response.status) && attempt < (config.retries || 0)) {
        return new TaskEither(
          new Promise(resolve => {
            setTimeout(() => {
              this.executeRequestWithRetry<any, T>(config, attempt + 1)
                .run()
                .then(resolve);
            }, config.retryDelay);
          })
        );
      }

      // ステータスコードチェック
      if (!config.validateStatus!(response.status)) {
        const error: ApiError = {
          type: 'HttpError',
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          timestamp: new Date()
        };
        return TaskEither.left(error);
      }

      // キャッシュに保存（GETリクエストのみ）
      if (config.method === 'GET') {
        const cacheKey = this.getCacheKey(config as any);
        this.setCache(cacheKey, response);
      }

      return TaskEither.of(response);
    });
  }

  private async executeRequest<B, T>(config: RequestConfig<B, T>): Promise<ApiResponse<T>> {
    // リクエストインターセプターの適用
    let finalConfig = config;
    for (const interceptor of this.interceptors.request) {
      const updatedConfig = await interceptor(finalConfig as any);
      finalConfig = updatedConfig as RequestConfig<B, T>;
    }

    const startTime = Date.now();
    const fullUrl = this.buildUrl(finalConfig.url);

    // タイムアウト制御
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

    try {
      // リクエストボディの型安全な変換
      let body: string | FormData | URLSearchParams | ReadableStream<Uint8Array> | null = null;
      if (finalConfig.body !== undefined) {
        if (finalConfig.transformRequest) {
          body = finalConfig.transformRequest(finalConfig.body) as string | FormData | URLSearchParams | ReadableStream<Uint8Array> | null;
        } else if (typeof finalConfig.body === 'object' && finalConfig.headers?.['Content-Type']?.includes('application/json')) {
          body = JSON.stringify(finalConfig.body);
        } else if (typeof finalConfig.body === 'string') {
          body = finalConfig.body as string;
        } else {
          body = JSON.stringify(finalConfig.body);
        }
      }

      // Fetchリクエスト実行
      const fetchOptions: RequestInit = {
        method: finalConfig.method,
        signal: finalConfig.signal || controller.signal
      };
      
      if (finalConfig.headers) {
        fetchOptions.headers = finalConfig.headers;
      }
      
      if (body !== null) {
        fetchOptions.body = body;
      }
      
      const fetchResponse = await fetch(fullUrl, fetchOptions);

      clearTimeout(timeoutId);

      // レスポンスデータの型安全な取得と変換
      let data: T;
      const contentType = fetchResponse.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const jsonData = await fetchResponse.json();
        data = finalConfig.transformResponse ? finalConfig.transformResponse(jsonData) : jsonData as T;
      } else if (contentType.includes('text/')) {
        const textData = await fetchResponse.text();
        data = finalConfig.transformResponse ? finalConfig.transformResponse(textData) : textData as T;
      } else {
        const blobData = await fetchResponse.blob();
        data = finalConfig.transformResponse ? finalConfig.transformResponse(blobData) : blobData as T;
      }

      // レスポンスヘッダーの変換
      const headers: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let response: ApiResponse<T> = {
        data,
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers,
        url: fullUrl,
        duration: Date.now() - startTime
      };

      // レスポンスインターセプターの適用
      for (const interceptor of this.interceptors.response) {
        response = await interceptor(response) as ApiResponse<T>;
      }

      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ===========================================
  // ユーティリティメソッド
  // ===========================================

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }

  private createApiError(error: unknown): ApiError {
    // 型安全なErrorチェック
    const isErrorWithName = (err: unknown): err is { name: string } => 
      typeof err === 'object' && err !== null && 'name' in err;
    
    const isErrorWithMessage = (err: unknown): err is { message: string } => 
      typeof err === 'object' && err !== null && 'message' in err;

    if (isErrorWithName(error) && error.name === 'AbortError') {
      return {
        type: 'AbortError',
        message: 'Request was aborted',
        timestamp: new Date(),
        cause: error instanceof Error ? error : new Error(String(error))
      };
    }

    if (isErrorWithName(error) && error.name === 'TimeoutError') {
      return {
        type: 'TimeoutError',
        message: 'Request timed out',
        timestamp: new Date(),
        cause: error instanceof Error ? error : new Error(String(error))
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'NetworkError',
        message: 'Network request failed',
        timestamp: new Date(),
        cause: error
      };
    }

    const message = isErrorWithMessage(error) ? error.message : 'Unknown error occurred';
    return {
      type: 'NetworkError',
      message,
      timestamp: new Date(),
      cause: error instanceof Error ? error : new Error(String(error))
    };
  }

  private getCacheKey(config: RequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.headers)}`;
  }

  private getFromCache<T>(key: string): ApiResponse<T> | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as ApiResponse<T>;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setCache<T>(key: string, response: ApiResponse<T>, ttl: number = 300000): void {
    this.cache.set(key, {
      data: response,
      expiry: Date.now() + ttl
    });
  }

  // キャッシュクリア
  clearCache(): void {
    this.cache.clear();
  }

  // 統計情報取得
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ===========================================
// ファクトリー関数とヘルパー
// ===========================================

// 認証ヘルパー
export const auth = {
  bearer: (token: string) => ({ Authorization: `Bearer ${token}` }),
  basic: (username: string, password: string) => ({
    Authorization: `Basic ${btoa(`${username}:${password}`)}`
  }),
  apiKey: (key: string, headerName: string = 'X-API-Key') => ({
    [headerName]: key
  })
};

// 一般的なインターセプター
export const interceptors = {
  // JWTトークンの自動リフレッシュ
  autoRefreshToken: (
    getToken: () => string | null,
    refreshToken: () => Promise<string>,
    isTokenExpired: (token: string) => boolean
  ) => async (config: RequestConfig): Promise<RequestConfig> => {
    const token = getToken();
    
    if (token && isTokenExpired(token)) {
      try {
        const newToken = await refreshToken();
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${newToken}`
          }
        };
      } catch (error) {
        // リフレッシュ失敗時の処理
        throw new Error('Token refresh failed');
      }
    }
    
    return config;
  },

  // リクエストログ
  requestLogger: () => (config: RequestConfig): RequestConfig => {
    console.log(`🚀 ${config.method} ${config.url}`, {
      headers: config.headers,
      body: config.body
    });
    return config;
  },

  // レスポンスログ
  responseLogger: () => (response: ApiResponse<unknown>): ApiResponse<unknown> => {
    console.log(`✅ ${response.status} ${response.url} (${response.duration}ms)`, {
      data: response.data
    });
    return response;
  },

  // エラーログ
  errorLogger: () => (error: ApiError): ApiError => {
    console.error(`❌ API Error: ${error.type}`, {
      message: error.message,
      status: error.status,
      details: error.details
    });
    return error;
  }
};

// ===========================================
// Either型のヘルパー関数
// ===========================================

const foldEither = <L, R, U>(
  onLeft: (error: L) => U,
  onRight: (value: R) => U
) => (either: Either<L, R>): U => 
  isLeft(either) ? onLeft(either.left) : onRight(either.right);

// ===========================================
// エクスポート
// ===========================================

export {
  ApiError,
  ApiResponse,
  RequestConfig,
  HttpMethod,
  TaskEither,
  Either,
  left,
  right,
  isLeft,
  isRight,
  foldEither
};