# レベル4A: 非同期処理の基礎

## 目標
このレベルでは、関数型プログラミングの非同期処理の基本を学びます。TaskEitherの基本的な使い方と、Promise、async/awaitとの組み合わせを習得します。

## 学習内容

### 1. なぜ非同期処理で関数型アプローチが必要なのか？

**従来のPromiseとasync/awaitの問題:**

```typescript
// ❌ 従来の非同期処理の問題
const fetchUserData = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user'); // エラー情報が曖昧
    }
    const userData = await response.json();
    
    // さらに追加データを取得
    const profileResponse = await fetch(`/api/profiles/${userData.profileId}`);
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch profile'); // どこでエラーが起きたかわからない
    }
    const profileData = await profileResponse.json();
    
    return { ...userData, profile: profileData };
  } catch (error) {
    console.error(error); // エラーハンドリングが散在
    throw error; // エラーの種類が不明確
  }
};

// 問題点：
// 1. エラーの種類と発生箇所が不明確
// 2. エラーハンドリングが分散している
// 3. 型安全性が保証されない
// 4. 複数の非同期処理の組み合わせが複雑
```

```typescript
// ✅ TaskEitherを使った解決策
import { TaskEither, left, right, mapEither, flatMapEither } from '../03-types/solutions';

type ApiError = {
  type: 'NetworkError' | 'NotFoundError' | 'ParseError';
  message: string;
  endpoint: string;
};

type User = { id: number; name: string; profileId: number };
type Profile = { id: number; bio: string; avatar: string };
type UserWithProfile = User & { profile: Profile };

// 安全なfetch関数
const safeFetch = (url: string): TaskEither<ApiError, any> => {
  return TaskEither.fromPromise(
    fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    }),
    (error): ApiError => ({
      type: 'NetworkError',
      message: error.message,
      endpoint: url
    })
  );
};

// 段階的な処理の構築
const fetchUser = (userId: number): TaskEither<ApiError, User> =>
  safeFetch(`/api/users/${userId}`);

const fetchProfile = (profileId: number): TaskEither<ApiError, Profile> =>
  safeFetch(`/api/profiles/${profileId}`);

const fetchUserWithProfile = (userId: number): TaskEither<ApiError, UserWithProfile> =>
  fetchUser(userId)
    .flatMap(user => 
      fetchProfile(user.profileId)
        .map(profile => ({ ...user, profile }))
    );

// 利点：
// 1. エラーの種類と発生箇所が明確
// 2. 型安全な非同期処理
// 3. エラーハンドリングが統一されている
// 4. 関数の合成が可能
```

### 2. TaskEitherの基本的な使い方

**TaskEitherとは？**
非同期処理の結果を型安全に扱うためのコンテナです。`Promise<Either<L, R>>`のラッパーと考えることができます。

```typescript
class TaskEither<L, R> {
  constructor(private readonly task: Promise<Either<L, R>>) {}

  // 基本的なコンストラクタ
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

  // map: 成功値の変換
  map<U>(fn: (value: R) => U): TaskEither<L, U> {
    return new TaskEither(
      this.task.then(either => 
        isRight(either) ? right(fn(either.right)) : either
      )
    );
  }

  // flatMap: TaskEitherを返す関数の合成
  flatMap<U>(fn: (value: R) => TaskEither<L, U>): TaskEither<L, U> {
    return new TaskEither(
      this.task.then(either => 
        isRight(either) ? fn(either.right).run() : Promise.resolve(either)
      )
    );
  }

  // 実行して結果を取得
  run(): Promise<Either<L, R>> {
    return this.task;
  }
}
```

### 3. 実践的な例：ユーザー認証システム

