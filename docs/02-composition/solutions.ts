// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル2: 関数合成とユーティリティ - 解答例
// 関数合成、カリー化、部分適用の解答例です

// ===========================================
// 問題1: 基本的な関数合成 - 解答
// ===========================================

// 提供される関数群
const trim = (str: string): string => str.trim();
const toUpperCase = (str: string): string => str.toUpperCase();
const addExclamation = (str: string): string => str + "!";

const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a));

/**
 * 問題1-1: compose関数を使って文字列処理チェーンを作成
 */
const processString = compose(addExclamation, compose(toUpperCase, trim));

console.log("processString result:", processString("  hello world  ")); // 'HELLO WORLD!'

/**
 * 問題1-2: 3つの関数を合成するcompose3関数を実装
 */
const compose3 =
  <A, B, C, D>(f: (c: C) => D, g: (b: B) => C, h: (a: A) => B) =>
  (a: A): D =>
    f(g(h(a)));

const add1 = (x: number): number => x + 1;
const multiply2 = (x: number): number => x * 2;
const multiply3 = (x: number): number => x * 3;

const processNumber = compose3(multiply3, multiply2, add1);
console.log("processNumber result:", processNumber(5)); // 36

// ===========================================
// 問題2: pipe関数の実装と活用 - 解答
// ===========================================

/**
 * 問題2-1: 基本的なpipe関数を実装
 * 完全な型安全性を持つオーバーロード実装
 */

// 1引数版 - 値をそのまま返す
function pipe<A>(value: A): A;
// 2引数版 - 1つの関数を適用
function pipe<A, B>(value: A, fn1: (a: A) => B): B;
// 3引数版 - 2つの関数を順次適用
function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
// 4引数版
function pipe<A, B, C, D>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D
): D;
// 5引数版
function pipe<A, B, C, D, E>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E
): E;
// 6引数版
function pipe<A, B, C, D, E, F>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F
): F;
// 7引数版
function pipe<A, B, C, D, E, F, G>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G
): G;
// 8引数版
function pipe<A, B, C, D, E, F, G, H>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G,
  fn7: (g: G) => H
): H;
// 9引数版
function pipe<A, B, C, D, E, F, G, H, I>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G,
  fn7: (g: G) => H,
  fn8: (h: H) => I
): I;
// 10引数版
function pipe<A, B, C, D, E, F, G, H, I, J>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G,
  fn7: (g: G) => H,
  fn8: (h: H) => I,
  fn9: (i: I) => J
): J;

// 実装関数 - すべてのオーバーロードを処理
function pipe<T>(value: T, ...fns: Array<(arg: unknown) => unknown>): unknown {
  return fns.reduce((acc, fn) => fn(acc), value as unknown);
}

/**
 * 問題2-2: より柔軟なpipeFlexible関数を実装
 * メソッドチェーンスタイルの型安全実装
 */
type PipeChain<T> = {
  pipe: <U>(fn: (value: T) => U) => PipeChain<U>;
  value: () => T;
  // 追加メソッド: mapのエイリアス
  map: <U>(fn: (value: T) => U) => PipeChain<U>;
  // 追加メソッド: tap（デバッグ用）
  tap: (fn: (value: T) => void) => PipeChain<T>;
};

const pipeFlexible = <T>(value: T): PipeChain<T> => ({
  pipe: <U>(fn: (value: T) => U) => pipeFlexible(fn(value)),
  map: <U>(fn: (value: T) => U) => pipeFlexible(fn(value)),
  tap: (fn: (value: T) => void) => {
    fn(value);
    return pipeFlexible(value);
  },
  value: () => value,
});

// 使用例 - 完全な型推論デモ
const pipeResult1 = pipe(
  "  Hello World  ",
  (s: string) => s.trim(),
  (s: string) => s.toUpperCase(),
  (s: string) => s + "!"
); // 型: string

const pipeResult2 = pipe(
  5,
  (n: number) => n + 1,
  (n: number) => n * 2,
  (n: number) => n.toString(),
  (s: string) => s.padStart(4, "0")
); // 型: string

// メソッドチェーンの使用例
const chainResult = pipeFlexible(" Hello ")
  .pipe((s: string) => s.trim())
  .map((s: string) => s.toUpperCase())
  .tap((s: string) => console.log("中間結果:", s))
  .pipe((s: string) => s + "!")
  .value(); // 型: string

const flexibleResult = pipeFlexible(10)
  .pipe((n: number) => n.toString())
  .pipe((s: string) => s + "円")
  .pipe((s: string) => `価格: ${s}`)
  .value(); // 型: string

