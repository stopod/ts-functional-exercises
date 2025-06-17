# レベル4: 実践的パターン

## 目標
このレベルでは、実際のWebアプリケーション開発で遭遇する場面で関数型プログラミングを活用する方法を学びます。非同期処理、状態管理、パフォーマンス最適化など、実践的な技術を習得します。

## 学習内容

### 1. 非同期処理の関数型アプローチ

#### Promise との関数型結合

**基本的なPromise操作の関数型化**

```typescript
// Promise を扱う関数型ユーティリティ
const mapPromise = <T, U>(fn: (value: T) => U) => 
  (promise: Promise<T>): Promise<U> => promise.then(fn);

const flatMapPromise = <T, U>(fn: (value: T) => Promise<U>) => 
  (promise: Promise<T>): Promise<U> => promise.then(fn);

const filterPromise = <T>(predicate: (value: T) => boolean) => 
  (promise: Promise<T>): Promise<T | undefined> => 
    promise.then(value => predicate(value) ? value : undefined);

// 使用例
const fetchUser = (id: number): Promise<User> => 
  fetch(`/api/users/${id}`).then(res => res.json());

const processUser = (user: User): User => ({
  ...user,
  displayName: `${user.firstName} ${user.lastName}`
});

const getUserDisplayName = (id: number): Promise<string> =>
  fetchUser(id)
    |> mapPromise(processUser)
    |> mapPromise(user => user.displayName);
```

#### TaskEither パターンの実用化

```typescript
// 実用的なTaskEither実装
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
    onError: (error: any) => L
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

// 実用例: API呼び出しチェーン
type ApiError = {
  status: number;
  message: string;
};

const safeApiCall = <T>(url: string): TaskEither<ApiError, T> =>
  TaskEither.fromPromise(
    fetch(url).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    }),
    (error: any) => ({
      status: 500,
      message: error.message || 'Network error'
    })
  );

const fetchUserProfile = (userId: number): TaskEither<ApiError, UserProfile> =>
  safeApiCall<User>(`/api/users/${userId}`)
    .flatMap(user => 
      safeApiCall<Profile>(`/api/users/${userId}/profile`)
        .map(profile => ({ user, profile }))
    );
```

### 2. 状態管理の関数型パターン

#### Reducer パターンの拡張

```typescript
// 型安全なActionとReducer
type Action<T extends string, P = {}> = {
  type: T;
  payload: P;
};

type ActionCreator<T extends string, P = {}> = (payload: P) => Action<T, P>;

// アクション定義のヘルパー
const createAction = <T extends string>(type: T) => 
  <P = {}>(payload: P): Action<T, P> => ({ type, payload });

const createSimpleAction = <T extends string>(type: T) => 
  (): Action<T, {}> => ({ type, payload: {} });

// 使用例
const increment = createSimpleAction('INCREMENT');
const decrement = createSimpleAction('DECREMENT');
const setCount = createAction('SET_COUNT');

type CounterAction = 
  | ReturnType<typeof increment>
  | ReturnType<typeof decrement>
  | ReturnType<typeof setCount>;

// パターンマッチング風のReducer
const matchAction = <S, A extends Action<string, any>>(
  matchers: {
    [K in A['type']]?: (state: S, action: Extract<A, { type: K }>) => S;
  }
) => (defaultHandler: (state: S, action: A) => S) => 
  (state: S, action: A): S => {
    const handler = matchers[action.type];
    return handler ? handler(state, action as any) : defaultHandler(state, action);
  };

// Reducerの実装
type CounterState = { count: number };

const counterReducer = matchAction<CounterState, CounterAction>({
  INCREMENT: (state) => ({ count: state.count + 1 }),
  DECREMENT: (state) => ({ count: state.count - 1 }),
  SET_COUNT: (state, action) => ({ count: action.payload })
})((state) => state); // デフォルトハンドラー
```

#### 不変更新のヘルパー

