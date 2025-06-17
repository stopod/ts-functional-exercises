# レベル2: 関数合成とユーティリティ

## 目標
このレベルでは、関数型プログラミングの中核となる**関数合成**の概念を学び、より複雑な処理を組み合わせて表現できるようになります。

## 学習内容

### 1. 関数合成（Function Composition）

**関数合成とは？なぜ重要なのか？**

複数の関数を組み合わせて、新しい関数を作る手法です。数学的には、`f(g(x))` のように関数を連鎖させることを指します。

**現実の問題：ユーザー登録処理を例に**

```typescript
// ❌ 関数合成を使わない場合（手続き型）
const registerUser = (input: string) => {
  // 1. バリデーション
  if (!input || input.length < 3) {
    throw new Error('Invalid input');
  }
  
  // 2. 正規化
  const trimmed = input.trim();
  const normalized = trimmed.toLowerCase();
  
  // 3. フォーマット
  const formatted = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  
  // 4. プレフィックス追加
  const prefixed = 'user_' + formatted;
  
  // 5. データベース保存（疑似コード）
  return saveToDatabase(prefixed);
};

// 問題点：
// 1. 長い関数で可読性が低い
// 2. 各ステップをテストしにくい
// 3. 一部のステップを他の場所で再利用できない
// 4. エラーハンドリングが複雑
```

```typescript
// ✅ 関数合成を使った場合（関数型）
// 各ステップを小さな関数に分割
const validate = (input: string): string => {
  if (!input || input.length < 3) throw new Error('Invalid input');
  return input;
};

const trim = (str: string): string => str.trim();
const toLowerCase = (str: string): string => str.toLowerCase();
const capitalize = (str: string): string => 
  str.charAt(0).toUpperCase() + str.slice(1);
const addUserPrefix = (str: string): string => 'user_' + str;

// 関数を合成して新しい関数を作成
const processUserInput = compose(
  addUserPrefix,
  compose(
    capitalize,
    compose(toLowerCase, compose(trim, validate))
  )
);

const registerUser = (input: string) => {
  const processedInput = processUserInput(input);
  return saveToDatabase(processedInput);
};

// 利点：
// 1. 各関数が単一の責任を持つ（単一責任の原則）
// 2. 各関数を個別にテスト可能
// 3. 関数を他の場所で再利用可能（trim, capitalize など）
// 4. 処理の流れが明確
// 5. 新しい処理ステップを簡単に追加できる
```

#### 段階的な学習：compose関数の理解

**ステップ1: 最初は手動で組み合わせ**
```typescript
const add1 = (x: number): number => x + 1;
const multiply2 = (x: number): number => x * 2;

// 最初は手動で関数を組み合わせ
const manualComposition = (x: number) => multiply2(add1(x));
console.log(manualComposition(3)); // (3 + 1) * 2 = 8
```

**ステップ2: compose関数を理解**
```typescript
// 基本的なcompose関数
const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => 
  (a: A): C => f(g(a));

// 上の手動の処理をcomposeで表現
const composedFunction = compose(multiply2, add1);
console.log(composedFunction(3)); // (3 + 1) * 2 = 8

// 重要：composeは右から左に実行される
// compose(multiply2, add1) は multiply2(add1(x)) と同じ
```

**ステップ3: より複雑な合成**
```typescript
const add5 = (x: number): number => x + 5;
const square = (x: number): number => x * x;
const subtract10 = (x: number): number => x - 10;

// 複数段階の合成を段階的に構築
// Step 3a: 2つの関数の合成
const step1 = compose(square, add5);  // まず5を足して、次に2乗
console.log(step1(3)); // (3 + 5)² = 64

// Step 3b: 3つの関数の合成
const step2 = compose(subtract10, compose(square, add5));
console.log(step2(3)); // ((3 + 5)²) - 10 = 54

// 理解チェック：処理の順序を確認
// 入力: 3 → add5(3) = 8 → square(8) = 64 → subtract10(64) = 54
```

#### より複雑な合成例

```typescript
// 文字列操作の関数群
const toUpperCase = (str: string): string => str.toUpperCase();
const addExclamation = (str: string): string => str + '!';
const trim = (str: string): string => str.trim();

// 複数の関数を合成
const processString = compose(
  addExclamation,
  compose(toUpperCase, trim)
);

console.log(processString('  hello world  ')); // 'HELLO WORLD!'
```

### 2. パイプ（Pipe）

