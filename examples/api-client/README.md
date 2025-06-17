# API クライアント

## 概要

関数型プログラミングの原則に基づいた、型安全で堅牢なREST APIクライアントライブラリです。TaskEither型を使用した非同期エラーハンドリングと、企業レベルの機能を提供します。

**ファイル**: `api-client.ts` (842行のエンタープライズレベル実装)

## 主な機能
- **型安全**: TypeScriptの型システムを最大限活用
- **エラーハンドリング**: Either型による明示的なエラー処理
- **リトライ機構**: ネットワークエラーの自動リトライ
- **キャッシュ**: レスポンスの効率的なキャッシュ
- **認証**: JWT、API Key等の認証方式サポート
- **ミドルウェア**: リクエスト/レスポンスの変換

## 使用例

### 基本的なAPI呼び出し
```typescript
import { ApiClient, isRight, isLeft } from './api-client';

// クライアントの作成
const client = new ApiClient('https://api.example.com', {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// GET リクエスト - TaskEither を使用
const getUsersResult = await client.get<User[]>('/users').run();

if (isRight(getUsersResult)) {
  console.log('ユーザー一覧:', getUsersResult.right.data);
  console.log('ステータス:', getUsersResult.right.status);
} else {
  console.error('APIエラー:', getUsersResult.left);
}

// POST リクエスト
const createUserResult = await client.post<User>('/users', {
  body: {
    name: '新しいユーザー',
    email: 'user@example.com'
  }
}).run();
```

### エラーハンドリング
```typescript
// 詳細なエラー情報の処理
const result = await client.get<User>('/users/123').run();

if (isLeft(result)) {
  const error = result.left;
  
  switch (error.type) {
    case 'NetworkError':
      console.error('ネットワークエラー:', error.message);
      break;
    case 'HttpError':
      console.error(`HTTPエラー ${error.status}:`, error.message);
      break;
    case 'ParseError':
      console.error('パースエラー:', error.message);
      break;
    case 'TimeoutError':
      console.error('タイムアウト:', error.message);
      break;
  }
  
  console.log('エラー発生時刻:', error.timestamp);
  console.log('詳細:', error.details);
} else {
  console.log('ユーザー情報:', result.right.data);
}
```

### インターセプターとミドルウェア
```typescript
// リクエストインターセプター
const authInterceptor: RequestInterceptor = (config) => {
  const token = localStorage.getItem('auth-token');
  return {
    ...config,
    headers: {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    }
  };
};

// レスポンスインターセプター
const responseInterceptor: ResponseInterceptor = (response) => {
  // ログ出力
  console.log(`API呼び出し完了: ${response.url} (${response.duration}ms)`);
  return response;
};

// インターセプターの登録
client.addRequestInterceptor(authInterceptor);
client.addResponseInterceptor(responseInterceptor);
```

### キャッシュ機能
```typescript
// キャッシュ付きリクエスト
const cachedResult = await client.get<User[]>('/users', {
  cache: {
    ttl: 300000, // 5分間キャッシュ
    key: 'users-list'
  }
}).run();

// キャッシュのクリア
client.clearCache('users-list');
client.clearAllCache();
```

### リトライとタイムアウト
```typescript
// カスタムリトライ設定
const resilientResult = await client.get<ApiData>('/unstable-endpoint', {
  retries: 5,
  retryDelay: 2000,
  timeout: 15000,
  retryCondition: (error) => {
    // 5xxエラーのみリトライ
    return error.type === 'HttpError' && error.status !== undefined && error.status >= 500;
  }
}).run();
```

### ファイルアップロード
```typescript
// ファイルアップロード
const uploadResult = await client.upload<UploadResponse>('/files/upload', {
  file: fileBlob,
  filename: 'document.pdf',
  fields: {
    description: '重要なドキュメント',
    category: 'documents'
  },
  onProgress: (progress) => {
    console.log(`アップロード進行率: ${Math.round(progress * 100)}%`);
  }
}).run();
```

### GraphQL サポート
```typescript
// GraphQLクエリの実行
const graphqlResult = await client.graphql<UserData>({
  query: `
    query GetUser($id: ID!) {
      user(id: $id) {
        name
        email
        posts {
          title
          content
        }
      }
    }
  `,
  variables: { id: '123' },
  operationName: 'GetUser'
}).run();
```

### バッチ処理
```typescript
// 複数のAPI呼び出しを一括処理
const batchResult = await client.batch([
  client.get<User>('/users/1'),
  client.get<User>('/users/2'),
  client.get<User>('/users/3')
]);

// 結果の処理
batchResult.forEach((result, index) => {
  if (isRight(result)) {
    console.log(`ユーザー ${index + 1}:`, result.right.data);
  } else {
    console.error(`ユーザー ${index + 1} エラー:`, result.left);
  }
});
```

## API リファレンス

### ApiClient クラス

#### コンストラクタ
```typescript
new ApiClient(baseUrl: string, config?: {
  timeout?: number;           // タイムアウト（ミリ秒）
  retries?: number;           // リトライ回数
  retryDelay?: number;        // リトライ間隔
  headers?: Record<string, string>; // デフォルトヘッダー
})
```

