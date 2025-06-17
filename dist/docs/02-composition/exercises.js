"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル2: 関数合成とユーティリティ - 練習問題
// 関数合成、カリー化、部分適用の理解を深めましょう
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLevel2Tests = void 0;
// ===========================================
// 問題1: 基本的な関数合成
// ===========================================
/**
 * 問題1-1: compose関数を使って文字列処理チェーンを作成してください
 * 以下の関数を組み合わせて、文字列を「トリム → 大文字化 → 感嘆符追加」の順で処理する関数を作成
 */
// 提供される関数群
const trim = (str) => str.trim();
const toUpperCase = (str) => str.toUpperCase();
const addExclamation = (str) => str + '!';
// compose関数（すでに実装済み）
const compose = (f, g) => (a) => f(g(a));
// TODO: composeを使って文字列処理関数を作成してください
// const processString = compose(/* ここに実装 */);
// テスト用
// console.log(processString('  hello world  ')); // 'HELLO WORLD!' になるはず
/**
 * 問題1-2: 3つの関数を合成するcompose3関数を実装してください
 */
// TODO: compose3関数を実装してください
// const compose3 = <A, B, C, D>(
//   f: (c: C) => D,
//   g: (b: B) => C,
//   h: (a: A) => B
// ) => (a: A): D => {
//   // ここに実装
// };
// 使用例：数値を「+1 → ×2 → ×3」の順で処理
const add1 = (x) => x + 1;
const multiply2 = (x) => x * 2;
const multiply3 = (x) => x * 3;
// TODO: 以下の変換関数を実装してください
// 1. メールアドレスを正規化（小文字化、トリム）
// const normalizeEmail = (userData: RawUserData): RawUserData => {
//   // ここに実装
// };
// 2. 姓名を結合してfullNameを作成
// const createFullName = (userData: RawUserData): RawUserData & { fullName: string } => {
//   // ここに実装
// };
// 3. 生年から年齢を計算
// const calculateAge = (userData: RawUserData & { fullName: string }): RawUserData & { fullName: string; age: number } => {
//   const currentYear = new Date().getFullYear();
//   // ここに実装
// };
// 4. 成人フラグを追加
// const addAdultFlag = (userData: RawUserData & { fullName: string; age: number }): ProcessedUser => {
//   // ここに実装
// };
// TODO: パイプラインを使って全体の変換関数を作成
// const transformUser = (rawData: RawUserData): ProcessedUser => 
//   pipe(
//     // ここに変換関数を順番に並べてください
//   )(rawData);
// テストデータ
const testUserData = {
    first_name: '太郎',
    last_name: '山田',
    email: '  TARO.YAMADA@EXAMPLE.COM  ',
    birth_year: '1990',
    country: '日本'
};
// console.log(transformUser(testUserData));
// ===========================================
// 問題4: カリー化の実装と活用
// ===========================================
/**
 * 問題4-1: 基本的なカリー化関数を実装してください
 */
// TODO: 2引数の関数をカリー化する関数を実装
// const curry2 = <A, B, C>(fn: (a: A, b: B) => C) => 
//   (a: A) => (b: B): C => {
//     // ここに実装
//   };
// 使用例
const addTwoNumbers = (a, b) => a + b;
// const curriedAdd = curry2(addTwoNumbers);
// const add10 = curriedAdd(10);
// console.log(add10(5)); // 15 になるはず
/**
 * 問題4-2: 3引数の関数をカリー化する関数を実装してください
 */
// TODO: curry3関数を実装
// const curry3 = <A, B, C, D>(fn: (a: A, b: B, c: C) => D) => 
//   (a: A) => (b: B) => (c: C): D => {
//     // ここに実装
//   };
/**
 * 問題4-3: 配列操作用のカリー化された関数を作成してください
 */
// TODO: カリー化されたmap関数を実装
// const curriedMap = <T, U>(fn: (item: T) => U) => 
//   (array: T[]): U[] => {
//     // ここに実装
//   };
// TODO: カリー化されたfilter関数を実装
// const curriedFilter = <T>(predicate: (item: T) => boolean) => 
//   (array: T[]): T[] => {
//     // ここに実装
//   };
// 使用例：
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const log = (level, module, message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${module}: ${message}`);
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
const testProduct = {
    id: 'prod-001',
    name: 'ワイヤレスマウス',
    price: '2980',
    category: 'PC周辺機器',
    stock: '15',
    description: '高精度ワイヤレスマウス'
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
const testProducts = [
    {
        id: 'prod-001',
        name: 'ワイヤレスマウス',
        price: '2980',
        category: 'PC周辺機器',
        stock: '15',
        description: '高精度ワイヤレスマウス'
    },
    {
        id: 'prod-002',
        name: 'キーボード',
        price: '8900',
        category: 'PC周辺機器',
        stock: '0',
        description: 'メカニカルキーボード'
    },
    {
        id: 'prod-003',
        name: 'ノートPC',
        price: '89800',
        category: 'PC本体',
        stock: '3',
        description: '軽量ノートPC'
    }
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
const runLevel2Tests = () => {
    console.log('=== レベル2 練習問題のテスト ===');
    console.log('solutions.ts を確認して、実装を確認してください');
};
exports.runLevel2Tests = runLevel2Tests;
//# sourceMappingURL=exercises.js.map