// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル4: 実践的パターン - 解答例（抜粋版）
// 実際のWebアプリケーション開発で使える高度な関数型プログラミング技術の解答例

// ===========================================
// 型定義セクション
// ===========================================

type Either<L, R> = Left<L> | Right<R>;
interface Left<L> { readonly _tag: 'Left'; readonly left: L; }
interface Right<R> { readonly _tag: 'Right'; readonly right: R; }

type ValidationError = { field: string; message: string; };

const left = <L, R = never>(value: L): Either<L, R> => ({ _tag: 'Left', left: value });
const right = <L = never, R = never>(value: R): Either<L, R> => ({ _tag: 'Right', right: value });
const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => either._tag === 'Left';
const isRight = <L, R>(either: Either<L, R>): either is Right<R> => either._tag === 'Right';

// TaskEither型の完全実装
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

  run(): Promise<Either<L, R>> {
    return this.task;
  }
}

// ===========================================
// 問題1: TaskEither クラスの実装 - 解答
// ===========================================

// 上記で定義したTaskEitherクラスを使用

// API型定義
type ApiError = { status: number; message: string; details?: any; };
type User = { id: number; name: string; email: string; };
type Profile = { bio: string; avatar: string; preferences: { theme: 'light' | 'dark'; language: string; }; };

// 安全なAPI呼び出し
const safeApiCall = <T>(url: string): TaskEither<ApiError, T> =>
  TaskEither.fromPromise(
    fetch(url).then(async res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json() as T;
    }),
    (error: any): ApiError => ({
      status: 500,
      message: error.message || 'Network error'
    })
  );

// 並行API呼び出し
const fetchUserWithProfile = (userId: number): TaskEither<ApiError, {user: User, profile: Profile}> => {
  const userTask = safeApiCall<User>(`/api/users/${userId}`);
  const profileTask = safeApiCall<Profile>(`/api/users/${userId}/profile`);

  return new TaskEither(
    Promise.all([userTask.run(), profileTask.run()]).then(([userResult, profileResult]) => {
      if (isLeft(userResult)) return userResult;
      if (isLeft(profileResult)) return profileResult;
      
      return right({
        user: userResult.right,
        profile: profileResult.right
      });
    })
  );
};

// ===========================================
// 問題2: 高度なメモ化システム - 解答
// ===========================================

type MemoizedWithExpiry<T extends (...args: any[]) => any> = T & {
  cache: Map<string, { value: ReturnType<T>; expiry: number }>;
  clear: () => void;
  clearExpired: () => void;
};

const memoizeWithExpiry = <T extends (...args: any[]) => any>(
  fn: T,
  ttlMs: number = 60000,
  keyGenerator?: (...args: Parameters<T>) => string
): MemoizedWithExpiry<T> => {
  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>();
  const generateKey = keyGenerator || ((...args) => JSON.stringify(args));

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = generateKey(...args);
    const now = Date.now();
    
    const cached = cache.get(key);
    if (cached && cached.expiry > now) {
      return cached.value;
    }
    
    const result = fn(...args);
    cache.set(key, { value: result, expiry: now + ttlMs });
    return result;
  }) as MemoizedWithExpiry<T>;

  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  memoized.clearExpired = () => {
    const now = Date.now();
    for (const [key, entry] of Array.from(cache.entries())) {
      if (entry.expiry <= now) {
        cache.delete(key);
      }
    }
  };

  return memoized;
};