**パイプとは？なぜcomposeより読みやすいのか？**

composeとは逆で、左から右に関数を実行する手法です。人間の思考の流れに沿って処理が記述できるため、より直感的で読みやすいことが多いです。

**compose vs pipe の読みやすさ比較**

```typescript
// 同じ処理をcomposeとpipeで実装してみましょう
const trim = (str: string): string => str.trim();
const toLowerCase = (str: string): string => str.toLowerCase();
const capitalize = (str: string): string => 
  str.charAt(0).toUpperCase() + str.slice(1);
const addUserPrefix = (str: string): string => 'user_' + str;

// ❌ composeを使った場合（右から左に読む必要がある）
const processWithCompose = compose(
  addUserPrefix,     // 4番目の処理
  compose(
    capitalize,      // 3番目の処理
    compose(
      toLowerCase,   // 2番目の処理
      trim          // 1番目の処理
    )
  )
);

// 理解するためには逆順で読む必要がある：
// 1. trim → 2. toLowerCase → 3. capitalize → 4. addUserPrefix

// ✅ pipeを使った場合（左から右に自然に読める）
const processWithPipe = pipe(
  trim,              // 1番目の処理
  toLowerCase,       // 2番目の処理  
  capitalize,        // 3番目の処理
  addUserPrefix      // 4番目の処理
);

// 自然な順序で読める：
// 1. 空白除去 → 2. 小文字化 → 3. 先頭大文字化 → 4. プレフィックス追加

console.log(processWithPipe('  JOHN DOE  ')); // 'user_John doe'
```

```typescript
// 基本的なpipe関数
const pipe = <T>(...fns: Array<(arg: T) => T>) => 
  (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

// より柔軟なpipe（型を変換できる）
const pipeFlexible = <T>(value: T) => ({
  pipe: <U>(fn: (value: T) => U) => pipeFlexible(fn(value)),
  value: () => value
});

// 使用例
const result = pipe(
  trim,
  toUpperCase,
  addExclamation
)('  hello world  ');
console.log(result); // 'HELLO WORLD!'

// pipeFlexibleの使用例
const flexibleResult = pipeFlexible('  hello world  ')
  .pipe(trim)
  .pipe(toUpperCase)
  .pipe(addExclamation)
  .value();
console.log(flexibleResult); // 'HELLO WORLD!'
```

### 3. 実用的な合成例

#### データ変換パイプライン

```typescript
// ユーザーデータの変換例
type RawUser = {
  first_name: string;
  last_name: string;
  email: string;
  age: string; // 文字列として受信
};

type User = {
  fullName: string;
  email: string;
  age: number;
  isAdult: boolean;
};

// 変換関数群
const normalizeEmail = (user: RawUser) => ({
  ...user,
  email: user.email.toLowerCase().trim()
});

const combineNames = (user: RawUser) => ({
  ...user,
  fullName: `${user.first_name} ${user.last_name}`
});

const parseAge = (user: RawUser & { fullName: string }) => ({
  ...user,
  age: parseInt(user.age, 10)
});

const addAdultFlag = (user: RawUser & { fullName: string; age: number }): User => ({
  fullName: user.fullName,
  email: user.email,
  age: user.age,
  isAdult: user.age >= 18
});

// パイプラインで処理
const transformUser = (rawUser: RawUser): User => 
  pipe(
    normalizeEmail,
    combineNames,
    parseAge,
    addAdultFlag
  )(rawUser);

// 使用例
const rawUserData: RawUser = {
  first_name: '太郎',
  last_name: '山田',
  email: '  TARO@EXAMPLE.COM  ',
  age: '25'
};

const transformedUser = transformUser(rawUserData);
console.log(transformedUser);
// {
//   fullName: '太郎 山田',
//   email: 'taro@example.com',
//   age: 25,
//   isAdult: true
// }
```

### 4. カリー化（Currying）

**カリー化とは？**
複数の引数を取る関数を、一つの引数を取る関数の連鎖に変換する技術です。

```typescript
// 通常の関数
const addNormal = (a: number, b: number): number => a + b;

// カリー化された関数
const addCurried = (a: number) => (b: number): number => a + b;

// 使用例
const add5 = addCurried(5);
console.log(add5(3)); // 8

// より複雑な例
const createGreeting = (greeting: string) => 
  (name: string) => 
    (punctuation: string): string => 
      `${greeting}, ${name}${punctuation}`;

const sayHello = createGreeting('こんにちは');
const sayHelloToTaro = sayHello('太郎');
console.log(sayHelloToTaro('!')); // 'こんにちは, 太郎!'

// 一度に呼び出すことも可能
console.log(createGreeting('おはよう')('花子')('。')); // 'おはよう, 花子。'
```

