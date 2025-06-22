// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル1: 基礎概念 - 練習問題
// 各問題を解いて、関数型プログラミングの基礎を身につけましょう

// ===========================================
// 問題1: 純粋関数の作成
// ===========================================

/**
 * 問題1-1: 2つの数値を受け取り、その合計を返す純粋関数を作成してください
 */
// TODO: add関数を実装してください
const add = (a: number, b: number): number => {
  // ここに実装
};

/**
 * 問題1-2: 文字列を受け取り、その文字数を返す純粋関数を作成してください
 */
// TODO: getStringLength関数を実装してください
const getStringLength = (str: string): number => {
  // ここに実装
};

/**
 * 問題1-3: 配列を受け取り、その最大値を返す純粋関数を作成してください
 * 空配列の場合は undefined を返してください
 */
// TODO: getMaxValue関数を実装してください
const getMaxValue = (numbers: number[]): number | undefined => {
  // ここに実装
};

// ===========================================
// 問題2: 不変性の実践
// ===========================================

/**
 * 問題2-1: 配列に新しい要素を追加する不変関数を作成してください
 * 元の配列は変更せず、新しい配列を返してください
 */
// TODO: addElement関数を実装してください
const addElement = <T>(arr: T[], element: T): T[] => {
  // ここに実装
};

/**
 * 問題2-2: オブジェクトの特定のプロパティを更新する不変関数を作成してください
 * 元のオブジェクトは変更せず、新しいオブジェクトを返してください
 */
type Person = {
  name: string;
  age: number;
  email: string;
};

// TODO: updatePersonAge関数を実装してください
const updatePersonAge = (person: Person, newAge: number): Person => {
  // ここに実装
};

/**
 * 問題2-3: 配列から特定の要素を削除する不変関数を作成してください
 */
// TODO: removeElement関数を実装してください
const removeElement = <T>(arr: T[], elementToRemove: T): T[] => {
  // ここに実装
};

// ===========================================
// 問題3: 高階関数の活用
// ===========================================

/**
 * 問題3-1: 数値の配列を受け取り、すべての値を2倍にして返してください
 */
// TODO: mapを使って実装してください
const numbers = [1, 2, 3, 4, 5];
//  ここに実装

/**
 * 問題3-2: 人物の配列から、年齢が18歳以上の人だけを抽出してください
 */
// TODO: filterを使って実装してください
const people: Person[] = [
  { name: "太郎", age: 17, email: "taro@example.com" },
  { name: "花子", age: 22, email: "hanako@example.com" },
  { name: "次郎", age: 16, email: "jiro@example.com" },
  { name: "美子", age: 25, email: "miko@example.com" },
];
//  ここに実装

/**
 * 問題3-3: 文字列の配列を受け取り、すべての文字列を連結して返してください
 * 例: ['Hello', ' ', 'World'] → 'Hello World'
 */
// TODO: reduceを使って実装してください
const words = ["TypeScript", "は", "素晴らしい", "言語", "です"];
//  ここに実装

/**
 * 問題3-4: 商品の配列から、価格の合計を計算してください
 */
type Product = {
  name: string;
  price: number;
};

// TODO: reduceを使って実装してください
const products: Product[] = [
  { name: "ノートPC", price: 80000 },
  { name: "キーボード", price: 5000 },
  { name: "マウス", price: 2000 },
  { name: "モニター", price: 30000 },
];
//  ここに実装

// ===========================================
// 問題4: 関数を返す関数
// ===========================================

/**
 * 問題4-1: 特定の数で割り切れるかどうかを判定する関数を作成する
 * 関数ファクトリーを作成してください
 */
// TODO: createDivisibilityChecker関数を実装してください
const createDivisibilityChecker = (divisor: number) => {
  // ここに実装
};

// 使用例:
// const isEven = createDivisibilityChecker(2);
// const isDivisibleBy3 = createDivisibilityChecker(3);
// console.log(isEven(4)); // true
// console.log(isDivisibleBy3(9)); // true

/**
 * 問題4-2: 特定の文字で文字列を囲む関数を作成する関数ファクトリーを作成してください
 */
// TODO: createWrapper関数を実装してください
const createWrapper = (wrapChar: string) => {
  // ここに実装
};

// 使用例:
// const wrapWithQuotes = createWrapper('"');
// const wrapWithParens = createWrapper('()');
// console.log(wrapWithQuotes('Hello')); // '"Hello"'
// console.log(wrapWithParens('World')); // '(World)'

/**
 * 問題4-3: 配列の要素を特定の条件でフィルタリングする関数を作成する
 * 関数ファクトリーを作成してください
 */
// TODO: createFilter関数を実装してください
const createFilter = <T>(predicate: (item: T) => boolean) => {
  // ここに実装
};

// 使用例:
// const filterEvenNumbers = createFilter((n: number) => n % 2 === 0);
// const filterLongStrings = createFilter((s: string) => s.length > 5);
// console.log(filterEvenNumbers([1, 2, 3, 4, 5, 6])); // [2, 4, 6]

// ===========================================
// 問題5: 実践的な組み合わせ
// ===========================================

/**
 * 問題5-1: 学生の成績データを処理する関数を作成してください
 * 以下の要件を満たしてください：
 * 1. 合格点（60点）以上の学生のみを抽出
 * 2. 各学生の成績に10点のボーナスを追加
 * 3. 学生の名前のリストを作成
 */
type Student = {
  name: string;
  score: number;
};

const students: Student[] = [
  { name: "田中", score: 85 },
  { name: "佐藤", score: 45 },
  { name: "鈴木", score: 72 },
  { name: "高橋", score: 58 },
  { name: "山田", score: 90 },
];

// 1. 合格点以上の学生を抽出
// ここに実装

// 2. ボーナス点を追加した学生データを作成
// ここに実装

// 3. 学生の名前のリストを作成
// ここに実装

/**
 * 問題5-2: ECサイトの注文データを処理する関数を作成してください
 * 以下の要件を満たしてください：
 * 1. 配送済みの注文のみを抽出
 * 2. 各注文の合計金額を計算
 * 3. 全注文の合計売上を計算
 */
type Order = {
  id: string;
  items: Product[];
  status: "pending" | "shipped" | "delivered";
};

const orders: Order[] = [
  {
    id: "order-1",
    items: [
      { name: "ノートPC", price: 80000 },
      { name: "マウス", price: 2000 },
    ],
    status: "delivered",
  },
  {
    id: "order-2",
    items: [{ name: "キーボード", price: 5000 }],
    status: "pending",
  },
  {
    id: "order-3",
    items: [
      { name: "モニター", price: 30000 },
      { name: "キーボード", price: 5000 },
      { name: "マウス", price: 2000 },
    ],
    status: "shipped",
  },
];

// 1. 配送済みの注文を抽出
const deliveredOrders = orders.filter(
  (order: Order) => order.status === "delivered"
);

// 2. 各注文の合計金額を計算する関数
const calculateOrderTotal = (order: Order): number => {
  return order.items.reduce(
    (acc: number, item: Product) => acc + item.price,
    0
  );
};

// 3. 全注文の合計売上を計算
const totalRevenue = deliveredOrders
  .map(calculateOrderTotal)
  .reduce((acc: number, total: number) => acc + total, 0);
