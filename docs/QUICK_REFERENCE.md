# クイックリファレンス

TypeScript関数型プログラミングでよく使う関数とパターンの早見表です。

## 📋 目次

1. [基本的な関数](#基本的な関数)
2. [関数合成](#関数合成)
3. [Option型](#option型)
4. [Either型](#either型)
5. [TaskEither型](#taskeither型)
6. [よく使うパターン](#よく使うパターン)

---

## 基本的な関数

### 恒等関数・定数関数
```typescript
// 恒等関数：値をそのまま返す
const identity = <T>(x: T): T => x;

// 定数関数：常に同じ値を返す
const constant = <T>(value: T) => (): T => value;
const always = constant; // エイリアス

// 使用例
[1, 2, 3].map(identity); // [1, 2, 3]
[1, 2, 3].map(always(0)); // [0, 0, 0]
```

### カリー化
```typescript
// 2引数のカリー化
const curry2 = <A, B, C>(fn: (a: A, b: B) => C) =>
  (a: A) => (b: B): C => fn(a, b);

// 3引数のカリー化
const curry3 = <A, B, C, D>(fn: (a: A, b: B, c: C) => D) =>
  (a: A) => (b: B) => (c: C): D => fn(a, b, c);

// 使用例
const add = (a: number, b: number): number => a + b;
const curriedAdd = curry2(add);
const add5 = curriedAdd(5);
console.log(add5(3)); // 8
```

### 部分適用
```typescript
// 左側部分適用
const partial = <A extends readonly unknown[], B, C>(
  fn: (...args: [...A, B]) => C,
  ...partialArgs: A
) => (lastArg: B): C => fn(...partialArgs, lastArg);

// 使用例
const multiply = (a: number, b: number, c: number): number => a * b * c;
const multiplyBy2 = partial(multiply, 2);
const multiplyBy2And3 = partial(multiply, 2, 3);

console.log(multiplyBy2(3, 4)); // 24
console.log(multiplyBy2And3(4)); // 24
```

---

## 関数合成

### compose（右から左）
```typescript
const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C => f(g(a));

// 複数関数の合成
const compose3 = <A, B, C, D>(
  f: (c: C) => D,
  g: (b: B) => C,
  h: (a: A) => B
) => (a: A): D => f(g(h(a)));

// 使用例
const add1 = (x: number) => x + 1;
const multiply2 = (x: number) => x * 2;
const processNumber = compose(multiply2, add1);
console.log(processNumber(5)); // (5 + 1) * 2 = 12
```

### pipe（左から右）
```typescript
const pipe = <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

// 型を変更可能なpipe
const pipeFlexible = <A>(value: A) => ({
  pipe: <B>(fn: (value: A) => B) => pipeFlexible(fn(value)),
  value: () => value
});

// 使用例
const processText = pipe(
  (text: string) => text.trim(),
  (text: string) => text.toLowerCase(),
  (text: string) => text + '!'
);
console.log(processText('  HELLO  ')); // 'hello!'
```

---

## Option型

### 基本定義
```typescript
type Option<T> = Some<T> | None;

interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

interface None {
  readonly _tag: 'None';
}

// コンストラクタ
const some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const none: Option<never> = { _tag: 'None' };

// 型ガード
const isSome = <T>(option: Option<T>): option is Some<T> => option._tag === 'Some';
const isNone = <T>(option: Option<T>): option is None => option._tag === 'None';
```

### Option操作関数
```typescript
// map: 値が存在する場合のみ変換
const mapOption = <T, U>(fn: (value: T) => U) =>
  (option: Option<T>): Option<U> =>
    isSome(option) ? some(fn(option.value)) : none;

// flatMap: ネストしたOptionを平坦化
const flatMapOption = <T, U>(fn: (value: T) => Option<U>) =>
  (option: Option<T>): Option<U> =>
    isSome(option) ? fn(option.value) : none;

// filter: 条件を満たす場合のみ値を保持
const filterOption = <T>(predicate: (value: T) => boolean) =>
  (option: Option<T>): Option<T> =>
    isSome(option) && predicate(option.value) ? option : none;

// getOrElse: デフォルト値の取得
const getOrElse = <T>(defaultValue: T) =>
  (option: Option<T>): T =>
    isSome(option) ? option.value : defaultValue;

// fold: SomeとNoneの両方のケースを処理
const foldOption = <T, U>(
  onNone: () => U,
  onSome: (value: T) => U
) => (option: Option<T>): U =>
  isSome(option) ? onSome(option.value) : onNone();
```

### Option便利関数
```typescript
// 安全な配列アクセス
const safeGet = <T>(array: T[], index: number): Option<T> =>
  index >= 0 && index < array.length ? some(array[index]) : none;

// 安全なプロパティアクセス
const safeProp = <T, K extends keyof T>(key: K) =>
  (obj: T): Option<T[K]> =>
    obj[key] !== undefined && obj[key] !== null ? some(obj[key]) : none;

// 安全なJSONパース
const safeParseJSON = (jsonString: string): Option<any> => {
  try {
    return some(JSON.parse(jsonString));
  } catch {
    return none;
  }
};

// Optionの配列から値のある要素のみ取得
const catOptions = <T>(options: Option<T>[]): T[] =>
  options.filter(isSome).map(option => option.value);
```

---

## Either型

### 基本定義
```typescript
type Either<L, R> = Left<L> | Right<R>;

interface Left<L> {
  readonly _tag: 'Left';
  readonly left: L;
}

interface Right<R> {
  readonly _tag: 'Right';
  readonly right: R;
}

// コンストラクタ
const left = <L, R = never>(value: L): Either<L, R> => ({ _tag: 'Left', left: value });
const right = <L = never, R = never>(value: R): Either<L, R> => ({ _tag: 'Right', right: value });

// 型ガード
const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => either._tag === 'Left';
const isRight = <L, R>(either: Either<L, R>): either is Right<R> => either._tag === 'Right';
```

### Either操作関数
```typescript
// map: Right値にのみ変換を適用
const mapEither = <L, R, U>(fn: (value: R) => U) =>
  (either: Either<L, R>): Either<L, U> =>
    isRight(either) ? right(fn(either.right)) : either;

// mapLeft: Left値にのみ変換を適用
const mapLeft = <L, R, U>(fn: (value: L) => U) =>
  (either: Either<L, R>): Either<U, R> =>
    isLeft(either) ? left(fn(either.left)) : either;

// flatMap: ネストしたEitherを平坦化
const flatMapEither = <L, R, U>(fn: (value: R) => Either<L, U>) =>
  (either: Either<L, R>): Either<L, U> =>
    isRight(either) ? fn(either.right) : either;

// fold: Left、Right両方のケースを処理
const foldEither = <L, R, U>(
  onLeft: (left: L) => U,
  onRight: (right: R) => U
) => (either: Either<L, R>): U =>
  isLeft(either) ? onLeft(either.left) : onRight(either.right);

// swap: LeftとRightを入れ替え
const swapEither = <L, R>(either: Either<L, R>): Either<R, L> =>
  isLeft(either) ? right(either.left) : left(either.right);
```

### Either便利関数
```typescript
// try-catch のEither版
const tryCatch = <A>(fn: () => A): Either<Error, A> => {
  try {
    return right(fn());
  } catch (error) {
    return left(error instanceof Error ? error : new Error(String(error)));
  }
};

// OptionからEitherへ変換
const optionToEither = <L, R>(onNone: L) =>
  (option: Option<R>): Either<L, R> =>
    isSome(option) ? right(option.value) : left(onNone);

// EitherからOptionへ変換
const eitherToOption = <L, R>(either: Either<L, R>): Option<R> =>
  isRight(either) ? some(either.right) : none;

// 複数のEitherを結合（すべて成功した場合のみ成功）
const sequenceEither = <L, R>(eithers: Either<L, R>[]): Either<L, R[]> => {
  const rights: R[] = [];
  for (const either of eithers) {
    if (isLeft(either)) {
      return either;
    }
    rights.push(either.right);
  }
  return right(rights);
};
```

---

## TaskEither型

### 基本定義
```typescript
class TaskEither<L, R> {
  constructor(private readonly task: Promise<Either<L, R>>) {}

  // 基本コンストラクタ
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

  // 実行
  run(): Promise<Either<L, R>> {
    return this.task;
  }
}
```

### TaskEither操作メソッド
```typescript
class TaskEither<L, R> {
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

  // mapLeft: エラー値の変換
  mapLeft<U>(fn: (error: L) => U): TaskEither<U, R> {
    return new TaskEither(
      this.task.then(either =>
        isLeft(either) ? left(fn(either.left)) : either
      )
    );
  }

  // fold: 成功・失敗両方のケースを処理
  fold<U>(onLeft: (error: L) => U, onRight: (value: R) => U): Promise<U> {
    return this.task.then(either =>
      isLeft(either) ? onLeft(either.left) : onRight(either.right)
    );
  }
}
```

### TaskEither便利関数
```typescript
// 複数のTaskEitherを並列実行
const parallel = <L, R>(tasks: TaskEither<L, R>[]): TaskEither<L, R[]> => {
  return new TaskEither(
    Promise.all(tasks.map(task => task.run()))
      .then(results => sequenceEither(results))
  );
};

// 順次実行
const sequence = <L, R>(tasks: TaskEither<L, R>[]): TaskEither<L, R[]> => {
  return tasks.reduce(
    (acc, task) => acc.flatMap(results =>
      task.map(result => [...results, result])
    ),
    TaskEither.of<L, R[]>([])
  );
};

// タイムアウト付きTaskEither
const withTimeout = <L, R>(
  task: TaskEither<L, R>,
  timeoutMs: number,
  onTimeout: L
): TaskEither<L, R> => {
  const timeoutPromise = new Promise<Either<L, R>>(resolve =>
    setTimeout(() => resolve(left(onTimeout)), timeoutMs)
  );

  return new TaskEither(
    Promise.race([task.run(), timeoutPromise])
  );
};
```

---

## よく使うパターン

### バリデーション
```typescript
type ValidationError = {
  field: string;
  message: string;
};

// 個別バリデーション関数
const validateEmail = (email: string): Either<ValidationError, string> =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? right(email)
    : left({ field: 'email', message: '有効なメールアドレスを入力してください' });

const validateAge = (age: number): Either<ValidationError, number> =>
  age >= 0 && age <= 150
    ? right(age)
    : left({ field: 'age', message: '年齢は0-150の範囲で入力してください' });

// 複数バリデーションの組み合わせ
const validateUser = (data: { email: string; age: number }) =>
  sequenceEither([
    validateEmail(data.email),
    validateAge(data.age)
  ]).map(([email, age]) => ({ email, age }));
```

### HTTPクライアント
```typescript
type ApiError = {
  type: 'NetworkError' | 'ParseError' | 'ServerError';
  message: string;
  status?: number;
};

const apiCall = <T>(url: string): TaskEither<ApiError, T> =>
  TaskEither.fromPromise(
    fetch(url).then(async response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }),
    (error): ApiError => ({
      type: 'NetworkError',
      message: error.message
    })
  );

// GET リクエスト
const get = <T>(url: string) => apiCall<T>(url);

// POST リクエスト
const post = <T>(url: string, data: any): TaskEither<ApiError, T> =>
  TaskEither.fromPromise(
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(response => response.json()),
    (error): ApiError => ({
      type: 'NetworkError',
      message: error.message
    })
  );
```

### メモ化
```typescript
// シンプルなメモ化
const memoize = <Args extends readonly unknown[], Return>(
  fn: (...args: Args) => Return
): ((...args: Args) => Return) => {
  const cache = new Map<string, Return>();
  
  return (...args: Args): Return => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// LRUキャッシュ付きメモ化
const memoizeWithLRU = <Args extends readonly unknown[], Return>(
  fn: (...args: Args) => Return,
  maxSize: number = 100
) => {
  const cache = new Map<string, Return>();
  
  return (...args: Args): Return => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // LRU: 使用されたアイテムを最後に移動
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    
    if (cache.size >= maxSize) {
      // 最も古いアイテムを削除
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
```

### Reducer パターン
```typescript
// 汎用Reducer型
type Reducer<State, Action> = (state: State, action: Action) => State;

// 基本的なストア実装
const createStore = <State, Action>(
  reducer: Reducer<State, Action>,
  initialState: State
) => {
  let state = initialState;
  const listeners: Array<(state: State) => void> = [];

  return {
    getState: () => state,
    dispatch: (action: Action) => {
      const newState = reducer(state, action);
      if (newState !== state) {
        state = newState;
        listeners.forEach(listener => listener(state));
      }
    },
    subscribe: (listener: (state: State) => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    }
  };
};

// 使用例
type CounterState = { count: number };
type CounterAction = { type: 'INCREMENT' } | { type: 'DECREMENT' } | { type: 'RESET' };

const counterReducer: Reducer<CounterState, CounterAction> = (state, action) => {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 };
    case 'DECREMENT': return { count: state.count - 1 };
    case 'RESET': return { count: 0 };
    default: return state;
  }
};

const store = createStore(counterReducer, { count: 0 });
```

---

## 💡 使用例とベストプラクティス

### 1. エラーハンドリングのベストプラクティス
```typescript
// ❌ 例外ベース
try {
  const user = await fetchUser(id);
  const profile = await fetchProfile(user.profileId);
  return processUserProfile(user, profile);
} catch (error) {
  console.error(error);
  throw error;
}

// ✅ 関数型アプローチ
const fetchUserWithProfile = (id: number): TaskEither<ApiError, UserWithProfile> =>
  fetchUser(id)
    .flatMap(user =>
      fetchProfile(user.profileId)
        .map(profile => ({ ...user, profile }))
    );

// 使用時
const result = await fetchUserWithProfile(123).run();
if (isLeft(result)) {
  console.error('エラー:', result.left.message);
} else {
  console.log('成功:', result.right);
}
```

### 2. データ変換パイプライン
```typescript
const processApiResponse = (rawData: unknown) =>
  pipe(
    safeParseJSON(JSON.stringify(rawData)),
    flatMapOption(safeProp('data')),
    flatMapOption(safeProp('users')),
    mapOption((users: unknown[]) => users.map(parseUser)),
    getOrElse([] as User[])
  );
```

### 3. 条件分岐の関数型表現
```typescript
// ❌ 命令的
function getDiscountRate(user: User): number {
  if (user.isPremium) {
    if (user.yearsOfMembership >= 5) {
      return 0.2;
    } else {
      return 0.1;
    }
  } else {
    return 0;
  }
}

// ✅ 関数型
const getDiscountRate = (user: User): number =>
  pipe(
    user,
    foldOption(
      () => 0,
      (u) => u.isPremium
        ? u.yearsOfMembership >= 5 ? 0.2 : 0.1
        : 0
    )
  );
```

このクイックリファレンスを手元に置いて、関数型プログラミングを実践してください！