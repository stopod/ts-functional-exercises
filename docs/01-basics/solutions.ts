// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル1: 基礎概念 - 解答例
// 練習問題の解答例です。まずは自分で解いてから確認してください。

// ===========================================
// 問題1: 純粋関数の作成 - 解答
// ===========================================

/**
 * 問題1-1: 2つの数値を受け取り、その合計を返す純粋関数
 */
const add = (a: number, b: number): number => a + b;

/**
 * 問題1-2: 文字列を受け取り、その文字数を返す純粋関数
 */
const getStringLength = (str: string): number => str.length;

/**
 * 問題1-3: 配列を受け取り、その最大値を返す純粋関数
 */
const getMaxValue = (numbers: number[]): number | undefined => {
  if (numbers.length === 0) return undefined;
  return Math.max(...numbers);
  
  // 別解（reduceを使用）
  // return numbers.reduce((max, current) => current > max ? current : max, numbers[0]);
};

// ===========================================
// 問題2: 不変性の実践 - 解答
// ===========================================

/**
 * 問題2-1: 配列に新しい要素を追加する不変関数
 */
const addElement = <T>(arr: T[], element: T): T[] => {
  return [...arr, element];
  
  // 別解
  // return arr.concat(element);
};

/**
 * 問題2-2: オブジェクトの特定のプロパティを更新する不変関数
 */
type Person = {
  name: string;
  age: number;
  email: string;
};

const updatePersonAge = (person: Person, newAge: number): Person => {
  return { ...person, age: newAge };
  
  // 別解（Object.assignを使用）
  // return Object.assign({}, person, { age: newAge });
};

/**
 * 問題2-3: 配列から特定の要素を削除する不変関数
 */
const removeElement = <T>(arr: T[], elementToRemove: T): T[] => {
  return arr.filter(item => item !== elementToRemove);
};

// ===========================================
// 問題3: 高階関数の活用 - 解答
// ===========================================

/**
 * 問題3-1: 数値の配列を受け取り、すべての値を2倍にして返す
 */
const numbers = [1, 2, 3, 4, 5];
const doubledNumbers = numbers.map(n => n * 2);
console.log('doubledNumbers:', doubledNumbers); // [2, 4, 6, 8, 10]

/**
 * 問題3-2: 人物の配列から、年齢が18歳以上の人だけを抽出
 */
const people: Person[] = [
  { name: '太郎', age: 17, email: 'taro@example.com' },
  { name: '花子', age: 22, email: 'hanako@example.com' },
  { name: '次郎', age: 16, email: 'jiro@example.com' },
  { name: '美子', age: 25, email: 'miko@example.com' }
];
const adults = people.filter(person => person.age >= 18);
console.log('adults:', adults);

/**
 * 問題3-3: 文字列の配列を受け取り、すべての文字列を連結して返す
 */
const words = ['TypeScript', 'は', '素晴らしい', '言語', 'です'];
const sentence = words.reduce((acc, word) => acc + word, '');
console.log('sentence:', sentence); // 'TypeScriptは素晴らしい言語です'

// より実用的な解答（スペース区切り）
const sentenceWithSpaces = words.reduce((acc, word, index) => 
  index === 0 ? word : acc + ' ' + word, '');
console.log('sentenceWithSpaces:', sentenceWithSpaces);

/**
 * 問題3-4: 商品の配列から、価格の合計を計算
 */
type Product = {
  name: string;
  price: number;
};

const products: Product[] = [
  { name: 'ノートPC', price: 80000 },
  { name: 'キーボード', price: 5000 },
  { name: 'マウス', price: 2000 },
  { name: 'モニター', price: 30000 }
];
const totalPrice = products.reduce((sum, product) => sum + product.price, 0);
console.log('totalPrice:', totalPrice); // 117000

// ===========================================
// 問題4: 関数を返す関数 - 解答
// ===========================================

/**
 * 問題4-1: 特定の数で割り切れるかどうかを判定する関数を作成する関数ファクトリー
 */
const createDivisibilityChecker = (divisor: number) => 
  (num: number): boolean => num % divisor === 0;

// 使用例
const isEven = createDivisibilityChecker(2);
const isDivisibleBy3 = createDivisibilityChecker(3);
console.log('isEven(4):', isEven(4)); // true
console.log('isDivisibleBy3(9):', isDivisibleBy3(9)); // true

/**
 * 問題4-2: 特定の文字で文字列を囲む関数を作成する関数ファクトリー
 */
const createWrapper = (wrapChar: string) => 
  (text: string): string => {
    if (wrapChar.length === 2) {
      // 開始文字と終了文字が異なる場合（例：括弧）
      return wrapChar[0] + text + wrapChar[1];
    }
    // 同じ文字で囲む場合（例：引用符）
    return wrapChar + text + wrapChar;
  };

// 使用例
const wrapWithQuotes = createWrapper('"');
const wrapWithParens = createWrapper('()');
console.log('wrapWithQuotes:', wrapWithQuotes('Hello')); // '"Hello"'
console.log('wrapWithParens:', wrapWithParens('World')); // '(World)'

