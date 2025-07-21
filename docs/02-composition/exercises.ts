// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル2: 関数合成とユーティリティ - 練習問題
// 関数合成、カリー化、部分適用の理解を深めましょう

// ===========================================
// 問題1: 基本的な関数合成
// ===========================================

/**
 * 問題1-1: compose関数を使って文字列処理チェーンを作成してください
 * 以下の関数を組み合わせて、文字列を「トリム → 大文字化 → 感嘆符追加」の順で処理する関数を作成
 */

// 提供される関数群
const trim = (str: string): string => str.trim();
const toUpperCase = (str: string): string => str.toUpperCase();
const addExclamation = (str: string): string => str + "!";

// compose関数（すでに実装済み）
const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a));

// TODO: composeを使って文字列処理関数を作成してください
// const processString = compose(/* ここに実装 */);

/**
 * 問題1-2: 3つの関数を合成するcompose3関数を実装してください
 */
// TODO: compose3関数を実装してください
const compose3 =
  <A, B, C, D>(f: (c: C) => D, g: (b: B) => C, h: (a: A) => B) =>
  (a: A): D => {
    // ここに実装
  };

// 使用例：数値を「+1 → ×2 → ×3」の順で処理
const add1 = (x: number): number => x + 1;
const multiply2 = (x: number): number => x * 2;
const multiply3 = (x: number): number => x * 3;

// TODO: compose3を使って関数を作成
// ここに実装

// ===========================================
// 問題2: pipe関数の実装と活用
// ===========================================

/**
 * 問題2-1: 基本的なpipe関数を実装してください
 * composeとは逆順（左から右）で関数を実行します
 */
// TODO: pipe関数を実装してください
const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T => {
    // ここに実装（reduce を使うと良いでしょう）
  };

/**
 * 問題2-2: より柔軟なpipeFlexible関数を実装してください
 * 型を変換できるバージョンです
 */

type PipeChain<T> = {
  pipe: <U>(fn: (value: T) => U) => PipeChain<U>;
  value: () => T;
  // 追加メソッド: mapのエイリアス
  map: <U>(fn: (value: T) => U) => PipeChain<U>;
  // 追加メソッド: tap（デバッグ用）
  tap: (fn: (value: T) => void) => PipeChain<T>;
};

// TODO: pipeFlexible関数を実装してください
const pipeFlexible = <T>(value: T): PipeChain<T> => ({
  // ここに実装
  pipe: <U>(fn: (value: T) => U) => pipeFlexible(fn(value)),
  map: <U>(fn: (value: T) => U) => pipeFlexible(fn(value)),
  tap: (fn: (value: T) => void) => {
    fn(value);
    return pipeFlexible(value);
  },
  value: () => value,
});

// 使用例：
// const result = pipeFlexible(10)
//   .pipe((n: number) => n.toString())    // number → string
//   .pipe((s: string) => s + '円')        // string → string
//   .pipe((s: string) => `価格: ${s}`)    // string → string
//   .value();
// console.log(result); // '価格: 10円' になるはず

// ===========================================
// 問題3: 実用的なデータ変換パイプライン
// ===========================================

/**
 * 問題3-1: ユーザーデータの変換パイプラインを作成してください
 */

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

// TODO: 以下の変換関数を実装してください

// 1. メールアドレスを正規化（小文字化、トリム）
const normalizeEmail = (userData: RawUserData): RawUserData => {
  // ここに実装
};

// 2. 姓名を結合してfullNameを作成
const createFullName = (
  userData: RawUserData
): RawUserData & { fullName: string } => {
  // ここに実装
};

// 3. 生年から年齢を計算
const calculateAge = (
  userData: RawUserData & { fullName: string }
): RawUserData & { fullName: string; age: number } => {
  // ここに実装
};

// 4. 成人フラグを追加
const addAdultFlag = (
  userData: RawUserData & { fullName: string; age: number }
): ProcessedUser => {
  // ここに実装
};

// TODO: パイプラインを使って全体の変換関数を作成
const transformUser = (rawData: RawUserData): ProcessedUser =>
  // ここに変換関数を順番に並べてください
  pipe(rawData);