// LRUキャッシュ実装
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private capacity: number;

  constructor(capacity: number) {
    this.cache = new Map();
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 最新として扱うため、一度削除して再追加
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 最も古いアイテム（最初のキー）を削除
      const firstKey = this.cache.keys().next().value as K;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ===========================================
// 問題3: 状態管理パターン - 解答
// ===========================================

type Action<T extends string, P = {}> = { type: T; payload: P; };

const createAction = <T extends string>(type: T) => 
  <P = {}>(payload: P): Action<T, P> => ({ type, payload });

const createSimpleAction = <T extends string>(type: T) => 
  (): Action<T, {}> => ({ type, payload: {} });

const matchAction = <S, A extends Action<string, any>>(
  matchers: {
    [K in A['type']]?: (state: S, action: Extract<A, { type: K }>) => S;
  }
) => (defaultHandler: (state: S, action: A) => S) => 
  (state: S, action: A): S => {
    const handler = matchers[action.type as keyof typeof matchers];
    return handler ? handler(state, action as any) : defaultHandler(state, action);
  };

// ショッピングカート実装
type CartItem = { id: string; name: string; price: number; quantity: number; };
type CartState = { items: CartItem[]; total: number; discountCode?: string; discountAmount: number; };

// 完全に型安全なAction定義
type AddItemAction = Action<'ADD_ITEM', CartItem>;
type RemoveItemAction = Action<'REMOVE_ITEM', { id: string }>;
type UpdateQuantityAction = Action<'UPDATE_QUANTITY', { id: string; quantity: number }>;
type ApplyDiscountAction = Action<'APPLY_DISCOUNT', { code: string; amount: number }>;
type ClearCartAction = Action<'CLEAR_CART', {}>;

type CartAction = 
  | AddItemAction
  | RemoveItemAction  
  | UpdateQuantityAction
  | ApplyDiscountAction
  | ClearCartAction;

// 型安全なAction作成関数
const addItem = (item: CartItem): AddItemAction => ({ type: 'ADD_ITEM', payload: item });
const removeItem = (id: string): RemoveItemAction => ({ type: 'REMOVE_ITEM', payload: { id } });
const updateQuantity = (id: string, quantity: number): UpdateQuantityAction => 
  ({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
const applyDiscount = (code: string, amount: number): ApplyDiscountAction => 
  ({ type: 'APPLY_DISCOUNT', payload: { code, amount } });
const clearCart = (): ClearCartAction => ({ type: 'CLEAR_CART', payload: {} });

const calculateTotal = (items: CartItem[], discountAmount: number = 0): number => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return Math.max(0, subtotal - discountAmount);
};

const cartReducer = matchAction<CartState, CartAction>({
  ADD_ITEM: (state, action) => {
    // 型安全: action.payloadは自動的にCartItem型として推論される
    const payload = action.payload;
    const existingItem = state.items.find(item => item.id === payload.id);
    let newItems: CartItem[];
    
    if (existingItem) {
      newItems = state.items.map(item => 
        item.id === payload.id 
          ? { ...item, quantity: item.quantity + payload.quantity }
          : item
      );
    } else {
      newItems = [...state.items, payload];
    }
    
    return {
      ...state,
      items: newItems,
      total: calculateTotal(newItems, state.discountAmount)
    };
  },
  
  REMOVE_ITEM: (state, action) => {
    // 型安全: action.payloadは自動的に{ id: string }型として推論される
    const payload = action.payload;
    const newItems = state.items.filter(item => item.id !== payload.id);
    return {
      ...state,
      items: newItems,
      total: calculateTotal(newItems, state.discountAmount)
    };
  },
  
  UPDATE_QUANTITY: (state, action) => {
    // 型安全: action.payloadは自動的に{ id: string; quantity: number }型として推論される
    const payload = action.payload;
    const newItems = state.items.map(item => 
      item.id === payload.id 
        ? { ...item, quantity: payload.quantity }
        : item
    ).filter(item => item.quantity > 0);
    
    return {
      ...state,
      items: newItems,
      total: calculateTotal(newItems, state.discountAmount)
    };
  },
  
  APPLY_DISCOUNT: (state, action) => {
    // 型安全: action.payloadは自動的に{ code: string; amount: number }型として推論される
    const payload = action.payload;
    const newState = {
      ...state,
      discountCode: payload.code,
      discountAmount: payload.amount
    };
    
    return {
      ...newState,
      total: calculateTotal(state.items, payload.amount)
    };
  },
  
  CLEAR_CART: () => ({
    items: [],
    total: 0,
    discountAmount: 0
  })
})((state) => state);

// ===========================================
// 問題5: バリデーションスキーマシステム - 解答
// ===========================================

type ValidationResult<T> = Either<ValidationError[], T>;

interface Validator<T> {
  validate(value: unknown): ValidationResult<T>;
}

// 基本バリデータ
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

// 配列バリデータ
const array = <T>(itemValidator: Validator<T>): Validator<T[]> => ({
  validate: (value: unknown): ValidationResult<T[]> => {
    if (!Array.isArray(value)) {
      return left([{ field: 'root', message: 'Expected array' }]);
    }
    
    const errors: ValidationError[] = [];
    const results: T[] = [];
    
    value.forEach((item, index) => {
      const result = itemValidator.validate(item);
      if (isLeft(result)) {
        errors.push(...result.left.map(err => ({
          ...err,
          field: `[${index}].${err.field}`
        })));
      } else {
        results.push(result.right);
      }
    });
    
    return errors.length > 0 ? left(errors) : right(results);
  }
});

// オブジェクトバリデータ
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
        const fieldErrors = fieldResult.left as any[];
        errors.push(...fieldErrors.map((err: any) => ({
          ...err,
          field: key
        })));
      } else {
        (result as any)[key] = fieldResult.right;
      }
    }
    
    return errors.length > 0 ? left(errors) : right(result as T);
  }
});