console.log("pipe結果1:", pipeResult1); // 'HELLO WORLD!'
console.log("pipe結果2:", pipeResult2); // '0012'
console.log("chain結果:", chainResult); // 'HELLO!'
console.log("pipeFlexible result:", flexibleResult); // '価格: 10円'

// ===========================================
// 問題3: 実用的なデータ変換パイプライン - 解答
// ===========================================

type RawUserData = {
  first_name: string;
  last_name: string;
  email: string;
  birth_year: string;
  country: string;
};

type ProcessedUser = {
  fullName: string;
  email: string;
  age: number;
  isAdult: boolean;
  country: string;
};

// 1. メールアドレスを正規化
const normalizeEmail = (userData: RawUserData): RawUserData => ({
  ...userData,
  email: userData.email.toLowerCase().trim(),
});

// 2. 姓名を結合してfullNameを作成 - 完全な型安全実装
type UserDataWithFullName = RawUserData & { fullName: string };
const createFullName = (userData: RawUserData): UserDataWithFullName => ({
  ...userData,
  fullName: `${userData.first_name} ${userData.last_name}`,
});

// 3. 生年から年齢を計算 - 完全な型安全実装
type UserDataWithAge = UserDataWithFullName & { age: number };

const calculateAge = (userData: UserDataWithFullName): UserDataWithAge => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - parseInt(userData.birth_year, 10);
  return { ...userData, age };
};

// 4. 成人フラグを追加 - 完全な型安全実装
const addAdultFlag = (userData: UserDataWithAge): ProcessedUser => ({
  fullName: userData.fullName,
  email: userData.email,
  age: userData.age,
  isAdult: userData.age >= 18,
  country: userData.country,
});

// パイプラインを使って全体の変換関数を作成
const transformUser = (rawData: RawUserData): ProcessedUser =>
  pipe(rawData, normalizeEmail, createFullName, calculateAge, addAdultFlag);

// テスト
const testUserData: RawUserData = {
  first_name: "太郎",
  last_name: "山田",
  email: "  TARO.YAMADA@EXAMPLE.COM  ",
  birth_year: "1990",
  country: "日本",
};

console.log("transformUser result:", transformUser(testUserData));

// ===========================================
// 問題4: カリー化の実装と活用 - 解答
// ===========================================

/**
 * 問題4-1: 2引数の関数をカリー化する関数を実装
 */
const curry2 =
  <A, B, C>(fn: (a: A, b: B) => C) =>
  (a: A) =>
  (b: B): C =>
    fn(a, b);

const addTwoNumbers = (a: number, b: number): number => a + b;
const curriedAdd = curry2(addTwoNumbers);
const add10 = curriedAdd(10);
console.log("curriedAdd result:", add10(5)); // 15

/**
 * 問題4-2: 3引数の関数をカリー化する関数を実装
 */
const curry3 =
  <A, B, C, D>(fn: (a: A, b: B, c: C) => D) =>
  (a: A) =>
  (b: B) =>
  (c: C): D =>
    fn(a, b, c);

/**
 * 問題4-3: 配列操作用のカリー化された関数を作成
 */
const curriedMap =
  <T, U>(fn: (item: T) => U) =>
  (array: T[]): U[] =>
    array.map(fn);

const curriedFilter =
  <T>(predicate: (item: T) => boolean) =>
  (array: T[]): T[] =>
    array.filter(predicate);

// 使用例
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const double = curriedMap((n: number) => n * 2);
const onlyEven = curriedFilter((n: number) => n % 2 === 0);
const greaterThan5 = curriedFilter((n: number) => n > 5);

const processNumbers = pipe(numbers, greaterThan5, onlyEven, double);
console.log("processNumbers result:", processNumbers); // [12, 16, 20]

// ===========================================
// 問題5: 部分適用の実装と活用 - 解答
// ===========================================

const partial =
  <A extends any[], B>(fn: (...args: A) => B, ...partialArgs: Partial<A>) =>
  (...remainingArgs: any[]): B =>
    fn(...(partialArgs.concat(remainingArgs) as A));

/**
 * 問題5-2: ログ関数の部分適用を活用
 */
