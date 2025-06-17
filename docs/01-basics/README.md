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

**純粋関数の利点：なぜ重要なのか？**

実際のコード例で比較してみましょう：

```typescript
// ❌ 問題のあるコード（副作用あり）
let globalCounter = 0;
let globalConfig = { apiUrl: 'http://localhost:3000' };

const fetchUserData = (userId: number) => {
  globalCounter++; // 副作用：グローバル状態を変更
  console.log(`API call count: ${globalCounter}`); // 副作用：ログ出力
  return fetch(`${globalConfig.apiUrl}/users/${userId}`);
};

// 問題点：
// 1. テストが困難（globalCounterの状態に依存）
// 2. 同じuserIdでも呼び出すたびに異なる副作用が発生
// 3. 並行実行時にglobalCounterの値が予測不可能
// 4. globalConfigが変更されると動作が変わる
```

```typescript
// ✅ 純粋関数版
const createFetchUserData = (apiUrl: string, logger: (msg: string) => void) => 
  (userId: number, callCount: number) => {
    logger(`API call count: ${callCount}`);
    return fetch(`${apiUrl}/users/${userId}`);
  };

// 利点：
// 1. テストしやすい：すべての依存関係が明示的
// 2. 予測可能：同じ引数なら常に同じ結果
// 3. 並行処理で安全：外部状態を変更しない
// 4. 再利用可能：異なるAPIURLやロガーで使用可能
```

**具体的なメリット：**
- **テストしやすい**: モックやスタブを簡単に作成できる
- **デバッグしやすい**: バグの原因を特定しやすい  
- **並行処理で安全**: レースコンディションが発生しない
- **キャッシュ可能**: 同じ入力に対して結果をキャッシュできる

### 2. 不変性（Immutability）

**不変性とは？なぜ大切なのか？**

一度作られたデータを変更せず、新しいデータを作成するアプローチです。

**現実の問題を見てみましょう：**

```typescript
// ❌ 可変的なアプローチの問題
const shoppingCart = [
  { id: 1, name: 'ノートPC', price: 80000, quantity: 1 }
];

// 関数Aがカートを変更
const addDiscount = (cart: any[]) => {
  cart[0].price = cart[0].price * 0.9; // 元のオブジェクトを直接変更！
  return cart;
};

// 関数Bがカートを使用
const calculateTotal = (cart: any[]) => {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

console.log('変更前の価格:', shoppingCart[0].price); // 80000
const discountedCart = addDiscount(shoppingCart);
console.log('変更後の価格:', shoppingCart[0].price); // 72000 - 元のデータが変わってしまった！

// 問題：元のカートデータが予期せず変更されてしまい、
// 後で「割引前の価格」が必要になったときに参照できない
```

```typescript
// ✅ 不変的なアプローチの解決策
const originalCart = [
  { id: 1, name: 'ノートPC', price: 80000, quantity: 1 }
];

// 新しいオブジェクトを作成して返す
const addDiscount = (cart: any[]) => {
  return cart.map(item => ({
    ...item,  // 元のプロパティをコピー
    price: item.price * 0.9  // 価格のみ変更
  }));
};

console.log('元のカート:', originalCart[0].price); // 80000
const discountedCart = addDiscount(originalCart);
console.log('割引後カート:', discountedCart[0].price); // 72000
console.log('元のカート（変更されていない）:', originalCart[0].price); // 80000

// 利点：元のデータが保持されているため、
// 必要に応じて「割引前の価格」を参照できる
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

**なぜ高階関数が重要なのか？**

従来のループと比較して、高階関数のメリットを実感してみましょう：

```typescript
// ❌ 従来のループ（命令的プログラミング）
const processUsers = (users: any[]) => {
  const results = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.age >= 20) {  // 大人のユーザーのみ
      if (user.isActive) { // アクティブなユーザーのみ
        const processed = {
          id: user.id,
          displayName: user.name.toUpperCase(),
          category: user.age >= 65 ? 'senior' : 'adult'
        };
        results.push(processed);
      }
    }
  }
  return results;
};

// 問題点：
// 1. コードが長くて読みにくい
// 2. ロジックが混在している（フィルタリング + 変換）
// 3. バグが入りやすい（インデックス操作、条件分岐）
// 4. 再利用が困難
```

```typescript
// ✅ 高階関数を使った宣言的プログラミング
const isAdult = (user: any) => user.age >= 20;
const isActive = (user: any) => user.isActive;
const transformUser = (user: any) => ({
  id: user.id,
  displayName: user.name.toUpperCase(),
  category: user.age >= 65 ? 'senior' : 'adult'
});

const processUsers = (users: any[]) => 
  users
    .filter(isAdult)      // 大人のユーザーのみ
    .filter(isActive)     // アクティブなユーザーのみ  
    .map(transformUser);  // データ変換

// 利点：
// 1. 読みやすい：「何をしているか」が明確
// 2. 関心の分離：各関数が単一の責任を持つ
// 3. テストしやすい：各関数を個別にテスト可能
// 4. 再利用可能：isAdult、isActiveなどを他の場所でも使用可能
// 5. 組み合わせ可能：異なる順序で組み合わせ可能
```

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