// バリデータコンビネータ
const minLength = (min: number) => (validator: Validator<string>): Validator<string> => ({
  validate: (value: unknown): ValidationResult<string> => {
    const stringResult = validator.validate(value);
    if (isLeft(stringResult)) return stringResult;
    
    return stringResult.right.length >= min
      ? right(stringResult.right)
      : left([{ field: 'root', message: `Minimum length is ${min}` }]);
  }
});

const maxLength = (max: number) => (validator: Validator<string>): Validator<string> => ({
  validate: (value: unknown): ValidationResult<string> => {
    const stringResult = validator.validate(value);
    if (isLeft(stringResult)) return stringResult;
    
    return stringResult.right.length <= max
      ? right(stringResult.right)
      : left([{ field: 'root', message: `Maximum length is ${max}` }]);
  }
});

const pattern = (regex: RegExp, message: string) => (validator: Validator<string>): Validator<string> => ({
  validate: (value: unknown): ValidationResult<string> => {
    const stringResult = validator.validate(value);
    if (isLeft(stringResult)) return stringResult;
    
    return regex.test(stringResult.right)
      ? right(stringResult.right)
      : left([{ field: 'root', message }]);
  }
});

const email = (validator: Validator<string>): Validator<string> => 
  pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')(validator);

const url = (validator: Validator<string>): Validator<string> => 
  pattern(/^https?:\/\/.+/, 'Invalid URL format')(validator);

const min = (minimum: number) => (validator: Validator<number>): Validator<number> => ({
  validate: (value: unknown): ValidationResult<number> => {
    const numberResult = validator.validate(value);
    if (isLeft(numberResult)) return numberResult;
    
    return numberResult.right >= minimum
      ? right(numberResult.right)
      : left([{ field: 'root', message: `Minimum value is ${minimum}` }]);
  }
});

const max = (maximum: number) => (validator: Validator<number>): Validator<number> => ({
  validate: (value: unknown): ValidationResult<number> => {
    const numberResult = validator.validate(value);
    if (isLeft(numberResult)) return numberResult;
    
    return numberResult.right <= maximum
      ? right(numberResult.right)
      : left([{ field: 'root', message: `Maximum value is ${maximum}` }]);
  }
});

// パイプライン風のバリデーション
const pipe = <T>(...validators: Array<(v: Validator<T>) => Validator<T>>) => 
  (baseValidator: Validator<T>): Validator<T> => 
    validators.reduce((acc, validator) => validator(acc), baseValidator);

// 使用例
const userValidator = object({
  name: pipe(minLength(2), maxLength(50))(string),
  email: email(string),
  age: pipe(min(0), max(150))(number),
  isActive: boolean,
  tags: array(string)
});

type ValidUser = {
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  tags: string[];
};

const validateUser = (data: unknown): ValidationResult<ValidUser> => 
  userValidator.validate(data);

// ===========================================
// 問題6: エラーハンドリングシステム - 解答
// ===========================================

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
  readonly stack?: string;
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
  ...(details && { details }),
  ...(cause && { cause }),
  timestamp: new Date(),
  ...(cause?.stack || new Error().stack) && { stack: cause?.stack || new Error().stack }
});

// 事前定義されたエラータイプ
const ErrorTypes = {
  NETWORK_ERROR: (message: string, cause?: Error) => 
    createError('NETWORK_ERROR', message, 'network', 'medium', undefined, cause),
  
  VALIDATION_ERROR: (field: string, message: string) => 
    createError('VALIDATION_ERROR', message, 'validation', 'low', { field }),
  
  UNAUTHORIZED: (resource: string) => 
    createError('UNAUTHORIZED', `Access denied to ${resource}`, 'authorization', 'high', { resource }),
  
  NOT_FOUND: (resource: string, id: string) => 
    createError('NOT_FOUND', `${resource} not found`, 'business', 'medium', { resource, id }),
  
  SYSTEM_ERROR: (message: string, cause?: Error) => 
    createError('SYSTEM_ERROR', message, 'system', 'critical', undefined, cause)
};

// エラーロガー
interface ErrorLogger {
  log(error: AppError): void;
}

