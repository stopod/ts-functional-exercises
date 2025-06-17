# トラブルシューティングガイド

このガイドでは、TypeScript関数型プログラミング学習中によく遭遇する問題と解決法を説明します。

## 📋 目次

1. [TypeScript型エラー](#typescript型エラー)
2. [関数合成の問題](#関数合成の問題)
3. [Option/Either型の使用エラー](#optionejther型の使用エラー)
4. [非同期処理のエラー](#非同期処理のエラー)
5. [パフォーマンスの問題](#パフォーマンスの問題)

---

## TypeScript型エラー

### エラー: `Type 'unknown' is not assignable to type...`

**症状:**
```typescript
// エラーが発生するコード
const result = safeParseJSON(jsonString)
  .map(data => data.user.name); // Error: Type 'unknown' is not assignable to type...
```

**原因:**
型推論が`unknown`になってしまい、プロパティアクセスができない。

**解決策:**
```typescript
// ✅ 解決策1: 型アサーションを使用
const result = safeParseJSON(jsonString)
  .map(data => (data as any).user.name);

// ✅ 解決策2: 型ガードを使用
const isUser = (data: unknown): data is { user: { name: string } } =>
  typeof data === 'object' && 
  data !== null && 
  'user' in data &&
  typeof (data as any).user === 'object' &&
  'name' in (data as any).user;

const result = safeParseJSON(jsonString)
  .flatMap(data => isUser(data) ? some(data.user.name) : none);

// ✅ 解決策3: 明示的な型注釈
const result = safeParseJSON(jsonString) as Option<{ user: { name: string } }>
  .map(data => data.user.name);
```

### エラー: `Property does not exist on type 'never'`

**症状:**
```typescript
// エラーが発生するコード
const processEither = (either: Either<string, number>) => {
  return either.right * 2; // Error: Property 'right' does not exist on type 'never'
};
```

**原因:**
Either型の型ガードを使わずに値にアクセスしようとしている。

**解決策:**
```typescript
// ✅ 正しい使い方
const processEither = (either: Either<string, number>): Either<string, number> => {
  if (isRight(either)) {
    return right(either.right * 2);
  } else {
    return either; // Left の場合はそのまま返す
  }
};

// ✅ mapを使った関数型アプローチ
const processEither = (either: Either<string, number>): Either<string, number> =>
  mapEither((value: number) => value * 2)(either);
```

### エラー: `Excessive stack depth comparing types`

**症状:**
```typescript
// 複雑な型定義でコンパイルエラー
type DeepNested<T> = T extends object 
  ? { [K in keyof T]: DeepNested<T[K]> }
  : T;
```

**原因:**
再帰的な型定義が深くなりすぎている。

**解決策:**
```typescript
// ✅ 深度制限を設けた型定義
type DeepNested<T, Depth extends number = 5> = 
  Depth extends 0 
    ? T
    : T extends object 
      ? { [K in keyof T]: DeepNested<T[K], Prev<Depth>> }
      : T;

type Prev<T extends number> = T extends 1 ? 0 : 
  T extends 2 ? 1 : T extends 3 ? 2 : T extends 4 ? 3 : T extends 5 ? 4 : never;
```

---

## 関数合成の問題

### 問題: `compose` vs `pipe` の混同

**症状:**
```typescript
// 期待した結果にならない
const result = compose(addOne, multiplyTwo)(5); // 期待: 12, 実際: 11
```

**原因:**
`compose`は右から左、`pipe`は左から右に実行される。

**解決策:**
```typescript
// ✅ composeの正しい理解（右から左）
const result1 = compose(addOne, multiplyTwo)(5); // multiplyTwo(5) -> addOne(10) = 11

// ✅ pipeを使った直感的な記述（左から右）
const result2 = pipe(multiplyTwo, addOne)(5); // multiplyTwo(5) -> addOne(10) = 11

// 期待した結果 (5 + 1) * 2 = 12 を得るには:
const result3 = compose(multiplyTwo, addOne)(5); // addOne(5) -> multiplyTwo(6) = 12
const result4 = pipe(addOne, multiplyTwo)(5);    // addOne(5) -> multiplyTwo(6) = 12
```

### 問題: 型の不一致

**症状:**
```typescript
// 型エラーが発生
const processData = compose(
  (x: string) => x.toUpperCase(),
  (x: number) => x.toString(),
  (x: string) => parseInt(x) // Error: 型が合わない
);
```

**原因:**
関数の入力と出力の型が連鎖していない。

**解決策:**
```typescript
// ✅ 型を明確にして段階的に構築
const parseToNumber = (x: string): number => parseInt(x, 10);
const numberToString = (x: number): string => x.toString();
const toUpperCase = (x: string): string => x.toUpperCase();

// 正しい順序での合成
const processData = compose(toUpperCase, numberToString, parseToNumber);
// または
const processData = pipe(parseToNumber, numberToString, toUpperCase);
```

---

## Option/Either型の使用エラー

### 問題: ネストしたOption型

**症状:**
```typescript
// Option<Option<T>>になってしまう
const getUserName = (userId: number): Option<Option<string>> =>
  findUser(userId)
    .map(user => user.name ? some(user.name) : none); // Wrong!
```

**原因:**
`map`の代わりに`flatMap`を使うべき場面で`map`を使っている。

**解決策:**
```typescript
// ✅ flatMapを使って平坦化
const getUserName = (userId: number): Option<string> =>
  findUser(userId)
    .flatMap(user => user.name ? some(user.name) : none);

// ✅ または、mapWithチェーンパターン
const getUserName = (userId: number): Option<string> =>
  findUser(userId)
    .map(user => user.name)
    .filter(name => name !== undefined && name !== null);
```

### 問題: Either型でのエラー情報の損失

**症状:**
```typescript
// エラー情報が失われる
const validateUser = (data: any): Either<string, User> => {
  const emailResult = validateEmail(data.email);
  const ageResult = validateAge(data.age);
  
  if (isLeft(emailResult)) return emailResult;
  if (isLeft(ageResult)) return ageResult;
  
  return right({ email: emailResult.right, age: ageResult.right });
};
```

**原因:**
複数のエラーがある場合、最初のエラーしか報告されない。

**解決策:**
```typescript
// ✅ すべてのエラーを収集
type ValidationErrors = {
  email?: string;
  age?: string;
};

const validateUser = (data: any): Either<ValidationErrors, User> => {
  const emailResult = validateEmail(data.email);
  const ageResult = validateAge(data.age);
  
  const errors: ValidationErrors = {};
  
  if (isLeft(emailResult)) {
    errors.email = emailResult.left;
  }
  
  if (isLeft(ageResult)) {
    errors.age = ageResult.left;
  }
  
  if (Object.keys(errors).length > 0) {
    return left(errors);
  }
  
  return right({
    email: (emailResult as Right<string>).right,
    age: (ageResult as Right<number>).right
  });
};

// ✅ または、Applicative Functorパターンを使用
const validateUserApplicative = (data: any): Either<ValidationError[], User> =>
  sequenceEither([
    validateEmail(data.email),
    validateAge(data.age)
  ]).map(([email, age]) => ({ email, age }));
```

---

## 非同期処理のエラー

### 問題: TaskEitherでのエラーハンドリング忘れ

**症状:**
```typescript
// エラーハンドリングが不完全
const fetchUserData = (id: number): TaskEither<ApiError, User> =>
  TaskEither.fromPromise(
    fetch(`/api/users/${id}`).then(res => res.json()),
    error => ({ type: 'NetworkError', message: error.message })
  );
  
// 使用時にエラーケースを忘れている
fetchUserData(1).run().then(result => {
  console.log(result.right.name); // Error: result might be Left!
});
```

**原因:**
Eitherの型チェックを行わずに値にアクセスしている。

**解決策:**
```typescript
// ✅ 適切なエラーハンドリング
const handleUser = async (id: number) => {
  const result = await fetchUserData(id).run();
  
  if (isLeft(result)) {
    console.error('エラーが発生しました:', result.left.message);
    return;
  }
  
  const user = result.right;
  console.log('ユーザー名:', user.name);
};

// ✅ fold関数を使った処理
const handleUserWithFold = async (id: number) => {
  const result = await fetchUserData(id).run();
  
  const message = fold(
    (error: ApiError) => `エラー: ${error.message}`,
    (user: User) => `ユーザー名: ${user.name}`
  )(result);
  
  console.log(message);
};
```

### 問題: 複数の非同期処理の組み合わせ

**症状:**
```typescript
// 複雑で読みにくいコード
const getUserWithProfile = async (userId: number) => {
  const userResult = await fetchUser(userId).run();
  if (isLeft(userResult)) return userResult;
  
  const profileResult = await fetchProfile(userResult.right.profileId).run();
  if (isLeft(profileResult)) return profileResult;
  
  return right({
    ...userResult.right,
    profile: profileResult.right
  });
};
```

**原因:**
TaskEitherの合成メソッドを使わずに手動で処理している。

**解決策:**
```typescript
// ✅ flatMapを使った関数型アプローチ
const getUserWithProfile = (userId: number): TaskEither<ApiError, UserWithProfile> =>
  fetchUser(userId)
    .flatMap(user =>
      fetchProfile(user.profileId)
        .map(profile => ({ ...user, profile }))
    );

// ✅ または、Do記法風のアプローチ
const getUserWithProfileDo = (userId: number): TaskEither<ApiError, UserWithProfile> =>
  TaskEither.Do
    .bind('user', fetchUser(userId))
    .bind('profile', ({ user }) => fetchProfile(user.profileId))
    .map(({ user, profile }) => ({ ...user, profile }));
```

---

## パフォーマンスの問題

### 問題: 無駄な再計算

**症状:**
```typescript
// 毎回重い計算が実行される
const ExpensiveComponent = ({ users }: { users: User[] }) => {
  const processedUsers = users
    .filter(user => user.isActive)
    .map(user => ({
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      avatar: generateAvatar(user.id) // 重い処理
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  return <UserList users={processedUsers} />;
};
```

**原因:**
メモ化を使わずに毎回計算している。

**解決策:**
```typescript
// ✅ useMemoを使ったメモ化（React）
const ExpensiveComponent = ({ users }: { users: User[] }) => {
  const processedUsers = useMemo(() =>
    users
      .filter(user => user.isActive)
      .map(user => ({
        ...user,
        displayName: `${user.firstName} ${user.lastName}`,
        avatar: generateAvatar(user.id)
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [users]
  );
  
  return <UserList users={processedUsers} />;
};

// ✅ 関数型メモ化
const memoizedProcessUsers = createMemoize(
  (users: User[]) => users
    .filter(user => user.isActive)
    .map(user => ({
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      avatar: generateAvatar(user.id)
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName)),
  (users) => `${users.length}-${users.map(u => u.id).join('-')}`
);
```

### 問題: メモリリーク

**症状:**
```typescript
// メモリリークが発生するキャッシュ
const cache = new Map<string, any>();

const memoize = <T>(fn: (key: string) => T) => (key: string): T => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = fn(key);
  cache.set(key, result); // 永続的にキャッシュされ続ける
  return result;
};
```

**原因:**
キャッシュサイズが無制限に増加している。

**解決策:**
```typescript
// ✅ LRUキャッシュの使用
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  
  constructor(private maxSize: number) {}
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 最近使用されたアイテムを最後に移動
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 最も古いアイテムを削除
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

const cache = new LRUCache<string, any>(100); // 最大100個

const memoizeWithLRU = <T>(fn: (key: string) => T) => (key: string): T => {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  
  const result = fn(key);
  cache.set(key, result);
  return result;
};
```

---

## 🎯 デバッグのコツ

### 1. 型エラーの読み方
```typescript
// TypeScriptエラーメッセージの見方
// Error: Type 'Option<number>' is not assignable to type 'number'
//   Type 'Some<number>' is missing the following properties from type 'number': ...

// これは Option<number> を number として使おうとしていることを示す
// 解決: getOrElse や型ガードを使って値を取り出す
```

### 2. ステップバイステップでのデバッグ
```typescript
// ✅ 複雑な処理を段階的に確認
const debugPipeline = (input: string) => {
  console.log('Input:', input);
  
  const step1 = parseJSON(input);
  console.log('Step 1 (parse):', step1);
  
  const step2 = step1.flatMap(safeProp('user'));
  console.log('Step 2 (get user):', step2);
  
  const step3 = step2.flatMap(safeProp('name'));
  console.log('Step 3 (get name):', step3);
  
  return step3;
};
```

### 3. 型注釈を使った確認
```typescript
// 型注釈を追加して期待する型を明確にする
const processUser = (user: User): Either<ValidationError, ProcessedUser> => {
  const emailValidation: Either<ValidationError, Email> = validateEmail(user.email);
  const ageValidation: Either<ValidationError, Age> = validateAge(user.age);
  
  // 型が期待通りかコンパイル時に確認できる
  return combineValidations(emailValidation, ageValidation);
};
```

---

## 📚 さらなる学習リソース

- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript公式ドキュメント
- [fp-ts](https://gcanti.github.io/fp-ts/) - TypeScript関数型プログラミングライブラリ
- [Ramda](https://ramdajs.com/) - 関数型ユーティリティライブラリ
- [Mostly Adequate Guide](https://github.com/MostlyAdequate/mostly-adequate-guide) - 関数型プログラミング入門書

問題が解決しない場合は、具体的なエラーメッセージとコードを含めて質問してください！