```typescript
// 深い更新のためのヘルパー関数
type PathArray<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? [K] | [K, ...PathArray<T[K], keyof T[K]>]
    : [K]
  : never;

type PathValue<T, P extends ReadonlyArray<string | number>> = 
  P extends readonly [infer K, ...infer Rest]
    ? K extends keyof T
      ? Rest extends ReadonlyArray<string | number>
        ? PathValue<T[K], Rest>
        : T[K]
      : never
    : T;

const updateIn = <T>(obj: T) => 
  <P extends ReadonlyArray<string | number>>(path: P) => 
    (updater: (value: PathValue<T, P>) => PathValue<T, P>): T => {
      if (path.length === 0) return updater(obj as any);
      
      const [head, ...tail] = path;
      const current = (obj as any)[head];
      
      return {
        ...obj,
        [head]: updateIn(current)(tail as any)(updater)
      } as T;
    };

// 使用例
type AppState = {
  user: {
    profile: {
      name: string;
      settings: {
        theme: 'light' | 'dark';
        notifications: boolean;
      };
    };
    preferences: string[];
  };
  ui: {
    loading: boolean;
    errors: string[];
  };
};

const updateUserTheme = (state: AppState, theme: 'light' | 'dark'): AppState =>
  updateIn(state)(['user', 'profile', 'settings', 'theme'])(() => theme);

const addError = (state: AppState, error: string): AppState =>
  updateIn(state)(['ui', 'errors'])(errors => [...errors, error]);
```

### 3. パフォーマンス最適化パターン

#### メモ化と関数キャッシュ

```typescript
// 高度なメモ化実装
type Memoized<T extends (...args: any[]) => any> = T & {
  cache: Map<string, ReturnType<T>>;
  clear: () => void;
};

const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): Memoized<T> => {
  const cache = new Map<string, ReturnType<T>>();
  
  const generateKey = keyGenerator || ((...args) => JSON.stringify(args));
  
  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = generateKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as Memoized<T>;
  
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  
  return memoized;
};

// 非同期関数のメモ化
const memoizeAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): Memoized<T> => {
  const cache = new Map<string, ReturnType<T>>();
  const pendingPromises = new Map<string, ReturnType<T>>();
  
  const generateKey = keyGenerator || ((...args) => JSON.stringify(args));
  
  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = generateKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    if (pendingPromises.has(key)) {
      return pendingPromises.get(key)!;
    }
    
    const promise = fn(...args).then(
      result => {
        cache.set(key, Promise.resolve(result));
        pendingPromises.delete(key);
        return result;
      },
      error => {
        pendingPromises.delete(key);
        throw error;
      }
    ) as ReturnType<T>;
    
    pendingPromises.set(key, promise);
    return promise;
  }) as Memoized<T>;
  
  memoized.cache = cache;
  memoized.clear = () => {
    cache.clear();
    pendingPromises.clear();
  };
  
  return memoized;
};

// 使用例
const expensiveCalculation = memoize((a: number, b: number): number => {
  console.log('Computing...'); // デバッグ用
  return Math.pow(a, b);
});

const fetchUser = memoizeAsync(
  async (id: number): Promise<User> => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  },
  (id) => `user-${id}` // カスタムキー生成
);
```

#### 遅延評価パターン

```typescript
// Lazy 評価の実装
class Lazy<T> {
  private _value?: T;
  private _computed = false;

  constructor(private computation: () => T) {}

  get value(): T {
    if (!this._computed) {
      this._value = this.computation();
      this._computed = true;
    }
    return this._value!;
  }

  map<U>(fn: (value: T) => U): Lazy<U> {
    return new Lazy(() => fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Lazy<U>): Lazy<U> {
    return new Lazy(() => fn(this.value).value);
  }

  static of<T>(value: T): Lazy<T> {
    return new Lazy(() => value);
  }
}

// 使用例
const lazyExpensiveComputation = new Lazy(() => {
  console.log('Heavy computation running...');
  return Array.from({ length: 1000000 }, (_, i) => i * i).reduce((a, b) => a + b, 0);
});

const processedResult = lazyExpensiveComputation
  .map(sum => sum / 1000000)
  .map(avg => Math.sqrt(avg));

// 実際に使用するときまで計算されない
console.log('Value:', processedResult.value);
```

### 4. バリデーションアーキテクチャ

#### スキーマベースバリデーション

