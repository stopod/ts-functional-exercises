# レベル3: 型を活用した安全な処理

## 目標
このレベルでは、TypeScriptの型システムを活用して、より安全で表現力豊かな関数型プログラミングを学びます。特に **Option/Maybe型** と **Either型** を使った堅牢なエラーハンドリングの方法を習得します。

## 学習内容

### 1. Option/Maybe型による安全なnull処理

**Option/Maybe型とは？**
`null` や `undefined` を安全に扱うための型です。値が存在する場合（Some）と存在しない場合（None）を明示的に表現します。

#### 基本的なOption型の実装

```typescript
// Option型の定義
type Option<T> = Some<T> | None;

interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

interface None {
  readonly _tag: 'None';
}

// コンストラクタ関数
const some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const none: Option<never> = { _tag: 'None' };

// 型ガード
const isSome = <T>(option: Option<T>): option is Some<T> => 
  option._tag === 'Some';

const isNone = <T>(option: Option<T>): option is None => 
  option._tag === 'None';
```

#### Optionの基本操作

```typescript
// map: 値が存在する場合のみ変換を適用
const mapOption = <T, U>(fn: (value: T) => U) => 
  (option: Option<T>): Option<U> => 
    isSome(option) ? some(fn(option.value)) : none;

// flatMap (chain): ネストしたOptionを平坦化
const flatMapOption = <T, U>(fn: (value: T) => Option<U>) => 
  (option: Option<T>): Option<U> => 
    isSome(option) ? fn(option.value) : none;

// getOrElse: 値が存在しない場合のデフォルト値
const getOrElse = <T>(defaultValue: T) => 
  (option: Option<T>): T => 
    isSome(option) ? option.value : defaultValue;

// 使用例
const divide = (a: number, b: number): Option<number> => 
  b === 0 ? none : some(a / b);

const result = divide(10, 2)
  |> mapOption(x => x * 2)  // 値が存在すれば2倍
  |> getOrElse(0);          // 存在しなければ0

console.log(result); // 10
```

#### 実用的なOption型の活用

```typescript
// 配列から安全に要素を取得
const safeGet = <T>(array: T[], index: number): Option<T> => 
  index >= 0 && index < array.length ? some(array[index]) : none;

// オブジェクトから安全にプロパティを取得
const safeProp = <T, K extends keyof T>(key: K) => 
  (obj: T): Option<T[K]> => 
    obj[key] !== undefined && obj[key] !== null 
      ? some(obj[key]) 
      : none;

// JSON文字列を安全にパース
const safeParseJSON = (jsonString: string): Option<any> => {
  try {
    return some(JSON.parse(jsonString));
  } catch {
    return none;
  }
};

// チェーンして使用
const getUserName = (jsonString: string): string => 
  safeParseJSON(jsonString)
    |> flatMapOption(safeProp('user'))
    |> flatMapOption(safeProp('name'))
    |> getOrElse('Unknown User');

const userJson = '{"user": {"name": "太郎", "age": 25}}';
console.log(getUserName(userJson)); // '太郎'
```

### 2. Either型による明示的なエラーハンドリング

**Either型とは？**
成功（Right）と失敗（Left）を明示的に表現する型です。エラー情報を型安全に扱えます。

#### 基本的なEither型の実装

```typescript
// Either型の定義
type Either<L, R> = Left<L> | Right<R>;

interface Left<L> {
  readonly _tag: 'Left';
  readonly left: L;
}

interface Right<R> {
  readonly _tag: 'Right';
  readonly right: R;
}

// コンストラクタ関数
const left = <L, R = never>(value: L): Either<L, R> => 
  ({ _tag: 'Left', left: value });

const right = <L = never, R = never>(value: R): Either<L, R> => 
  ({ _tag: 'Right', right: value });

// 型ガード
const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => 
  either._tag === 'Left';

const isRight = <L, R>(either: Either<L, R>): either is Right<R> => 
  either._tag === 'Right';
```

#### Eitherの基本操作

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
const fold = <L, R, U>(
  onLeft: (left: L) => U,
  onRight: (right: R) => U
) => (either: Either<L, R>): U => 
  isLeft(either) ? onLeft(either.left) : onRight(either.right);
```

#### 実用的なEither型の活用

```typescript
// エラー型の定義
type ValidationError = {
  field: string;
  message: string;
};

type ParseError = {
  type: 'ParseError';
  message: string;
};

// バリデーション関数
const validateEmail = (email: string): Either<ValidationError, string> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? right(email)
    : left({ field: 'email', message: '有効なメールアドレスを入力してください' });
};

const validateAge = (age: string): Either<ValidationError, number> => {
  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum)) {
    return left({ field: 'age', message: '年齢は数値で入力してください' });
  }
  if (ageNum < 0 || ageNum > 150) {
    return left({ field: 'age', message: '年齢は0-150の範囲で入力してください' });
  }
  return right(ageNum);
};