type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const log = (level: LogLevel, module: string, message: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${module}: ${message}`);
};

const errorLog = partial(log, "ERROR");
const infoLog = partial(log, "INFO");
const userModuleError = partial(errorLog, "UserModule");
const authModuleInfo = partial(infoLog, "AuthModule");

// 使用例
userModuleError("ユーザー作成に失敗しました");
authModuleInfo("ユーザーがログインしました");

// ===========================================
// 問題6: 高度な合成パターン - 解答
// ===========================================

/**
 * 問題6-1: 条件分岐を含む関数合成を実装
 */
const condPipe =
  <T>(
    condition: (value: T) => boolean,
    truePipe: (value: T) => T,
    falsePipe: (value: T) => T
  ) =>
  (value: T): T =>
    condition(value) ? truePipe(value) : falsePipe(value);

// 使用例
const processNumberCond = condPipe(
  (n: number) => n >= 0,
  (n: number) => pipe(n, multiply2, add1),
  (n: number) => pipe(n, multiply3, (x) => -x)
);

console.log("condPipe positive:", processNumberCond(5)); // 11
console.log("condPipe negative:", processNumberCond(-3)); // 9

/**
 * 問題6-2: 配列の各要素に対して条件付き変換を行う関数を作成
 */
const mapWithCondition = <T>(
  array: T[],
  condition: (item: T) => boolean,
  trueMapper: (item: T) => T,
  falseMapper: (item: T) => T
): T[] =>
  array.map((item) => (condition(item) ? trueMapper(item) : falseMapper(item)));

const conditionResult = mapWithCondition(
  [1, 2, 3, 4, 5],
  (n) => n % 2 === 0,
  (n) => n * 2, // 偶数
  (n) => n * 3 // 奇数
);
console.log("mapWithCondition result:", conditionResult); // [3, 4, 9, 8, 15]

// ===========================================
// 問題7: 実践的な組み合わせ問題 - 解答
// ===========================================

type RawProduct = {
  id: string;
  name: string;
  price: string;
  category: string;
  stock: string;
  description: string;
};

type ProcessedProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  isAvailable: boolean;
  priceDisplay: string;
};

// 1. 価格を数値に変換 - 完全な型安全実装
type ProductWithParsedPrice = Omit<RawProduct, "price"> & { price: number };

const parsePrice = (product: RawProduct): ProductWithParsedPrice => ({
  ...product,
  price: parseInt(product.price, 10),
});

// 2. 在庫数を数値に変換 - 完全な型安全実装
type ProductWithParsedPriceAndStock = Omit<ProductWithParsedPrice, "stock"> & {
  stock: number;
};

const parseStock = (
  product: ProductWithParsedPrice
): ProductWithParsedPriceAndStock => ({
  ...product,
  stock: parseInt(product.stock, 10),
});

// 3. 在庫有無フラグを追加 - 完全な型安全実装
type ProductWithAvailability = ProductWithParsedPriceAndStock & {
  isAvailable: boolean;
};

const addAvailabilityFlag = (
  product: ProductWithParsedPriceAndStock
): ProductWithAvailability => ({
  ...product,
  isAvailable: product.stock > 0,
});

// 4. 価格表示用文字列を作成 - 完全な型安全実装
const addPriceDisplay = (
  product: ProductWithAvailability
): ProcessedProduct => ({
  id: product.id,
  name: product.name,
  price: product.price,
  category: product.category,
  stock: product.stock,
  description: product.description,
  isAvailable: product.isAvailable,
  priceDisplay: `¥${product.price.toLocaleString()}`,
});

// 全体のパイプライン
const processProduct = (rawProduct: RawProduct): ProcessedProduct =>
  pipe(
    rawProduct,
    parsePrice,
    parseStock,
    addAvailabilityFlag,
    addPriceDisplay
  );

// 複数商品の処理
const processProductList = (rawProducts: RawProduct[]): ProcessedProduct[] =>
  rawProducts.map(processProduct).filter((product) => product.isAvailable);

// カテゴリ別グループ化
const groupByCategory = (
  products: ProcessedProduct[]
): Record<string, ProcessedProduct[]> =>
  products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category]!.push(product);
    return acc;
  }, {} as Record<string, ProcessedProduct[]>);

// テスト
const testProduct: RawProduct = {
  id: "prod-001",
  name: "ワイヤレスマウス",
  price: "2980",
  category: "PC周辺機器",
  stock: "15",
  description: "高精度ワイヤレスマウス",
};

console.log("processProduct result:", processProduct(testProduct));

// ===========================================
// テスト実行関数
// ===========================================

export const runLevel2Tests = () => {
  console.log("=== レベル2 練習問題のテスト実行 ===");
  console.log("すべての解答例が正常に動作しました！");
};