```typescript
// スキーマ定義システム
type ValidationResult<T> = Either<ValidationError[], T>;

interface Validator<T> {
  validate(value: unknown): ValidationResult<T>;
}

// 基本バリデーター
const string: Validator<string> = {
  validate: (value: unknown): ValidationResult<string> => 
    typeof value === 'string' 
      ? right(value) 
      : left([{ field: 'root', message: 'Expected string' }])
};

const number: Validator<number> = {
  validate: (value: unknown): ValidationResult<number> => 
    typeof value === 'number' 
      ? right(value) 
      : left([{ field: 'root', message: 'Expected number' }])
};

const boolean: Validator<boolean> = {
  validate: (value: unknown): ValidationResult<boolean> => 
    typeof value === 'boolean' 
      ? right(value) 
      : left([{ field: 'root', message: 'Expected boolean' }])
};

// バリデーター コンビネータ
const array = <T>(itemValidator: Validator<T>): Validator<T[]> => ({
  validate: (value: unknown): ValidationResult<T[]> => {
    if (!Array.isArray(value)) {
      return left([{ field: 'root', message: 'Expected array' }]);
    }

    const results: ValidationResult<T>[] = value.map((item, index) => 
      mapLeft<ValidationError[], T, ValidationError[]>(
        errors => errors.map(error => ({ 
          ...error, 
          field: `[${index}]${error.field === 'root' ? '' : '.' + error.field}` 
        }))
      )(itemValidator.validate(item))
    );

    const errors: ValidationError[] = [];
    const successes: T[] = [];

    results.forEach(result => {
      if (isLeft(result)) {
        errors.push(...result.left);
      } else {
        successes.push(result.right);
      }
    });

    return errors.length > 0 ? left(errors) : right(successes);
  }
});

const object = <T extends Record<string, any>>(
  schema: { [K in keyof T]: Validator<T[K]> }
): Validator<T> => ({
  validate: (value: unknown): ValidationResult<T> => {
    if (typeof value !== 'object' || value === null) {
      return left([{ field: 'root', message: 'Expected object' }]);
    }

    const obj = value as Record<string, unknown>;
    const errors: ValidationError[] = [];
    const result: Partial<T> = {};

    for (const [key, validator] of Object.entries(schema)) {
      const fieldResult = validator.validate(obj[key]);
      if (isLeft(fieldResult)) {
        errors.push(...fieldResult.left.map(error => ({
          ...error,
          field: error.field === 'root' ? key : `${key}.${error.field}`
        })));
      } else {
        (result as any)[key] = fieldResult.right;
      }
    }

    return errors.length > 0 ? left(errors) : right(result as T);
  }
});

// カスタムバリデーター
const minLength = (min: number) => (validator: Validator<string>): Validator<string> => ({
  validate: (value: unknown): ValidationResult<string> => {
    const stringResult = validator.validate(value);
    if (isLeft(stringResult)) return stringResult;
    
    return stringResult.right.length >= min
      ? right(stringResult.right)
      : left([{ field: 'root', message: `Minimum length is ${min}` }]);
  }
});

const email = (validator: Validator<string>): Validator<string> => ({
  validate: (value: unknown): ValidationResult<string> => {
    const stringResult = validator.validate(value);
    if (isLeft(stringResult)) return stringResult;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(stringResult.right)
      ? right(stringResult.right)
      : left([{ field: 'root', message: 'Invalid email format' }]);
  }
});

// 使用例
type User = {
  name: string;
  email: string;
  age: number;
  preferences: {
    theme: string;
    notifications: boolean;
  };
  tags: string[];
};

const userValidator: Validator<User> = object({
  name: minLength(1)(string),
  email: email(string),
  age: number,
  preferences: object({
    theme: string,
    notifications: boolean
  }),
  tags: array(string)
});

const validateUser = (data: unknown): ValidationResult<User> => 
  userValidator.validate(data);
```

### 5. エラーハンドリング戦略

#### エラー境界とリカバリ

