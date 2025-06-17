# レベル1: 関数型プログラミングの基礎概念

## 目標
このレベルでは、関数型プログラミングの基本的な概念を学び、実際にTypeScriptで実装できるようになります。

## 学習内容

### 1. 純粋関数（Pure Functions）

**純粋関数とは何か？**
純粋関数は以下の条件を満たす関数です：
1. 同じ入力に対して常に同じ出力を返す
2. 副作用を発生させない（外部の状態を変更しない）

```typescript
// ✅ 純粋関数の例
const add = (a: number, b: number): number => a + b;

const multiply = (x: number): number => x * 2;

// ❌ 純粋ではない関数の例
let counter = 0;
const impureIncrement = (): number => {
  counter++; // 外部の状態を変更（副作用）
  return counter;
};

const randomNumber = (): number => Math.random(); // 毎回異なる値を返す
```

**純粋関数の利点：**
- テストしやすい
- デバッグしやすい
- 並行処理で安全
- キャッシュ可能

### 2. 不変性（Immutability）

**不変性とは？**
一度作られたデータを変更せず、新しいデータを作成するアプローチです。

```typescript
// ❌ 可変的なアプローチ
const numbers = [1, 2, 3];
numbers.push(4); // 元の配列を変更
console.log(numbers); // [1, 2, 3, 4]

// ✅ 不変的なアプローチ
const originalNumbers = [1, 2, 3];
const newNumbers = [...originalNumbers, 4]; // 新しい配列を作成
console.log(originalNumbers); // [1, 2, 3] - 元の配列は変更されない
console.log(newNumbers); // [1, 2, 3, 4]
```

**オブジェクトの場合：**
```typescript
// ❌ 可変的なアプローチ
const person = { name: '太郎', age: 25 };
person.age = 26; // 元のオブジェクトを変更

// ✅ 不変的なアプローチ
const originalPerson = { name: '太郎', age: 25 };
const updatedPerson = { ...originalPerson, age: 26 }; // 新しいオブジェクトを作成
```

### 3. 高階関数の復習と応用

すでにご存知のmap、filter、reduceを復習し、より高度な使い方を学びます。

**map - データの変換**
```typescript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// オブジェクトの配列での使用例
const users = [
  { name: '太郎', age: 25 },
  { name: '花子', age: 30 }
];
const userNames = users.map(user => user.name);
console.log(userNames); // ['太郎', '花子']
```

**filter - データの絞り込み**
```typescript
const numbers = [1, 2, 3, 4, 5, 6];
const evenNumbers = numbers.filter(n => n % 2 === 0);
console.log(evenNumbers); // [2, 4, 6]

// より複雑な条件での絞り込み
const adults = users.filter(user => user.age >= 20);
```

**reduce - データの集約**
```typescript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log(sum); // 15

// オブジェクトの作成
const fruits = ['apple', 'banana', 'apple', 'cherry', 'banana'];
const fruitCount = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log(fruitCount); // { apple: 2, banana: 2, cherry: 1 }
```

### 4. 関数を返す関数

関数型プログラミングでは、関数を返す関数も重要な概念です。

```typescript
// 乗数を作成する関数
const createMultiplier = (factor: number) => (value: number): number => value * factor;

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(4)); // 12

// より実用的な例：バリデーター作成関数
const createMinLengthValidator = (minLength: number) => 
  (text: string): boolean => text.length >= minLength;

const isValidPassword = createMinLengthValidator(8);
const isValidUsername = createMinLengthValidator(3);

console.log(isValidPassword('password123')); // true
console.log(isValidUsername('ab')); // false
```

## 次のステップ

練習問題（exercises.ts）を解いて、これらの概念を実際に使ってみましょう。解答例は solutions.ts で確認できます。

理解できたら、レベル2の関数合成に進みましょう！