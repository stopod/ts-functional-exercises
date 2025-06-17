"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// API クライアント使用例
// 実際のWebアプリケーションでの具体的な使用方法を示します
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
exports.runApiClientExamples = runApiClientExamples;
const api_client_1 = require("./api-client");
// APIクライアントの作成
const apiClient = new api_client_1.ApiClient('https://api.example.com', {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}, {
    timeout: 10000,
    enableCache: true
});
// 基本的なCRUD操作
class UserService {
    // ユーザー一覧取得
    static async getUsers() {
        const result = await apiClient.get('/users').run();
        return (0, api_client_1.foldEither)((error) => {
            console.error('Failed to fetch users:', error);
            throw new Error(`Failed to fetch users: ${error.message}`);
        }, (response) => response.data)(result);
    }
    // ユーザー詳細取得
    static async getUser(id) {
        const result = await apiClient.get(`/users/${id}`).run();
        return (0, api_client_1.foldEither)((error) => {
            if (error.status === 404) {
                return null; // ユーザーが見つからない場合
            }
            console.error('Failed to fetch user:', error);
            throw new Error(`Failed to fetch user: ${error.message}`);
        }, (response) => response.data)(result);
    }
    // ユーザー作成
    static async createUser(userData) {
        const result = await apiClient.post('/users', userData).run();
        return (0, api_client_1.foldEither)((error) => {
            console.error('Failed to create user:', error);
            throw new Error(`Failed to create user: ${error.message}`);
        }, (response) => response.data)(result);
    }
    // ユーザー更新
    static async updateUser(id, userData) {
        const result = await apiClient.put(`/users/${id}`, userData).run();
        return (0, api_client_1.foldEither)((error) => {
            console.error('Failed to update user:', error);
            throw new Error(`Failed to update user: ${error.message}`);
        }, (response) => response.data)(result);
    }
    // ユーザー削除
    static async deleteUser(id) {
        const result = await apiClient.delete(`/users/${id}`).run();
        return (0, api_client_1.foldEither)((error) => {
            console.error('Failed to delete user:', error);
            throw new Error(`Failed to delete user: ${error.message}`);
        }, () => undefined)(result);
    }
}
exports.UserService = UserService;
// ===========================================
// 2. 認証付きAPIクライアント
// ===========================================
class AuthenticatedApiClient {
    constructor(baseUrl) {
        this.token = null;
        this.client = new api_client_1.ApiClient(baseUrl);
        this.setupInterceptors();
    }
    setupInterceptors() {
        // 認証トークンの自動挿入
        this.client.addRequestInterceptor((config) => {
            if (this.token) {
                return {
                    ...config,
                    headers: {
                        ...config.headers,
                        ...api_client_1.auth.bearer(this.token)
                    }
                };
            }
            return config;
        });
        // 401エラーでの自動ログアウト
        this.client.addErrorInterceptor((error) => {
            if (error.status === 401) {
                this.token = null;
                // ログアウト処理やリダイレクト
                if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
                    globalThis.location.href = '/login';
                }
            }
            return error;
        });
        // リクエスト/レスポンスログ（開発環境のみ）
        if (process.env.NODE_ENV === 'development') {
            this.client.addRequestInterceptor(api_client_1.interceptors.requestLogger());
            this.client.addResponseInterceptor(api_client_1.interceptors.responseLogger());
            this.client.addErrorInterceptor(api_client_1.interceptors.errorLogger());
        }
    }
    // ログイン
    async login(email, password) {
        const result = await this.client.post('/auth/login', {
            email,
            password
        }).run();
        return (0, api_client_1.foldEither)(() => false, (response) => {
            this.token = response.data.token;
            if (typeof localStorage !== 'undefined' && this.token) {
                localStorage.setItem('token', this.token);
            }
            return true;
        })(result);
    }
    // トークン設定
    setToken(token) {
        this.token = token;
    }
    // ログアウト
    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }
    // 認証済みリクエスト
    getClient() {
        return this.client;
    }
}
class RealTimeSyncClient {
    constructor(baseUrl, options) {
        this.options = options;
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.client = new api_client_1.ApiClient(baseUrl);
    }
    // 同期開始
    startSync(endpoint) {
        this.syncInterval = setInterval(async () => {
            try {
                const params = this.lastSyncTime ?
                    `?since=${this.lastSyncTime.toISOString()}` : '';
                const result = await this.client.get(`${endpoint}${params}`).run();
                (0, api_client_1.foldEither)((error) => {
                    console.error('Sync error:', error);
                    this.options.onError?.(error);
                }, (response) => {
                    this.lastSyncTime = new Date();
                    this.options.onUpdate?.(response.data);
                })(result);
            }
            catch (error) {
                console.error('Sync failed:', error);
                this.options.onError?.(error);
            }
        }, this.options.interval);
    }
    // 同期停止
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}
// ===========================================
// 4. ファイルアップロード
// ===========================================
class FileUploadClient {
    constructor(baseUrl) {
        this.client = new api_client_1.ApiClient(baseUrl);
    }
    // 単一ファイルアップロード
    async uploadFile(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        // プログレストラッキング用のカスタムfetchを使用
        const result = await this.client.post('/upload', formData, {
            headers: {
            // Content-Typeを削除してブラウザに自動設定させる
            },
            transformRequest: (data) => data // FormDataをそのまま送信
        }).run();
        return (0, api_client_1.foldEither)((error) => {
            throw new Error(`File upload failed: ${error.message}`);
        }, (response) => response.data)(result);
    }
    // 複数ファイルアップロード
    async uploadFiles(files) {
        const uploadPromises = files.map(file => this.uploadFile(file));
        return Promise.all(uploadPromises);
    }
    // チャンクアップロード（大容量ファイル用）
    async uploadLargeFile(file, chunkSize = 1024 * 1024, // 1MB chunks
    onProgress) {
        const totalChunks = Math.ceil(file.size / chunkSize);
        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // チャンクアップロード開始
        const initResult = await this.client.post('/upload/init', {
            fileName: file.name,
            fileSize: file.size,
            totalChunks,
            uploadId
        }).run();
        if ((0, api_client_1.isLeft)(initResult)) {
            throw new Error(`Failed to initialize upload: ${initResult.left.message}`);
        }
        // 各チャンクをアップロード
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            const chunkFormData = new FormData();
            chunkFormData.append('chunk', chunk);
            chunkFormData.append('chunkIndex', i.toString());
            chunkFormData.append('uploadId', uploadId);
            const chunkResult = await this.client.post(`/upload/chunk`, chunkFormData).run();
            if ((0, api_client_1.isLeft)(chunkResult)) {
                throw new Error(`Failed to upload chunk ${i}: ${chunkResult.left.message}`);
            }
            // プログレス更新
            onProgress?.((i + 1) / totalChunks * 100);
        }
        // アップロード完了
        const completeResult = await this.client.post('/upload/complete', {
            uploadId
        }).run();
        return (0, api_client_1.foldEither)((error) => {
            throw new Error(`Failed to complete upload: ${error.message}`);
        }, (response) => response.data)(completeResult);
    }
}
class GraphQLClient {
    constructor(endpoint) {
        this.client = new api_client_1.ApiClient(endpoint);
    }
    async query(query) {
        const result = await this.client.post('/', query).run();
        return (0, api_client_1.foldEither)((error) => {
            throw new Error(`GraphQL request failed: ${error.message}`);
        }, (response) => {
            if (response.data.errors && response.data.errors.length > 0) {
                const errorMessages = response.data.errors.map((err) => err.message).join(', ');
                throw new Error(`GraphQL errors: ${errorMessages}`);
            }
            if (!response.data.data) {
                throw new Error('No data returned from GraphQL query');
            }
            return response.data.data;
        })(result);
    }
    // GraphQLサブスクリプション（WebSocket経由）
    subscribe(query, onData, onError) {
        // WebSocket実装は省略
        // 実際の実装では ws や socket.io を使用
        return () => {
            // アンサブスクライブ処理
        };
    }
}
// ===========================================
// 使用例とテスト
// ===========================================
async function runApiClientExamples() {
    console.log('=== API クライアント使用例 ===');
    try {
        // 1. 基本的なCRUD操作
        console.log('\n1. ユーザー管理:');
        // ユーザー作成
        const newUser = await UserService.createUser({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepassword123'
        });
        console.log('Created user:', newUser);
        // ユーザー取得
        const user = await UserService.getUser(newUser.id);
        console.log('Fetched user:', user);
        // ユーザー更新
        const updatedUser = await UserService.updateUser(newUser.id, {
            name: 'John Smith'
        });
        console.log('Updated user:', updatedUser);
        // 2. 認証クライアント
        console.log('\n2. 認証:');
        const authClient = new AuthenticatedApiClient('https://api.example.com');
        const loginSuccess = await authClient.login('user@example.com', 'password');
        console.log('Login success:', loginSuccess);
        // 3. リアルタイム同期
        console.log('\n3. リアルタイム同期:');
        const syncClient = new RealTimeSyncClient('https://api.example.com', {
            interval: 5000,
            maxRetries: 3,
            onUpdate: (data) => console.log('Sync update:', data),
            onError: (error) => console.error('Sync error:', error)
        });
        // syncClient.startSync('/notifications');
        // 4. GraphQL
        console.log('\n4. GraphQL:');
        const gqlClient = new GraphQLClient('https://api.example.com/graphql');
        const gqlResult = await gqlClient.query({
            query: `
        query GetUsers($limit: Int) {
          users(limit: $limit) {
            id
            name
            email
          }
        }
      `,
            variables: { limit: 10 }
        });
        console.log('GraphQL result:', gqlResult);
    }
    catch (error) {
        console.error('Example execution failed:', error);
    }
    console.log('\n=== 例の実行完了 ===');
}
// 実際の使用例実行（コメントアウト）
// runApiClientExamples();
//# sourceMappingURL=examples.js.map