// テストデータ
const testUserData: RawUserData = {
  first_name: "太郎",
  last_name: "山田",
  email: "  TARO.YAMADA@EXAMPLE.COM  ",
  birth_year: "1990",
  country: "日本",
};

// console.log(transformUser(testUserData));

// ===========================================
// 問題4: カリー化の実装と活用
// ===========================================

/**
 * 問題4-1: 基本的なカリー化関数を実装してください
 */

// TODO: 2引数の関数をカリー化する関数を実装
const curry2 =
  <A, B, C>(fn: (a: A, b: B) => C) =>
  (a: A) =>
  (b: B): C => {
    // ここに実装
  };

// 使用例
const addTwoNumbers = (a: number, b: number): number => a + b;
const curriedAdd = curry2(addTwoNumbers);
const add10 = curriedAdd(10);
console.log(add10(5)); // 15 になるはず

/**
 * 問題4-2: 3引数の関数をカリー化する関数を実装してください
 */
// TODO: curry3関数を実装
const curry3 =
  <A, B, C, D>(fn: (a: A, b: B, c: C) => D) =>
  (a: A) =>
  (b: B) =>
  (c: C): D => {
    // ここに実装
  };

/**
 * 問題4-3: 配列操作用のカリー化された関数を作成してください
 */

// TODO: カリー化されたmap関数を実装
const curriedMap =
  <T, U>(fn: (item: T) => U) =>
  (array: T[]): U[] => {
    // ここに実装
  };

// TODO: カリー化されたfilter関数を実装
const curriedFilter =
  <T>(predicate: (item: T) => boolean) =>
  (array: T[]): T[] => {
    // ここに実装
  };

// 使用例：
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const double = curriedMap((n: number) => n * 2);
const onlyEven = curriedFilter((n: number) => n % 2 === 0);
const greaterThan5 = curriedFilter((n: number) => n > 5);

// パイプと組み合わせて使用
const processNumbers = pipe(greaterThan5, onlyEven, double);
console.log(processNumbers(numbers)); // [12, 16, 20]

// ===========================================
// 問題5: 部分適用の実装と活用
// ===========================================

/**
 * 問題5-1: 部分適用のヘルパー関数を改良してください
 */

// TODO: より型安全な部分適用関数を実装
const partial =
  <A extends any[], B>(fn: (...args: A) => B, ...partialArgs: Partial<A>) =>
  (...remainingArgs: any[]): B =>
    fn(...(partialArgs.concat(remainingArgs) as A));