```typescript
// エラーカテゴリ分類
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
type ErrorCategory = 'network' | 'validation' | 'authorization' | 'business' | 'system';

interface AppError {
  readonly code: string;
  readonly message: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly timestamp: Date;
}

// エラーファクトリー
const createError = (
  code: string,
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity,
  details?: Record<string, unknown>,
  cause?: Error
): AppError => ({
  code,
  message,
  category,
  severity,
  details,
  cause,
  timestamp: new Date()
});

// 特定エラー型のファクトリー
const createNetworkError = (message: string, details?: Record<string, unknown>, cause?: Error) =>
  createError('NETWORK_ERROR', message, 'network', 'medium', details, cause);

const createValidationError = (message: string, details?: Record<string, unknown>) =>
  createError('VALIDATION_ERROR', message, 'validation', 'low', details);

const createAuthError = (message: string, details?: Record<string, unknown>) =>
  createError('AUTH_ERROR', message, 'authorization', 'high', details);

// エラーリカバリ戦略
type RecoveryStrategy<T> = (error: AppError) => TaskEither<AppError, T>;

const withRetry = <T>(
  operation: () => TaskEither<AppError, T>,
  maxRetries: number = 3,
  delay: number = 1000
): TaskEither<AppError, T> => {
  const attempt = (retriesLeft: number): TaskEither<AppError, T> => {
    return new TaskEither(
      operation().run().then(result => {
        if (isRight(result) || retriesLeft === 0) {
          return result;
        }
        
        // リトライ可能なエラーかチェック
        const error = result.left;
        if (error.category === 'network' && error.severity !== 'critical') {
          return new Promise(resolve => {
            setTimeout(() => {
              attempt(retriesLeft - 1).run().then(resolve);
            }, delay);
          });
        }
        
        return result;
      })
    );
  };
  
  return attempt(maxRetries);
};

const withFallback = <T>(
  primary: () => TaskEither<AppError, T>,
  fallback: () => TaskEither<AppError, T>
): TaskEither<AppError, T> => {
  return new TaskEither(
    primary().run().then(result => {
      if (isRight(result)) {
        return result;
      }
      
      // 特定のエラーの場合のみフォールバック
      const error = result.left;
      if (error.category === 'network' || error.category === 'system') {
        return fallback().run();
      }
      
      return result;
    })
  );
};
```

### 6. 型レベルプログラミング

#### 高度な型操作

```typescript
// 条件型を使った型変換
type NonNullable<T> = T extends null | undefined ? never : T;

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 関数型のユーティリティ型
type Curry<T> = T extends (...args: infer A) => infer R
  ? A extends [infer H, ...infer T]
    ? (arg: H) => Curry<(...args: T) => R>
    : R
  : never;

type Pipe<T extends readonly unknown[]> = T extends readonly [
  infer H,
  ...infer R
]
  ? H extends (arg: infer A) => infer B
    ? R extends readonly [(arg: B) => infer C, ...infer Rest]
      ? Pipe<[(arg: A) => C, ...Rest]>
      : H
    : never
  : never;

// ブランド型（名義型）
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<number, 'UserId'>;
type ProductId = Brand<string, 'ProductId'>;

const createUserId = (id: number): UserId => id as UserId;
const createProductId = (id: string): ProductId => id as ProductId;

// 型安全な演算
const getUserById = (id: UserId): Promise<User> => {
  // UserId でなければコンパイルエラー
  return fetch(`/api/users/${id}`).then(res => res.json());
};
```

### 7. 実際のアプリケーション統合

#### React との統合例

```typescript
// 関数型Reactパターン
const useFunctionalState = <S>(
  initialState: S,
  reducer: (state: S, action: any) => S
) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // 関数型ヘルパーを追加
  const update = useMemo(() => 
    updateIn(state), [state]);
  
  const setState = useCallback((newState: S) => 
    dispatch({ type: 'SET_STATE', payload: newState }), []);
  
  return [state, dispatch, { update, setState }] as const;
};

// TaskEither と React Suspense の統合
const useTaskEither = <L, R>(
  taskEither: TaskEither<L, R>,
  deps: React.DependencyList
): Either<L, R> | null => {
  const [result, setResult] = useState<Either<L, R> | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    taskEither.run().then(either => {
      if (!cancelled) {
        setResult(either);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, deps);
  
  return result;
};

// カスタムフック例
const useUserProfile = (userId: UserId) => {
  const taskEither = useMemo(() => 
    safeApiCall<User>(`/api/users/${userId}`)
      .flatMap(user => 
        safeApiCall<Profile>(`/api/users/${userId}/profile`)
          .map(profile => ({ user, profile }))
      ), [userId]);
  
  return useTaskEither(taskEither, [userId]);
};
```

## 次のステップ

このレベルでは、実際のプロジェクトで使える高度な技術を学習しました。練習問題（exercises.ts）で実践的なシナリオに挑戦し、解答例（solutions.ts）で実装パターンを確認してください。

最後に、examples/ ディレクトリの実用例を参考に、自分のプロジェクトで関数型プログラミングを活用してみましょう！