// 複数のバリデーションを組み合わせ
type User = {
  email: string;
  age: number;
};

const createUser = (emailStr: string, ageStr: string): Either<ValidationError[], User> => {
  const emailResult = validateEmail(emailStr);
  const ageResult = validateAge(ageStr);
  
  // 両方が成功の場合のみユーザーを作成
  if (isRight(emailResult) && isRight(ageResult)) {
    return right({ email: emailResult.right, age: ageResult.right });
  }
  
  // エラーを収集
  const errors: ValidationError[] = [];
  if (isLeft(emailResult)) errors.push(emailResult.left);
  if (isLeft(ageResult)) errors.push(ageResult.left);
  
  return left(errors);
};

// 使用例
const userResult = createUser('invalid-email', '25');
fold(
  (errors) => console.log('エラー:', errors),
  (user) => console.log('ユーザー作成成功:', user)
)(userResult);
```

### 3. 高度な型パターン

#### Result型（EitherのString特化版）

```typescript
// よくあるパターンのResult型
type Result<T> = Either<string, T>;

const success = <T>(value: T): Result<T> => right(value);
const failure = <T = never>(error: string): Result<T> => left(error);

// HTTPレスポンスの例
const fetchUser = async (id: number): Promise<Result<User>> => {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return failure(`ユーザー取得エラー: ${response.status}`);
    }
    const user = await response.json();
    return success(user);
  } catch (error) {
    return failure(`ネットワークエラー: ${error.message}`);
  }
};
```

#### トランザクション的な処理

```typescript
// 複数の処理をチェーンして、どこかで失敗したら全体を失敗とする
const processUserData = (rawData: any): Result<User> => 
  safeParseJSON(JSON.stringify(rawData))
    |> mapEither(data => data.user)
    |> flatMapEither(userData => {
      if (!userData) return failure('ユーザーデータが存在しません');
      return success(userData);
    })
    |> flatMapEither(userData => 
      validateEmail(userData.email)
        |> mapEither(() => userData))
    |> flatMapEither(userData => 
      validateAge(userData.age)
        |> mapEither(age => ({ email: userData.email, age })));
```

### 4. 非同期処理との組み合わせ

#### TaskEither型（非同期 + Either）

```typescript
// 非同期処理でEitherを扱う型
type TaskEither<L, R> = Promise<Either<L, R>>;

// ヘルパー関数
const taskEitherOf = <L, R>(value: R): TaskEither<L, R> => 
  Promise.resolve(right(value));

const taskEitherFail = <L, R>(error: L): TaskEither<L, R> => 
  Promise.resolve(left(error));

// 非同期処理のチェーン
const chainTaskEither = <L, R, U>(
  fn: (value: R) => TaskEither<L, U>
) => async (taskEither: TaskEither<L, R>): Promise<TaskEither<L, U>> => {
  const either = await taskEither;
  return isRight(either) ? fn(either.right) : Promise.resolve(either);
};

// 実用例：ユーザー作成フロー
const createUserFlow = async (userData: any): TaskEither<string, User> => {
  return taskEitherOf(userData)
    |> chainTaskEither(validateUserData)
    |> chainTaskEither(saveUserToDatabase)
    |> chainTaskEither(sendWelcomeEmail);
};
```

### 5. 実践的なパターン

#### リソース管理

```typescript
// リソースの取得と解放を安全に行う
type Resource<T> = {
  acquire: () => Either<string, T>;
  release: (resource: T) => void;
};

const useResource = <T, U>(
  resource: Resource<T>,
  fn: (resource: T) => Either<string, U>
): Either<string, U> => {
  const acquired = resource.acquire();
  if (isLeft(acquired)) {
    return acquired;
  }
  
  try {
    const result = fn(acquired.right);
    return result;
  } finally {
    resource.release(acquired.right);
  }
};
```

#### パイプラインでの活用

```typescript
// 関数合成と組み合わせた処理パイプライン
const processData = (input: string) => 
  safeParseJSON(input)
    |> flatMapOption(data => 
      validateData(data)
        |> mapEither(validData => some(validData))
        |> getOrElse(none))
    |> flatMapOption(processValidData)
    |> mapOption(formatResult)
    |> getOrElse('処理に失敗しました');
```

## まとめ

### Option/Maybe型の利点
- **Null安全性**: null/undefinedによる実行時エラーを防ぐ
- **明示性**: 値が存在しない可能性を型で表現
- **チェーン可能**: 複数の操作を安全にチェーン

### Either型の利点
- **型安全なエラーハンドリング**: エラーの型を明示
- **エラー情報の保持**: 失敗の理由を詳細に記録
- **関数合成との親和性**: 成功パスのみに処理を適用

## 次のステップ

練習問題（exercises.ts）でOption型とEither型を実際に使ってみましょう。解答例は solutions.ts で確認できます。

理解できたら、レベル4の実践的なパターンに進みましょう！