/**
 * 問題5-2: ログ関数の部分適用を活用してください
 */

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const log = (level: LogLevel, module: string, message: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${module}: ${message}`);
};

// TODO: 部分適用を使って以下の専用ログ関数を作成してください
// const errorLog = /* ここに実装 */;
// const infoLog = /* ここに実装 */;
// const userModuleError = /* ここに実装 */;
// const authModuleInfo = /* ここに実装 */;

// 使用例：
// userModuleError('ユーザー作成に失敗しました');
// authModuleInfo('ユーザーがログインしました');

// ===========================================
// 問題6: 高度な合成パターン
// ===========================================

/**
 * 問題6-1: 条件分岐を含む関数合成を実装してください
 */

// TODO: 条件によって異なる処理を適用するcondPipe関数を実装
// const condPipe = <T>(
//   condition: (value: T) => boolean,
//   truePipe: (value: T) => T,
//   falsePipe: (value: T) => T
// ) => (value: T): T => {
//   // ここに実装
// };

// 使用例：正の数と負の数で異なる処理
// const processNumber = condPipe(
//   (n: number) => n >= 0,
//   pipe(multiply2, add1),      // 正の数: ×2 → +1
//   pipe(multiply3, (n) => -n)  // 負の数: ×3 → 符号反転
// );

// console.log(processNumber(5));  // (5 * 2) + 1 = 11
// console.log(processNumber(-3)); // -((-3) * 3) = 9

/**
 * 問題6-2: 配列の各要素に対して条件付き変換を行う関数を作成してください
 */

// TODO: mapWithCondition関数を実装
// const mapWithCondition = <T>(
//   array: T[],
//   condition: (item: T) => boolean,
//   trueMapper: (item: T) => T,
//   falseMapper: (item: T) => T
// ): T[] => {
//   // ここに実装
// };

// 使用例：偶数は2倍、奇数は3倍
// const result = mapWithCondition(
//   [1, 2, 3, 4, 5],
//   (n) => n % 2 === 0,
//   (n) => n * 2,  // 偶数
//   (n) => n * 3   // 奇数
// );
// console.log(result); // [3, 4, 9, 8, 15]

// ===========================================
// 問題7: 実践的な組み合わせ問題
// ===========================================

/**
 * 問題7-1: ECサイトの商品データ処理パイプラインを作成してください
 */

type RawProduct = {
  id: string;
  name: string;
  price: string; // 文字列として受信
  category: string;
  stock: string; // 文字列として受信
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
  priceDisplay: string; // '¥1,000' のような形式
};

// TODO: 以下の処理関数とパイプラインを実装してください

// 1. 価格を数値に変換
// const parsePrice = (product: RawProduct): RawProduct & { price: number } => {
//   // ここに実装
// };

// 2. 在庫数を数値に変換
// const parseStock = (product: RawProduct & { price: number }): RawProduct & { price: number; stock: number } => {
//   // ここに実装
// };

// 3. 在庫有無フラグを追加
// const addAvailabilityFlag = (product: RawProduct & { price: number; stock: number }): RawProduct & { price: number; stock: number; isAvailable: boolean } => {
//   // ここに実装（在庫が1以上なら利用可能）
// };

// 4. 価格表示用文字列を作成
// const addPriceDisplay = (product: RawProduct & { price: number; stock: number; isAvailable: boolean }): ProcessedProduct => {
//   // ここに実装（例：12345 → '¥12,345'）
// };

// TODO: 全体のパイプラインを作成
// const processProduct = (rawProduct: RawProduct): ProcessedProduct =>
//   pipe(
//     // ここに変換関数を順番に並べてください
//   )(rawProduct);

// テストデータ
const testProduct: RawProduct = {
  id: "prod-001",
  name: "ワイヤレスマウス",
  price: "2980",
  category: "PC周辺機器",
  stock: "15",
  description: "高精度ワイヤレスマウス",
};

// console.log(processProduct(testProduct));

/**
 * 問題7-2: 複数の商品をまとめて処理する関数を作成してください
 */

// TODO: 商品配列を処理し、利用可能な商品のみを返す関数を作成
// const processProductList = (rawProducts: RawProduct[]): ProcessedProduct[] => {
//   // ここに実装（processProductを活用し、利用可能な商品のみフィルタリング）
// };

// TODO: カテゴリ別に商品をグループ化する関数を作成
// const groupByCategory = (products: ProcessedProduct[]): Record<string, ProcessedProduct[]> => {
//   // ここに実装
// };

// テストデータ
const testProducts: RawProduct[] = [
  {
    id: "prod-001",
    name: "ワイヤレスマウス",
    price: "2980",
    category: "PC周辺機器",
    stock: "15",
    description: "高精度ワイヤレスマウス",
  },
  {
    id: "prod-002",
    name: "キーボード",
    price: "8900",
    category: "PC周辺機器",
    stock: "0",
    description: "メカニカルキーボード",
  },
  {
    id: "prod-003",
    name: "ノートPC",
    price: "89800",
    category: "PC本体",
    stock: "3",
    description: "軽量ノートPC",
  },
];

// 全体の処理パイプライン
// const processAndGroupProducts = pipe(
//   processProductList,
//   groupByCategory
// );

// console.log(processAndGroupProducts(testProducts));

// ===========================================
// テスト実行関数
// ===========================================

export const runLevel2Tests = () => {
  console.log("=== レベル2 練習問題のテスト ===");
  console.log("solutions.ts を確認して、実装を確認してください");
};