```typescript
// エラー型の定義
type AuthError = 
  | { type: 'InvalidCredentials'; message: string }
  | { type: 'NetworkError'; message: string }
  | { type: 'TokenExpired'; message: string };

type LoginCredentials = { username: string; password: string };
type AuthToken = { token: string; expiresAt: Date };
type User = { id: number; username: string; email: string };

// 段階的に関数を構築
const validateCredentials = (credentials: LoginCredentials): TaskEither<AuthError, LoginCredentials> => {
  if (!credentials.username || !credentials.password) {
    return TaskEither.left({
      type: 'InvalidCredentials',
      message: 'ユーザー名とパスワードを入力してください'
    });
  }
  return TaskEither.of(credentials);
};

const authenticateUser = (credentials: LoginCredentials): TaskEither<AuthError, AuthToken> =>
  TaskEither.fromPromise(
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(response => {
      if (response.status === 401) {
        throw new Error('認証に失敗しました');
      }
      if (!response.ok) {
        throw new Error('ネットワークエラーが発生しました');
      }
      return response.json();
    }),
    (error): AuthError => ({
      type: error.message.includes('認証') ? 'InvalidCredentials' : 'NetworkError',
      message: error.message
    })
  );

const fetchUserInfo = (token: AuthToken): TaskEither<AuthError, User> =>
  TaskEither.fromPromise(
    fetch('/api/user/me', {
      headers: { Authorization: `Bearer ${token.token}` }
    }).then(response => {
      if (response.status === 401) {
        throw new Error('トークンが無効です');
      }
      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }
      return response.json();
    }),
    (error): AuthError => ({
      type: error.message.includes('トークン') ? 'TokenExpired' : 'NetworkError',
      message: error.message
    })
  );

// 全体の処理を合成
const loginUser = (credentials: LoginCredentials): TaskEither<AuthError, User> =>
  validateCredentials(credentials)
    .flatMap(authenticateUser)
    .flatMap(fetchUserInfo);

// 使用例
const handleLogin = async (username: string, password: string) => {
  const result = await loginUser({ username, password }).run();
  
  if (result._tag === 'Left') {
    const error = result.left;
    switch (error.type) {
      case 'InvalidCredentials':
        console.error('認証エラー:', error.message);
        break;
      case 'NetworkError':
        console.error('ネットワークエラー:', error.message);
        break;
      case 'TokenExpired':
        console.error('トークン期限切れ:', error.message);
        break;
    }
  } else {
    const user = result.right;
    console.log('ログイン成功:', user);
  }
};
```

### 4. 学習のポイント

#### 段階的な理解
1. **まずPromiseとEitherを理解** - TaskEitherはこの2つの組み合わせ
2. **単純なケースから始める** - 1つの非同期処理から
3. **合成を学ぶ** - flatMapで複数の処理を繋げる
4. **エラーハンドリング** - 型安全なエラー処理を習得

#### よくある間違い
```typescript
// ❌ よくある間違い：mapとflatMapの混同
const wrongUsage = (userId: number) =>
  fetchUser(userId)
    .map(user => fetchProfile(user.profileId)) // これはTaskEither<Error, TaskEither<Error, Profile>>になってしまう
    .run();

// ✅ 正しい使い方
const correctUsage = (userId: number) =>
  fetchUser(userId)
    .flatMap(user => fetchProfile(user.profileId)) // flatMapでネストを平坦化
    .run();
```

## 練習問題

### 問題1: 基本的なTaskEither
```typescript
// TODO: 以下の関数をTaskEitherを使って実装してください
const safeParseInt = (str: string): TaskEither<string, number> => {
  // 文字列を数値に変換し、失敗した場合はエラーメッセージを返す
  // ヒント: TaskEither.of() または TaskEither.left() を使用
};
```

### 問題2: 非同期処理の合成
```typescript
// TODO: 複数のAPIを呼び出して結果を合成する関数を実装してください
const fetchUserProfile = (userId: number): TaskEither<ApiError, UserWithProfile> => {
  // 1. ユーザー情報を取得
  // 2. プロフィール情報を取得
  // 3. 2つを合成して返す
  // ヒント: flatMapを使って段階的に処理を組み立てる
};
```

## 次のステップ
このレベルをマスターしたら、[レベル4B: 状態管理](../04b-state-management/README.md)に進んで、より複雑な状態管理パターンを学びましょう。