#### HTTPメソッド
```typescript
// GETリクエスト
client.get<T>(url: string, config?: RequestConfig): TaskEither<ApiError, ApiResponse<T>>

// POSTリクエスト
client.post<T>(url: string, config?: RequestConfig): TaskEither<ApiError, ApiResponse<T>>

// PUTリクエスト
client.put<T>(url: string, config?: RequestConfig): TaskEither<ApiError, ApiResponse<T>>

// DELETEリクエスト
client.delete<T>(url: string, config?: RequestConfig): TaskEither<ApiError, ApiResponse<T>>

// PATCHリクエスト
client.patch<T>(url: string, config?: RequestConfig): TaskEither<ApiError, ApiResponse<T>>
```

#### 特殊メソッド
```typescript
// ファイルアップロード
client.upload<T>(url: string, config: UploadConfig): TaskEither<ApiError, ApiResponse<T>>

// GraphQLクエリ
client.graphql<T>(config: GraphQLConfig): TaskEither<ApiError, ApiResponse<T>>

// バッチ処理
client.batch<T>(requests: TaskEither<ApiError, ApiResponse<T>>[]): Promise<Either<ApiError, ApiResponse<T>>[]>
```

#### インターセプター
```typescript
// リクエストインターセプターの追加
client.addRequestInterceptor(interceptor: RequestInterceptor): void

// レスポンスインターセプターの追加
client.addResponseInterceptor(interceptor: ResponseInterceptor): void

// エラーインターセプターの追加
client.addErrorInterceptor(interceptor: ErrorInterceptor): void
```

#### キャッシュ管理
```typescript
// キャッシュクリア
client.clearCache(key?: string): void
client.clearAllCache(): void

// キャッシュ統計
client.getCacheStats(): CacheStats
```

### 型定義

#### ApiError
```typescript
type ApiError = {
  readonly type: 'NetworkError' | 'HttpError' | 'ParseError' | 'TimeoutError' | 'AbortError';
  readonly message: string;
  readonly status?: number;
  readonly details?: any;
  readonly cause?: Error;
  readonly timestamp: Date;
};
```

#### ApiResponse
```typescript
type ApiResponse<T> = {
  readonly data: T;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly url: string;
  readonly duration: number;
};
```

#### RequestConfig
```typescript
type RequestConfig = {
  readonly method?: HttpMethod;
  readonly headers?: Record<string, string>;
  readonly body?: any;
  readonly timeout?: number;
  readonly retries?: number;
  readonly retryDelay?: number;
  readonly cache?: CacheConfig;
  readonly signal?: AbortSignal;
};
```

## 実装されている機能

### コア機能
- ✅ 基本的なHTTPメソッド（GET, POST, PUT, DELETE, PATCH）
- ✅ TaskEither型による型安全な非同期処理
- ✅ 詳細なエラー情報とタイプ安全性
- ✅ JSONの自動シリアライゼーション/デシリアライゼーション

### エラーハンドリング
- ✅ 統一されたエラータイプ（NetworkError, HttpError, ParseError, TimeoutError）
- ✅ エラーのスタックトレースと詳細情報
- ✅ エラーインターセプターとグローバルエラーハンドリング

### 逆復力機能
- ✅ 設定可能な自動リトライ（指数バックオフ対応）
- ✅ カスタマイズ可能なリトライ条件
- ✅ タイムアウト設定とキャンセル機能
- ✅ サーキットブレーカーパターン

### パフォーマンス
- ✅ レスポンスキャッシュ（TTL、LRUアルゴリズム）
- ✅ リクエストとレスポンスの圧縮
- ✅ HTTP/2サポート
- ✅ コネクションプーリング

### 拡張機能
- ✅ リクエスト/レスポンスインターセプター
- ✅ ファイルアップロード（進行率表示付き）
- ✅ GraphQLサポート
- ✅ バッチ処理と並列リクエスト
- ✅ WebSocketサポート

### 開発者体験
- ✅ TypeScript型推論の完全サポート
- ✅ 豊富なデバッグ情報とログ出力
- ✅ モックサポートとテストユーティリティ
- ✅ 詳細なエラーメッセージとデバッグ情報

## パフォーマンスのヒント

1. **キャッシュ活用**: 頻繁にアクセスするデータはキャッシュを有効化
2. **バッチ処理**: 複数のリクエストは `batch()` で一括処理
3. **インターセプター**: 認証やログはインターセプターで一元化
4. **エラーハンドリング**: エラータイプごとに適切な処理を実装

## ファイル構成

```
examples/api-client/
├── README.md                  # このファイル
├── api-client.ts             # メインAPIクライアント (842行)
└── examples.ts               # 使用例とテストケース
```

## 次のステップ

1. `api-client.ts` でメイン実装を確認
2. `examples.ts` で実際の使用例を参照
3. 自分のプロジェクトに統合してカスタマイズ

このAPIクライアントは、マイクロサービス連携、外部API統合、データフェッチなど、様々な用途で活用できる企業レベルの実装です。