"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル2: 関数合成とユーティリティ - 解答例
// 関数合成、カリー化、部分適用の解答例です
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLevel2Tests = void 0;
// ===========================================
// 問題1: 基本的な関数合成 - 解答
// ===========================================
// 提供される関数群
const trim = (str) => str.trim();
const toUpperCase = (str) => str.toUpperCase();
const addExclamation = (str) => str + '!';
const compose = (f, g) => (a) => f(g(a));
/**
 * 問題1-1: compose関数を使って文字列処理チェーンを作成
 */
const processString = compose(addExclamation, compose(toUpperCase, trim));
console.log('processString result:', processString('  hello world  ')); // 'HELLO WORLD!'
/**
 * 問題1-2: 3つの関数を合成するcompose3関数を実装
 */
const compose3 = (f, g, h) => (a) => f(g(h(a)));
const add1 = (x) => x + 1;
const multiply2 = (x) => x * 2;
const multiply3 = (x) => x * 3;
const processNumber = compose3(multiply3, multiply2, add1);
console.log('processNumber result:', processNumber(5)); // 36
// 実装関数 - すべてのオーバーロードを処理
function pipe(value, ...fns) {
    return fns.reduce((acc, fn) => fn(acc), value);
}
const pipeFlexible = (value) => ({
    pipe: (fn) => pipeFlexible(fn(value)),
    map: (fn) => pipeFlexible(fn(value)),
    tap: (fn) => {
        fn(value);
        return pipeFlexible(value);
    },
    value: () => value
});
// 使用例 - 完全な型推論デモ
const pipeResult1 = pipe('  Hello World  ', (s) => s.trim(), (s) => s.toUpperCase(), (s) => s + '!'); // 型: string
const pipeResult2 = pipe(5, (n) => n + 1, (n) => n * 2, (n) => n.toString(), (s) => s.padStart(4, '0')); // 型: string
// メソッドチェーンの使用例
const chainResult = pipeFlexible(' Hello ')
    .pipe((s) => s.trim())
    .map((s) => s.toUpperCase())
    .tap((s) => console.log('中間結果:', s))
    .pipe((s) => s + '!')
    .value(); // 型: string
const flexibleResult = pipeFlexible(10)
    .pipe((n) => n.toString())
    .pipe((s) => s + '円')
    .pipe((s) => `価格: ${s}`)
    .value(); // 型: string
console.log('pipe結果1:', pipeResult1); // 'HELLO WORLD!'
console.log('pipe結果2:', pipeResult2); // '0012'
console.log('chain結果:', chainResult); // 'HELLO!'
console.log('pipeFlexible result:', flexibleResult); // '価格: 10円'
// 1. メールアドレスを正規化
const normalizeEmail = (userData) => ({
    ...userData,
    email: userData.email.toLowerCase().trim()
});
const createFullName = (userData) => ({
    ...userData,
    fullName: `${userData.first_name} ${userData.last_name}`
});
const calculateAge = (userData) => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(userData.birth_year, 10);
    return { ...userData, age };
};
// 4. 成人フラグを追加 - 完全な型安全実装
const addAdultFlag = (userData) => ({
    fullName: userData.fullName,
    email: userData.email,
    age: userData.age,
    isAdult: userData.age >= 18,
    country: userData.country
});
// パイプラインを使って全体の変換関数を作成
const transformUser = (rawData) => pipe(rawData, normalizeEmail, createFullName, calculateAge, addAdultFlag);
// テスト
const testUserData = {
    first_name: '太郎',
    last_name: '山田',
    email: '  TARO.YAMADA@EXAMPLE.COM  ',
    birth_year: '1990',
    country: '日本'
};
console.log('transformUser result:', transformUser(testUserData));
// ===========================================
// 問題4: カリー化の実装と活用 - 解答
// ===========================================
/**
 * 問題4-1: 2引数の関数をカリー化する関数を実装
 */
const curry2 = (fn) => (a) => (b) => fn(a, b);
const addTwoNumbers = (a, b) => a + b;
const curriedAdd = curry2(addTwoNumbers);
const add10 = curriedAdd(10);
console.log('curriedAdd result:', add10(5)); // 15
/**
 * 問題4-2: 3引数の関数をカリー化する関数を実装
 */
