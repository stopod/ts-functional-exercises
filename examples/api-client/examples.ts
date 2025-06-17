// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// API クライアント使用例
// 実際のWebアプリケーションでの具体的な使用方法を示します

import { ApiClient, auth, interceptors, isLeft, isRight, foldEither } from './api-client';

// ===========================================
// 1. 基本的な使用例
// ===========================================

// API型定義
type User = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
};

type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
};

type UpdateUserRequest = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// APIクライアントの作成
const apiClient = new ApiClient('https://api.example.com', {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}, {
  timeout: 10000,
  enableCache: true
});

// 基本的なCRUD操作
export class UserService {
  // ユーザー一覧取得
  static async getUsers(): Promise<User[]> {
    const result = await apiClient.get<User[]>('/users').run();
    
    return foldEither(
      (error: any) => {
        console.error('Failed to fetch users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      },
      (response: any) => response.data
    )(result);
  }

  // ユーザー詳細取得
  static async getUser(id: number): Promise<User | null> {
    const result = await apiClient.get<User>(`/users/${id}`).run();
    
    return foldEither(
      (error: any) => {
        if (error.status === 404) {
          return null; // ユーザーが見つからない場合
        }
        console.error('Failed to fetch user:', error);
        throw new Error(`Failed to fetch user: ${error.message}`);
      },
      (response: any) => response.data
    )(result);
  }

  // ユーザー作成
  static async createUser(userData: CreateUserRequest): Promise<User> {
    const result = await apiClient.post<User, CreateUserRequest>('/users', userData).run();
    
    return foldEither(
      (error: any) => {
        console.error('Failed to create user:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      },
      (response: any) => response.data
    )(result);
  }

  // ユーザー更新
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    const result = await apiClient.put<User, UpdateUserRequest>(`/users/${id}`, userData).run();
    
    return foldEither(
      (error: any) => {
        console.error('Failed to update user:', error);
        throw new Error(`Failed to update user: ${error.message}`);
      },
      (response: any) => response.data
    )(result);
  }

  // ユーザー削除
  static async deleteUser(id: number): Promise<void> {
    const result = await apiClient.delete(`/users/${id}`).run();
    
    return foldEither(
      (error: any) => {
        console.error('Failed to delete user:', error);
        throw new Error(`Failed to delete user: ${error.message}`);
      },
      () => undefined
    )(result);
  }
}

// ===========================================
// 2. 認証付きAPIクライアント
// ===========================================

class AuthenticatedApiClient {
  private client: ApiClient;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.client = new ApiClient(baseUrl);
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 認証トークンの自動挿入
    this.client.addRequestInterceptor((config) => {
      if (this.token) {
        return {
          ...config,
          headers: {
            ...config.headers,
            ...auth.bearer(this.token)
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
          (globalThis as any).location.href = '/login';
        }
      }
      return error;
    });

    // リクエスト/レスポンスログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      this.client.addRequestInterceptor(interceptors.requestLogger());
      this.client.addResponseInterceptor(interceptors.responseLogger());
      this.client.addErrorInterceptor(interceptors.errorLogger());
    }
  }

  // ログイン
  async login(email: string, password: string): Promise<boolean> {
    const result = await this.client.post<{ token: string; user: User }>('/auth/login', {
      email,
      password
    }).run();

    return foldEither(
      () => false,
      (response: any) => {
        this.token = response.data.token;
        if (typeof localStorage !== 'undefined' && this.token) {
          localStorage.setItem('token', this.token);
        }
        return true;
      }
    )(result);
  }

  // トークン設定
  setToken(token: string): void {
    this.token = token;
  }

  // ログアウト
  logout(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  // 認証済みリクエスト
  getClient(): ApiClient {
    return this.client;
  }
}

// ===========================================
// 3. 高度な使用例 - リアルタイム同期
// ===========================================

type SyncOptions = {
  interval: number;
  maxRetries: number;
  onUpdate?: (data: any) => void;
  onError?: (error: any) => void;
};

class RealTimeSyncClient {
  private client: ApiClient;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;

  constructor(baseUrl: string, private options: SyncOptions) {
    this.client = new ApiClient(baseUrl);
  }

  // 同期開始
  startSync<T>(endpoint: string): void {
    this.syncInterval = setInterval(async () => {
      try {
        const params = this.lastSyncTime ? 
          `?since=${this.lastSyncTime.toISOString()}` : '';
        
        const result = await this.client.get<T[]>(`${endpoint}${params}`).run();
        
        foldEither(
          (error: any) => {
            console.error('Sync error:', error);
            this.options.onError?.(error);
          },
          (response: any) => {
            this.lastSyncTime = new Date();
            this.options.onUpdate?.(response.data);
          }
        )(result);
      } catch (error) {
        console.error('Sync failed:', error);
        this.options.onError?.(error);
      }
    }, this.options.interval);
  }

  // 同期停止
  stopSync(): void {
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
  private client: ApiClient;

  constructor(baseUrl: string) {
    this.client = new ApiClient(baseUrl);
  }

  // 単一ファイルアップロード
  async uploadFile(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    // プログレストラッキング用のカスタムfetchを使用
    const result = await this.client.post<{ url: string; id: string }>('/upload', formData, {
      headers: {
        // Content-Typeを削除してブラウザに自動設定させる
      },
      transformRequest: (data) => data // FormDataをそのまま送信
    }).run();

    return foldEither(
      (error: any) => {
        throw new Error(`File upload failed: ${error.message}`);
      },
      (response: any) => response.data
    )(result);
  }

  // 複数ファイルアップロード
  async uploadFiles(files: File[]): Promise<Array<{ url: string; id: string }>> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  // チャンクアップロード（大容量ファイル用）
  async uploadLargeFile(
    file: File,
    chunkSize: number = 1024 * 1024, // 1MB chunks
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; id: string }> {
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // チャンクアップロード開始
    const initResult = await this.client.post<{ uploadId: string }>('/upload/init', {
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      uploadId
    }).run();

    if (isLeft(initResult)) {
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

      if (isLeft(chunkResult)) {
        throw new Error(`Failed to upload chunk ${i}: ${chunkResult.left.message}`);
      }

      // プログレス更新
      onProgress?.((i + 1) / totalChunks * 100);
    }

    // アップロード完了
    const completeResult = await this.client.post<{ url: string; id: string }>('/upload/complete', {
      uploadId
    }).run();

    return foldEither(
      (error: any) => {
        throw new Error(`Failed to complete upload: ${error.message}`);
      },
      (response: any) => response.data
    )(completeResult);
  }
}

// ===========================================
// 5. GraphQL クライアント
// ===========================================

type GraphQLQuery = {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
};

class GraphQLClient {
  private client: ApiClient;

  constructor(endpoint: string) {
    this.client = new ApiClient(endpoint);
  }

  async query<T>(query: GraphQLQuery): Promise<T> {
    const result = await this.client.post<GraphQLResponse<T>>('/', query).run();

    return foldEither(
      (error: any) => {
        throw new Error(`GraphQL request failed: ${error.message}`);
      },
      (response: any) => {
        if (response.data.errors && response.data.errors.length > 0) {
          const errorMessages = response.data.errors.map((err: any) => err.message).join(', ');
          throw new Error(`GraphQL errors: ${errorMessages}`);
        }
        
        if (!response.data.data) {
          throw new Error('No data returned from GraphQL query');
        }
        
        return response.data.data;
      }
    )(result);
  }

  // GraphQLサブスクリプション（WebSocket経由）
  subscribe<T>(
    query: GraphQLQuery,
    onData: (data: T) => void,
    onError?: (error: Error) => void
  ): () => void {
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

export async function runApiClientExamples() {
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
    
    const gqlResult = await gqlClient.query<{ users: User[] }>({
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

  } catch (error) {
    console.error('Example execution failed:', error);
  }

  console.log('\n=== 例の実行完了 ===');
}

// 実際の使用例実行（コメントアウト）
// runApiClientExamples();