const createConsoleLogger = (): ErrorLogger => ({
  log: (error: AppError) => {
    const logLevel = error.severity === 'critical' ? 'error' : 
                     error.severity === 'high' ? 'warn' : 'info';
    
    console[logLevel](`[${error.code}] ${error.message}`, {
      category: error.category,
      severity: error.severity,
      timestamp: error.timestamp,
      details: error.details,
      cause: error.cause?.message
    });
  }
});

// エラーハンドラー
type ErrorHandler<T> = (error: AppError) => TaskEither<AppError, T>;

const createErrorHandler = <T>(
  handlers: Partial<Record<ErrorCategory, ErrorHandler<T>>>,
  defaultHandler: ErrorHandler<T>
) => (error: AppError): TaskEither<AppError, T> => {
  const handler = handlers[error.category] || defaultHandler;
  return handler(error);
};

// リトライ機能
const withRetry = <T>(
  operation: () => TaskEither<AppError, T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: AppError) => boolean;
  } = {}
): TaskEither<AppError, T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    retryCondition = (error) => error.category === 'network' && error.severity !== 'critical'
  } = options;
  
  const attempt = (retriesLeft: number, currentDelay: number): TaskEither<AppError, T> => {
    return new TaskEither(
      operation().run().then(result => {
        if (isRight(result) || retriesLeft === 0) {
          return result;
        }
        
        const error = result.left;
        if (retryCondition(error)) {
          return new Promise(resolve => {
            setTimeout(() => {
              attempt(retriesLeft - 1, currentDelay * backoffMultiplier).run().then(resolve);
            }, currentDelay);
          });
        }
        
        return result;
      })
    );
  };
  
  return attempt(maxRetries, delay);
};

// サーキットブレーカーパターン
class CircuitBreaker<T> {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private operation: () => TaskEither<AppError, T>,
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  execute(): TaskEither<AppError, T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        return TaskEither.left(ErrorTypes.SYSTEM_ERROR('Circuit breaker is OPEN'));
      }
    }
    
    return new TaskEither(
      this.operation().run().then(result => {
        if (isRight(result)) {
          this.onSuccess();
        } else {
          this.onFailure();
        }
        return result;
      })
    );
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// エラー集約ユーティリティ
const collectErrors = <T>(
  operations: Array<() => TaskEither<AppError, T>>
): TaskEither<AppError[], T[]> => {
  return new TaskEither(
    Promise.all(operations.map(op => op().run())).then(results => {
      const errors: AppError[] = [];
      const successes: T[] = [];
      
      results.forEach(result => {
        if (isLeft(result)) {
          errors.push(result.left);
        } else {
          successes.push(result.right);
        }
      });
      
      return errors.length > 0 ? left(errors) : right(successes);
    })
  );
};

// ===========================================
// 問題7: 非同期パイプライン - 解答
// ===========================================

// 並列処理ユーティリティ
const parallel = <T>(
  tasks: Array<TaskEither<AppError, T>>
): TaskEither<AppError[], T[]> => {
  return new TaskEither(
    Promise.all(tasks.map(task => task.run())).then(results => {
      const errors: AppError[] = [];
      const successes: T[] = [];
      
      results.forEach(result => {
        if (isLeft(result)) {
          errors.push(result.left);
        } else {
          successes.push(result.right);
        }
      });
      
      return errors.length > 0 ? left(errors) : right(successes);
    })
  );
};

// シーケンシャル処理
const sequence = <T>(
  tasks: Array<() => TaskEither<AppError, T>>
): TaskEither<AppError, T[]> => {
  return tasks.reduce(
    (acc, task) => acc.flatMap(results => 
      task().map(result => [...results, result])
    ),
    TaskEither.of<AppError, T[]>([])
  );
};

// タイムアウト付き処理
const withTimeout = <T>(
  task: TaskEither<AppError, T>,
  timeoutMs: number
): TaskEither<AppError, T> => {
  return new TaskEither(
    Promise.race([
      task.run(),
      new Promise<Either<AppError, T>>(resolve => 
        setTimeout(() => 
          resolve(left(ErrorTypes.SYSTEM_ERROR('Operation timed out'))),
          timeoutMs
        )
      )
    ])
  );
};