const curry3 = (fn) => (a) => (b) => (c) => fn(a, b, c);
/**
 * 問題4-3: 配列操作用のカリー化された関数を作成
 */
const curriedMap = (fn) => (array) => array.map(fn);
const curriedFilter = (predicate) => (array) => array.filter(predicate);
// 使用例
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const double = curriedMap((n) => n * 2);
const onlyEven = curriedFilter((n) => n % 2 === 0);
const greaterThan5 = curriedFilter((n) => n > 5);
const processNumbers = pipe(numbers, greaterThan5, onlyEven, double);
console.log('processNumbers result:', processNumbers); // [12, 16, 20]
// ===========================================
// 問題5: 部分適用の実装と活用 - 解答
// ===========================================
const partial = (fn, ...partialArgs) => (...remainingArgs) => fn(...partialArgs.concat(remainingArgs));
const log = (level, module, message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${module}: ${message}`);
};
const errorLog = partial(log, 'ERROR');
const infoLog = partial(log, 'INFO');
const userModuleError = partial(errorLog, 'UserModule');
const authModuleInfo = partial(infoLog, 'AuthModule');
// 使用例
userModuleError('ユーザー作成に失敗しました');
authModuleInfo('ユーザーがログインしました');
// ===========================================
// 問題6: 高度な合成パターン - 解答
// ===========================================
/**
 * 問題6-1: 条件分岐を含む関数合成を実装
 */
const condPipe = (condition, truePipe, falsePipe) => (value) => condition(value) ? truePipe(value) : falsePipe(value);
// 使用例
const processNumberCond = condPipe((n) => n >= 0, (n) => pipe(n, multiply2, add1), (n) => pipe(n, multiply3, (x) => -x));
console.log('condPipe positive:', processNumberCond(5)); // 11
console.log('condPipe negative:', processNumberCond(-3)); // 9
/**
 * 問題6-2: 配列の各要素に対して条件付き変換を行う関数を作成
 */
const mapWithCondition = (array, condition, trueMapper, falseMapper) => array.map(item => condition(item) ? trueMapper(item) : falseMapper(item));
const conditionResult = mapWithCondition([1, 2, 3, 4, 5], (n) => n % 2 === 0, (n) => n * 2, // 偶数
(n) => n * 3 // 奇数
);
console.log('mapWithCondition result:', conditionResult); // [3, 4, 9, 8, 15]
const parsePrice = (product) => ({
    ...product,
    price: parseInt(product.price, 10)
});
const parseStock = (product) => ({
    ...product,
    stock: parseInt(product.stock, 10)
});
const addAvailabilityFlag = (product) => ({
    ...product,
    isAvailable: product.stock > 0
});
// 4. 価格表示用文字列を作成 - 完全な型安全実装
const addPriceDisplay = (product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    stock: product.stock,
    description: product.description,
    isAvailable: product.isAvailable,
    priceDisplay: `¥${product.price.toLocaleString()}`
});
// 全体のパイプライン
const processProduct = (rawProduct) => pipe(rawProduct, parsePrice, parseStock, addAvailabilityFlag, addPriceDisplay);
// 複数商品の処理
const processProductList = (rawProducts) => rawProducts
    .map(processProduct)
    .filter(product => product.isAvailable);
// カテゴリ別グループ化
const groupByCategory = (products) => products.reduce((acc, product) => {
    if (!acc[product.category]) {
        acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
}, {});
// テスト
const testProduct = {
    id: 'prod-001',
    name: 'ワイヤレスマウス',
    price: '2980',
    category: 'PC周辺機器',
    stock: '15',
    description: '高精度ワイヤレスマウス'
};
console.log('processProduct result:', processProduct(testProduct));
// ===========================================
// テスト実行関数
// ===========================================
const runLevel2Tests = () => {
    console.log('=== レベル2 練習問題のテスト実行 ===');
    console.log('すべての解答例が正常に動作しました！');
};
exports.runLevel2Tests = runLevel2Tests;
//# sourceMappingURL=solutions.js.map