/**
 * 問題4-3: 配列の要素を特定の条件でフィルタリングする関数を作成する関数ファクトリー
 */
const createFilter = <T>(predicate: (item: T) => boolean) => 
  (arr: T[]): T[] => arr.filter(predicate);

// 使用例
const filterEvenNumbers = createFilter((n: number) => n % 2 === 0);
const filterLongStrings = createFilter((s: string) => s.length > 5);
console.log('filterEvenNumbers:', filterEvenNumbers([1, 2, 3, 4, 5, 6])); // [2, 4, 6]
console.log('filterLongStrings:', filterLongStrings(['short', 'very long string', 'hi'])); // ['very long string']

// ===========================================
// 問題5: 実践的な組み合わせ - 解答
// ===========================================

/**
 * 問題5-1: 学生の成績データを処理する
 */
type Student = {
  name: string;
  score: number;
};

const students: Student[] = [
  { name: '田中', score: 85 },
  { name: '佐藤', score: 45 },
  { name: '鈴木', score: 72 },
  { name: '高橋', score: 58 },
  { name: '山田', score: 90 }
];

// 1. 合格点以上の学生を抽出
const passingStudents = students.filter(student => student.score >= 60);
console.log('passingStudents:', passingStudents);

// 2. ボーナス点を追加した学生データを作成
const studentsWithBonus = passingStudents.map(student => ({
  ...student,
  score: student.score + 10
}));
console.log('studentsWithBonus:', studentsWithBonus);

// 3. 学生の名前のリストを作成
const passingStudentNames = studentsWithBonus.map(student => student.name);
console.log('passingStudentNames:', passingStudentNames);

// 一つのチェーンで処理する場合
const passingStudentNamesChained = students
  .filter(student => student.score >= 60)
  .map(student => ({ ...student, score: student.score + 10 }))
  .map(student => student.name);
console.log('passingStudentNamesChained:', passingStudentNamesChained);

/**
 * 問題5-2: ECサイトの注文データを処理する
 */
type Order = {
  id: string;
  items: Product[];
  status: 'pending' | 'shipped' | 'delivered';
};

const orders: Order[] = [
  {
    id: 'order-1',
    items: [
      { name: 'ノートPC', price: 80000 },
      { name: 'マウス', price: 2000 }
    ],
    status: 'delivered'
  },
  {
    id: 'order-2',
    items: [
      { name: 'キーボード', price: 5000 }
    ],
    status: 'pending'
  },
  {
    id: 'order-3',
    items: [
      { name: 'モニター', price: 30000 },
      { name: 'キーボード', price: 5000 },
      { name: 'マウス', price: 2000 }
    ],
    status: 'shipped'
  }
];

// 1. 配送済みの注文を抽出
const deliveredOrders = orders.filter(order => order.status === 'delivered');
console.log('deliveredOrders:', deliveredOrders);

// 2. 各注文の合計金額を計算する関数
const calculateOrderTotal = (order: Order): number => {
  return order.items.reduce((sum, item) => sum + item.price, 0);
};

// 3. 全注文の合計売上を計算
const totalRevenue = deliveredOrders
  .map(calculateOrderTotal)
  .reduce((sum, orderTotal) => sum + orderTotal, 0);
console.log('totalRevenue:', totalRevenue);

// より関数型らしい書き方（一つのチェーンで処理）
const totalRevenueChained = orders
  .filter(order => order.status === 'delivered')
  .flatMap(order => order.items)
  .reduce((sum, item) => sum + item.price, 0);
console.log('totalRevenueChained:', totalRevenueChained);

// ===========================================
// テスト関数
// ===========================================

export const runLevel1Tests = () => {
  console.log('=== レベル1 練習問題のテスト実行 ===');
  
  // 純粋関数のテスト
  console.log('add(2, 3):', add(2, 3)); // 5
  console.log('getStringLength("Hello"):', getStringLength("Hello")); // 5
  console.log('getMaxValue([1, 5, 3]):', getMaxValue([1, 5, 3])); // 5
  console.log('getMaxValue([]):', getMaxValue([])); // undefined
  
  // 不変性のテスト
  const originalArray = [1, 2, 3];
  const newArray = addElement(originalArray, 4);
  console.log('originalArray:', originalArray); // [1, 2, 3] - 変更されない
  console.log('newArray:', newArray); // [1, 2, 3, 4]
  
  const originalPerson = { name: '太郎', age: 25, email: 'taro@example.com' };
  const updatedPerson = updatePersonAge(originalPerson, 26);
  console.log('originalPerson:', originalPerson); // age: 25 - 変更されない
  console.log('updatedPerson:', updatedPerson); // age: 26
  
  const removed = removeElement([1, 2, 3, 2, 4], 2);
  console.log('removed:', removed); // [1, 3, 4]
  
  console.log('=== すべてのテストが完了しました ===');
};

// テストを実行したい場合はコメントアウトを外してください
// runLevel1Tests();