// バッチ処理
const batch = <T, U>(
  items: T[],
  processor: (item: T) => TaskEither<AppError, U>,
  batchSize: number = 10
): TaskEither<AppError[], U[]> => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  return batches.reduce(
    (acc, batch) => acc.flatMap(results => {
      const batchTasks = batch.map(processor);
      const parallelResult = parallel(batchTasks);
      return new TaskEither(
        parallelResult.run().then(batchResults => {
          if (isRight(batchResults)) {
            return right([...results, ...batchResults.right]);
          } else {
            return right(results);
          }
        })
      );
    }),
    TaskEither.of<AppError[], U[]>([])
  );
};

// ===========================================
// 問題8: パフォーマンス最適化 - 解答
// ===========================================

// Lazy評価
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

  force(): T {
    return this.value;
  }

  isComputed(): boolean {
    return this._computed;
  }
}

// メモ化拡張版
class AdvancedMemoizer<Args extends any[], Return> {
  private cache = new Map<string, { value: Return; expiry: number; hitCount: number }>();
  private maxSize: number;
  private ttl: number;
  
  constructor(
    private fn: (...args: Args) => Return,
    options: {
      maxSize?: number;
      ttl?: number;
      keyGenerator?: (...args: Args) => string;
    } = {}
  ) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 300000; // 5分
    this.keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));
  }
  
  private keyGenerator: (...args: Args) => string;
  
  memoized = (...args: Args): Return => {
    const key = this.keyGenerator(...args);
    const now = Date.now();
    
    const cached = this.cache.get(key);
    if (cached && cached.expiry > now) {
      cached.hitCount++;
      return cached.value;
    }
    
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    const result = this.fn(...args);
    this.cache.set(key, {
      value: result,
      expiry: now + this.ttl,
      hitCount: 1
    });
    
    return result;
  };
  
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let minHitCount = Infinity;
    
    // 型安全なIterator処理 - downlevelIteration不要の実装
    const entriesIterator = this.cache.entries();
    let result = entriesIterator.next();
    
    while (!result.done) {
      const [key, entry] = result.value;
      if (entry.hitCount < minHitCount) {
        minHitCount = entry.hitCount;
        leastUsedKey = key;
      }
      result = entriesIterator.next();
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  stats(): { size: number; hitRatio: number } {
    // 型安全なIterator処理でtotalHitsを計算
    let totalHits = 0;
    let entryCount = 0;
    
    const valuesIterator = this.cache.values();
    let result = valuesIterator.next();
    
    while (!result.done) {
      totalHits += result.value.hitCount;
      entryCount++;
      result = valuesIterator.next();
    }
    
    const totalCalls = entryCount + totalHits;
    
    return {
      size: this.cache.size,
      hitRatio: totalCalls > 0 ? totalHits / totalCalls : 0
    };
  }
}

// ストリーム処理
class Stream<T> {
  constructor(private source: () => Generator<T>) {}
  
  static from<T>(items: T[]): Stream<T> {
    return new Stream(function* () {
      for (const item of items) {
        yield item;
      }
    });
  }
  
  static range(start: number, end: number): Stream<number> {
    return new Stream(function* () {
      for (let i = start; i < end; i++) {
        yield i;
      }
    });
  }
  
  map<U>(fn: (value: T) => U): Stream<U> {
    const source = this.source;
    return new Stream(function* () {
      // 型安全なIterator処理 - for...ofの代わりに手動Iterator使用
      const iterator = source();
      let result = iterator.next();
      
      while (!result.done) {
        yield fn(result.value);
        result = iterator.next();
      }
    });
  }
  
  filter(predicate: (value: T) => boolean): Stream<T> {
    const source = this.source;
    return new Stream(function* () {
      // 型安全なIterator処理
      const iterator = source();
      let result = iterator.next();
      
      while (!result.done) {
        if (predicate(result.value)) {
          yield result.value;
        }
        result = iterator.next();
      }
    });
  }
  
  take(count: number): Stream<T> {
    const source = this.source;
    return new Stream(function* () {
      let taken = 0;
      // 型安全なIterator処理
      const iterator = source();
      let result = iterator.next();
      
      while (!result.done && taken < count) {
        yield result.value;
        taken++;
        result = iterator.next();
      }
    });
  }
  
  toArray(): T[] {
    // 型安全なIterator処理で配列を構築
    const result: T[] = [];
    const iterator = this.source();
    let iterResult = iterator.next();
    
    while (!iterResult.done) {
      result.push(iterResult.value);
      iterResult = iterator.next();
    }
    
    return result;
  }
  
  reduce<U>(fn: (acc: U, value: T) => U, initial: U): U {
    let acc = initial;
    // 型安全なIterator処理
    const iterator = this.source();
    let result = iterator.next();
    
    while (!result.done) {
      acc = fn(acc, result.value);
      result = iterator.next();
    }
    
    return acc;
  }
}