#### カリー化の実用例

```typescript
// 配列フィルタリング用のカリー化された関数
const filterBy = <T>(predicate: (item: T) => boolean) => 
  (array: T[]): T[] => array.filter(predicate);

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 特定の条件でフィルタリングする関数を作成
const filterEven = filterBy((n: number) => n % 2 === 0);
const filterGreaterThan5 = filterBy((n: number) => n > 5);

console.log(filterEven(numbers)); // [2, 4, 6, 8, 10]
console.log(filterGreaterThan5(numbers)); // [6, 7, 8, 9, 10]

// パイプと組み合わせる
const processNumbers = pipe(
  filterGreaterThan5,
  filterEven
);
console.log(processNumbers(numbers)); // [6, 8, 10]
```

### 5. 部分適用（Partial Application）

**部分適用とは？**
関数の一部の引数を固定して、新しい関数を作る技術です。カリー化と似ていますが、任意の数の引数を固定できます。

```typescript
// 部分適用のヘルパー関数
const partial = <A extends any[], B>(
  fn: (...args: A) => B, 
  ...partialArgs: Partial<A>
) => 
  (...remainingArgs: any[]): B => 
    fn(...(partialArgs.concat(remainingArgs) as A));

// 使用例
const createMessage = (greeting: string, name: string, message: string): string =>
  `${greeting} ${name}, ${message}`;

// 部分適用で挨拶を固定
const createHelloMessage = partial(createMessage, 'こんにちは');
console.log(createHelloMessage('太郎', '元気ですか？')); // 'こんにちは 太郎, 元気ですか？'

// より実用的な例：ログ関数
const log = (level: string, module: string, message: string): void => {
  console.log(`[${level}] ${module}: ${message}`);
};

const errorLog = partial(log, 'ERROR');
const userModuleError = partial(errorLog, 'UserModule');

userModuleError('ユーザーの作成に失敗しました'); // [ERROR] UserModule: ユーザーの作成に失敗しました
```

### 6. 高度な合成パターン

#### 条件分岐を含む合成

```typescript
// 条件によって異なる処理を適用
const conditionalPipe = <T>(
  condition: (value: T) => boolean,
  trueFn: (value: T) => T,
  falseFn: (value: T) => T
) => (value: T): T => condition(value) ? trueFn(value) : falseFn(value);

// 使用例
const processNumber = conditionalPipe(
  (n: number) => n > 0,
  (n: number) => n * 2,  // 正の数は2倍
  (n: number) => n * -1  // 負の数は符号反転
);

console.log(processNumber(5));  // 10
console.log(processNumber(-3)); // 3
```

#### 非同期処理の合成

```typescript
// Promise を扱う compose
const composeAsync = <A, B, C>(
  f: (b: B) => Promise<C>,
  g: (a: A) => Promise<B>
) => (a: A): Promise<C> => g(a).then(f);

// 使用例
const fetchUser = async (id: number): Promise<{ name: string; email: string }> => {
  // API呼び出しの模擬
  return { name: '太郎', email: 'taro@example.com' };
};

const formatUser = async (user: { name: string; email: string }): Promise<string> => {
  return `${user.name} (${user.email})`;
};

const fetchAndFormatUser = composeAsync(formatUser, fetchUser);

// fetchAndFormatUser(1).then(console.log); // '太郎 (taro@example.com)'
```

## 利点とベストプラクティス

### 関数合成の利点
1. **再利用性**: 小さな関数を組み合わせて複雑な処理を作成
2. **テスト容易性**: 各関数を個別にテスト可能
3. **可読性**: 処理の流れが明確
4. **デバッグしやすさ**: 問題のある関数を特定しやすい

### ベストプラクティス
1. **関数は単一責任**: 一つの関数は一つのことだけを行う
2. **純粋関数を保つ**: 副作用のない関数を使用
3. **型安全性を活用**: TypeScriptの型システムを最大限活用
4. **適切な命名**: 関数の目的が明確になる名前をつける

## 次のステップ

練習問題（exercises.ts）を解いて、関数合成とカリー化を実際に使ってみましょう。解答例は solutions.ts で確認できます。

理解できたら、レベル3の型を活用した安全な処理に進みましょう！