type Either<L, R> = Left<L> | Right<R>;
interface Left<L> {
    readonly _tag: 'Left';
    readonly left: L;
}
interface Right<R> {
    readonly _tag: 'Right';
    readonly right: R;
}
declare const left: <L, R = never>(value: L) => Either<L, R>;
declare const right: <L = never, R = never>(value: R) => Either<L, R>;
declare const isLeft: <L, R>(either: Either<L, R>) => either is Left<L>;
declare const isRight: <L, R>(either: Either<L, R>) => either is Right<R>;
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
declare class TaskEither<L, R> {
    private task;
    constructor(task: Promise<Either<L, R>>);
    static of<L, R>(value: R): TaskEither<L, R>;
    static left<L, R>(error: L): TaskEither<L, R>;
    static fromPromise<L, R>(promise: Promise<R>, onError: (error: unknown) => L): TaskEither<L, R>;
    map<U>(fn: (value: R) => U): TaskEither<L, U>;
    flatMap<U>(fn: (value: R) => TaskEither<L, U>): TaskEither<L, U>;
    mapLeft<U>(fn: (error: L) => U): TaskEither<U, R>;
    fold<U>(onLeft: (error: L) => U, onRight: (value: R) => U): Promise<U>;
    run(): Promise<Either<L, R>>;
}
export declare class ApiClient {
    private baseUrl;
    private defaultHeaders;
    private defaultTimeout;
    private cache;
    private interceptors;
    constructor(baseUrl: string, defaultHeaders?: Record<string, string>, options?: {
        timeout?: number;
        enableCache?: boolean;
    });
    addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): () => void;
    addResponseInterceptor(interceptor: (response: ApiResponse<unknown>) => ApiResponse<unknown> | Promise<ApiResponse<unknown>>): () => void;
    addErrorInterceptor(interceptor: (error: ApiError) => ApiError | Promise<ApiError>): () => void;
    get<T>(url: string, config?: Partial<RequestConfig<any, T>>): TaskEither<ApiError, ApiResponse<T>>;
    post<T, B = unknown>(url: string, body?: B, config?: Partial<RequestConfig<B, T>>): TaskEither<ApiError, ApiResponse<T>>;
    put<T, B = unknown>(url: string, body?: B, config?: Partial<RequestConfig<B, T>>): TaskEither<ApiError, ApiResponse<T>>;
    patch<T, B = unknown>(url: string, body?: B, config?: Partial<RequestConfig<B, T>>): TaskEither<ApiError, ApiResponse<T>>;
    delete<T>(url: string, config?: Partial<RequestConfig<any, T>>): TaskEither<ApiError, ApiResponse<T>>;
    private request;
    private executeRequestWithRetry;
    private executeRequest;
    private buildUrl;
    private createApiError;
    private getCacheKey;
    private getFromCache;
    private setCache;
    clearCache(): void;
    getCacheStats(): {
        size: number;
        keys: string[];
    };
}
export declare const auth: {
    bearer: (token: string) => {
        Authorization: string;
    };
    basic: (username: string, password: string) => {
        Authorization: string;
    };
    apiKey: (key: string, headerName?: string) => {
        [x: string]: string;
    };
};
export declare const interceptors: {
    autoRefreshToken: (getToken: () => string | null, refreshToken: () => Promise<string>, isTokenExpired: (token: string) => boolean) => (config: RequestConfig) => Promise<RequestConfig>;
    requestLogger: () => (config: RequestConfig) => RequestConfig;
    responseLogger: () => (response: ApiResponse<unknown>) => ApiResponse<unknown>;
    errorLogger: () => (error: ApiError) => ApiError;
};
declare const foldEither: <L, R, U>(onLeft: (error: L) => U, onRight: (value: R) => U) => (either: Either<L, R>) => U;
export { ApiError, ApiResponse, RequestConfig, HttpMethod, TaskEither, Either, left, right, isLeft, isRight, foldEither };