// パフォーマンスモニタリング
const measurePerformance = <T>(
  operation: () => T,
  label: string
): T => {
  const start = performance.now();
  const result = operation();
  const end = performance.now();
  
  console.log(`[${label}] Execution time: ${(end - start).toFixed(2)}ms`);
  return result;
};

const measureAsyncPerformance = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  
  console.log(`[${label}] Execution time: ${(end - start).toFixed(2)}ms`);
  return result;
};

// ===========================================
// テスト実行関数
// ===========================================

export const runLevel4Tests = () => {
  console.log('=== レベル4 練習問題のテスト実行 ===');
  
  // TaskEither のテスト
  console.log('\n--- TaskEither のテスト ---');
  const testTaskEither = TaskEither.of(42).map(x => x * 2);
  testTaskEither.run().then(result => {
    console.log('TaskEither result:', result); // Right(84)
  });

  // メモ化のテスト
  console.log('\n--- メモ化のテスト ---');
  const expensiveFunction = (x: number): number => {
    console.log(`Computing ${x}...`);
    return x * x;
  };
  
  const memoized = memoizeWithExpiry(expensiveFunction, 5000);
  console.log('First call:', memoized(5)); // 計算実行
  console.log('Second call:', memoized(5)); // キャッシュから取得

  // LRUキャッシュのテスト
  console.log('\n--- LRUキャッシュのテスト ---');
  const lru = new LRUCache<string, number>(3);
  lru.set('a', 1);
  lru.set('b', 2);
  lru.set('c', 3);
  lru.set('d', 4); // 'a' が削除される
  console.log('Has a:', lru.has('a')); // false
  console.log('Has d:', lru.has('d')); // true

  // バリデーションのテスト
  console.log('\n--- バリデーションのテスト ---');
  const nameValidator = minLength(2)(string);
  const emailValidator = email(string);
  
  console.log('Valid name:', nameValidator.validate('太郎'));
  console.log('Invalid name:', nameValidator.validate('太'));
  console.log('Valid email:', emailValidator.validate('test@example.com'));
  console.log('Invalid email:', emailValidator.validate('invalid-email'));

  // Lazy評価のテスト
  console.log('\n--- Lazy評価のテスト ---');
  const lazyComputation = new Lazy(() => {
    console.log('Expensive computation...');
    return 42 * 42;
  });
  
  console.log('Is computed?', lazyComputation.isComputed()); // false
  console.log('Value:', lazyComputation.value); // 計算実行
  console.log('Is computed?', lazyComputation.isComputed()); // true

  // エラーハンドリングのテスト
  console.log('\n--- エラーハンドリングのテスト ---');
  const networkError = ErrorTypes.NETWORK_ERROR('Connection failed');
  const validationError = ErrorTypes.VALIDATION_ERROR('email', 'Invalid format');
  console.log('Network error:', networkError);
  console.log('Validation error:', validationError);
  
  // サーキットブレーカーのテスト
  console.log('\n--- サーキットブレーカーのテスト ---');
  let failCount = 0;
  const flakyOperation = () => {
    failCount++;
    return failCount > 3 
      ? TaskEither.of<AppError, string>('Success!') 
      : TaskEither.left<AppError, string>(ErrorTypes.NETWORK_ERROR('Simulated failure'));
  };
  
  const circuitBreaker = new CircuitBreaker(flakyOperation, 2, 1000);
  console.log('Circuit breaker created');
  
  // ストリームのテスト
  console.log('\n--- ストリームのテスト ---');
  const streamResult = Stream.range(1, 10)
    .filter(n => n % 2 === 0)
    .map(n => n * 2)
    .take(3)
    .toArray();
  console.log('Stream result:', streamResult); // [4, 8, 12]
  
  // 高度なメモ化のテスト
  console.log('\n--- 高度なメモ化のテスト ---');
  const fibonacci = (n: number): number => {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  };
  
  const memoizer = new AdvancedMemoizer(fibonacci, { maxSize: 100, ttl: 10000 });
  
  console.log('First call:', measurePerformance(() => memoizer.memoized(35), 'Fibonacci(35)'));
  console.log('Second call:', measurePerformance(() => memoizer.memoized(35), 'Fibonacci(35) cached'));
  console.log('Cache stats:', memoizer.stats());

  console.log('\n=== すべてのテストが完了しました ===');
};