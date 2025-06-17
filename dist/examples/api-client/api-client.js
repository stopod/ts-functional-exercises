"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// API クライアント - メイン実装
// 関数型プログラミングの原則に基づいた型安全で堅牢なREST APIクライアント
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldEither = exports.isRight = exports.isLeft = exports.right = exports.left = exports.TaskEither = exports.interceptors = exports.auth = exports.ApiClient = void 0;
const left = (value) => ({ _tag: 'Left', left: value });
exports.left = left;
const right = (value) => ({ _tag: 'Right', right: value });
exports.right = right;
const isLeft = (either) => either._tag === 'Left';
exports.isLeft = isLeft;
const isRight = (either) => either._tag === 'Right';
exports.isRight = isRight;
// TaskEither for async operations
class TaskEither {
    constructor(task) {
        this.task = task;
    }
    static of(value) {
        return new TaskEither(Promise.resolve(right(value)));
    }
    static left(error) {
        return new TaskEither(Promise.resolve(left(error)));
    }
    static fromPromise(promise, onError) {
        return new TaskEither(promise
            .then(value => right(value))
            .catch(error => left(onError(error))));
    }
    map(fn) {
        return new TaskEither(this.task.then(either => isRight(either) ? right(fn(either.right)) : either));
    }
    flatMap(fn) {
        return new TaskEither(this.task.then(either => isRight(either) ? fn(either.right).run() : Promise.resolve(either)));
    }
    mapLeft(fn) {
        return new TaskEither(this.task.then(either => isLeft(either) ? left(fn(either.left)) : either));
    }
    fold(onLeft, onRight) {
        return this.task.then(either => isLeft(either) ? onLeft(either.left) : onRight(either.right));
    }
    run() {
        return this.task;
    }
}
exports.TaskEither = TaskEither;
// ===========================================
// APIクライアント実装
// ===========================================
class ApiClient {
    constructor(baseUrl, defaultHeaders = {}, options = {}) {
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
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
        return () => {
            const index = this.interceptors.request.indexOf(interceptor);
            if (index > -1) {
                this.interceptors.request.splice(index, 1);
            }
        };
    }
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
        return () => {
            const index = this.interceptors.response.indexOf(interceptor);
            if (index > -1) {
                this.interceptors.response.splice(index, 1);
            }
        };
    }
    addErrorInterceptor(interceptor) {
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
    get(url, config = {}) {
        return this.request({ ...config, method: 'GET', url });
    }
    post(url, body, config = {}) {
        return this.request({ ...config, method: 'POST', url, body });
    }
    put(url, body, config = {}) {
        return this.request({ ...config, method: 'PUT', url, body });
    }
    patch(url, body, config = {}) {
        return this.request({ ...config, method: 'PATCH', url, body });
    }
    delete(url, config = {}) {
        return this.request({ ...config, method: 'DELETE', url });
    }
    // ===========================================
    // メインリクエスト処理
    // ===========================================
    request(config) {
        const fullConfig = {
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
        };
        // キャッシュチェック（GETリクエストのみ）
        if (fullConfig.method === 'GET') {
            const cacheKey = this.getCacheKey(fullConfig);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return TaskEither.of(cached);
            }
        }
        return this.executeRequestWithRetry(fullConfig);
    }
    executeRequestWithRetry(config, attempt = 0) {
        return TaskEither.fromPromise(this.executeRequest(config), (error) => this.createApiError(error)).flatMap(response => {
            // リトライ判定
            if (!config.validateStatus(response.status) && attempt < (config.retries || 0)) {
                return new TaskEither(new Promise(resolve => {
                    setTimeout(() => {
                        this.executeRequestWithRetry(config, attempt + 1)
                            .run()
                            .then(resolve);
                    }, config.retryDelay);
                }));
            }
            // ステータスコードチェック
            if (!config.validateStatus(response.status)) {
                const error = {
                    type: 'HttpError',
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    status: response.status,
                    timestamp: new Date()
                };
                return TaskEither.left(error);
            }
            // キャッシュに保存（GETリクエストのみ）
            if (config.method === 'GET') {
                const cacheKey = this.getCacheKey(config);
                this.setCache(cacheKey, response);
            }
            return TaskEither.of(response);
        });
    }
    async executeRequest(config) {
        // リクエストインターセプターの適用
        let finalConfig = config;
        for (const interceptor of this.interceptors.request) {
            const updatedConfig = await interceptor(finalConfig);
            finalConfig = updatedConfig;
        }
        const startTime = Date.now();
        const fullUrl = this.buildUrl(finalConfig.url);
        // タイムアウト制御
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
        try {
            // リクエストボディの型安全な変換
            let body = null;
            if (finalConfig.body !== undefined) {
                if (finalConfig.transformRequest) {
                    body = finalConfig.transformRequest(finalConfig.body);
                }
                else if (typeof finalConfig.body === 'object' && finalConfig.headers?.['Content-Type']?.includes('application/json')) {
                    body = JSON.stringify(finalConfig.body);
                }
                else if (typeof finalConfig.body === 'string') {
                    body = finalConfig.body;
                }
                else {
                    body = JSON.stringify(finalConfig.body);
                }
            }
            // Fetchリクエスト実行
            const fetchOptions = {
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
            let data;
            const contentType = fetchResponse.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const jsonData = await fetchResponse.json();
                data = finalConfig.transformResponse ? finalConfig.transformResponse(jsonData) : jsonData;
            }
            else if (contentType.includes('text/')) {
                const textData = await fetchResponse.text();
                data = finalConfig.transformResponse ? finalConfig.transformResponse(textData) : textData;
            }
            else {
                const blobData = await fetchResponse.blob();
                data = finalConfig.transformResponse ? finalConfig.transformResponse(blobData) : blobData;
            }
            // レスポンスヘッダーの変換
            const headers = {};
            fetchResponse.headers.forEach((value, key) => {
                headers[key] = value;
            });
            let response = {
                data,
                status: fetchResponse.status,
                statusText: fetchResponse.statusText,
                headers,
                url: fullUrl,
                duration: Date.now() - startTime
            };
            // レスポンスインターセプターの適用
            for (const interceptor of this.interceptors.response) {
                response = await interceptor(response);
            }
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    // ===========================================
    // ユーティリティメソッド
    // ===========================================
    buildUrl(path) {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${this.baseUrl}/${cleanPath}`;
    }
    createApiError(error) {
        // 型安全なErrorチェック
        const isErrorWithName = (err) => typeof err === 'object' && err !== null && 'name' in err;
        const isErrorWithMessage = (err) => typeof err === 'object' && err !== null && 'message' in err;
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
    getCacheKey(config) {
        return `${config.method}:${config.url}:${JSON.stringify(config.headers)}`;
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }
    setCache(key, response, ttl = 300000) {
        this.cache.set(key, {
            data: response,
            expiry: Date.now() + ttl
        });
    }
    // キャッシュクリア
    clearCache() {
        this.cache.clear();
    }
    // 統計情報取得
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
exports.ApiClient = ApiClient;
// ===========================================
// ファクトリー関数とヘルパー
// ===========================================
// 認証ヘルパー
exports.auth = {
    bearer: (token) => ({ Authorization: `Bearer ${token}` }),
    basic: (username, password) => ({
        Authorization: `Basic ${btoa(`${username}:${password}`)}`
    }),
    apiKey: (key, headerName = 'X-API-Key') => ({
        [headerName]: key
    })
};
// 一般的なインターセプター
exports.interceptors = {
    // JWTトークンの自動リフレッシュ
    autoRefreshToken: (getToken, refreshToken, isTokenExpired) => async (config) => {
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
            }
            catch (error) {
                // リフレッシュ失敗時の処理
                throw new Error('Token refresh failed');
            }
        }
        return config;
    },
    // リクエストログ
    requestLogger: () => (config) => {
        console.log(`🚀 ${config.method} ${config.url}`, {
            headers: config.headers,
            body: config.body
        });
        return config;
    },
    // レスポンスログ
    responseLogger: () => (response) => {
        console.log(`✅ ${response.status} ${response.url} (${response.duration}ms)`, {
            data: response.data
        });
        return response;
    },
    // エラーログ
    errorLogger: () => (error) => {
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
const foldEither = (onLeft, onRight) => (either) => isLeft(either) ? onLeft(either.left) : onRight(either.right);
exports.foldEither = foldEither;
//# sourceMappingURL=api-client.js.map