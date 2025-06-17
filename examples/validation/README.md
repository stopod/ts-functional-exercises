# バリデーションシステム

## 概要

実際のWebアプリケーションで使用できる、型安全で再利用可能なバリデーションシステムです。関数型プログラミングの原則に基づき、Either型を使用した堅牢なエラーハンドリングを実装しています。

**ファイル**: `validation-system.ts` (658行の企業レベル実装)

## 主な機能
- **スキーマベースバリデーション**: 複雑なオブジェクト構造に対応
- **カスタムルール**: ビジネスロジックに特化したバリデーション
- **非同期バリデーション**: データベースチェックやAPI呼び出し
- **エラー集約**: 複数のエラーを適切に収集・表示
- **国際化対応**: 多言語エラーメッセージ

## 使用例

### 基本的なフォームバリデーション
```typescript
import { v, isRight, isLeft } from './validation-system';

// Fluent API を使用したバリデーションスキーマ
const userValidator = v.object({
  name: v.string().min(2).max(50),
  email: v.string().email(),
  age: v.number().min(18).max(120),
  password: v.string().min(8).pattern(/[A-Z]/).pattern(/[0-9]/)
});

const formData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  password: 'SecurePass123'
};

const result = userValidator.validate(formData);

if (isRight(result)) {
  console.log('バリデーション成功:', result.right);
} else {
  console.error('バリデーションエラー:', result.left);
  // エラー詳細: [{ field: 'email', message: 'Invalid email format' }]
}
```

### 非同期バリデーション
```typescript
// データベースチェックを含む非同期バリデーション
const registrationValidator = v.object({
  username: v.string().min(3).asyncCustom(async (username) => {
    const exists = await checkUsernameExists(username);
    return exists ? left('ユーザー名は既に使用されています') : right(username);
  }),
  email: v.string().email().asyncCustom(async (email) => {
    const exists = await checkEmailExists(email);
    return exists ? left('メールアドレスは既に登録されています') : right(email);
  })
});

// 非同期バリデーションの実行
const asyncResult = await registrationValidator.validateAsync(userData);
```

### 配列とネストしたオブジェクトの検証
```typescript
// 複雑なデータ構造のバリデーション
const orderValidator = v.object({
  customerId: v.string().uuid(),
  items: v.array(v.object({
    productId: v.string(),
    quantity: v.number().min(1),
    price: v.number().min(0)
  })).min(1), // 最低1つのアイテムが必要
  shipping: v.object({
    address: v.string().min(10),
    city: v.string(),
    postalCode: v.string().pattern(/^\d{3}-\d{4}$/)
  }),
  total: v.number().min(0)
});
```

### カスタムバリデーションルール
```typescript
// ビジネスロジック固有のバリデーション
const businessValidator = v.object({
  businessId: v.string().custom((value) => {
    // 日本の法人番号チェック
    const regex = /^\d{13}$/;
    return regex.test(value) 
      ? right(value) 
      : left('正しい法人番号を入力してください');
  }),
  establishedDate: v.date().custom((date) => {
    const today = new Date();
    const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    
    return date >= hundredYearsAgo && date <= today
      ? right(date)
      : left('設立日は過去100年以内の日付である必要があります');
  })
});
```

### 条件付きバリデーション
```typescript
// 他のフィールドの値に応じたバリデーション
const conditionalValidator = v.object({
  accountType: v.string().oneOf(['personal', 'business']),
  taxId: v.string().when('accountType', {
    is: 'business',
    then: v.string().required().pattern(/^\d{2}-\d{7}$/),
    otherwise: v.string().optional()
  }),
  companyName: v.string().when('accountType', {
    is: 'business', 
    then: v.string().required().min(2),
    otherwise: v.string().optional()
  })
});
```

## API リファレンス

### 基本バリデーター

#### 文字列バリデーション
```typescript
v.string()
  .min(5)                    // 最小長
  .max(100)                  // 最大長
  .email()                   // メールアドレス形式
  .url()                     // URL形式
  .uuid()                    // UUID形式
  .pattern(/^[A-Z]+$/)       // 正規表現パターン
  .oneOf(['red', 'blue'])    // 許可値リスト
  .required()                // 必須
  .optional()                // オプション
```

#### 数値バリデーション
```typescript
v.number()
  .min(0)                    // 最小値
  .max(100)                  // 最大値
  .integer()                 // 整数のみ
  .positive()                // 正の数
  .negative()                // 負の数
```

#### 日付バリデーション
```typescript
v.date()
  .min(new Date('2020-01-01'))  // 最小日付
  .max(new Date())              // 最大日付
  .isBefore(someDate)           // 指定日より前
  .isAfter(someDate)            // 指定日より後
```

#### 配列バリデーション
```typescript
v.array(v.string())
  .min(1)                    // 最小要素数
  .max(10)                   // 最大要素数
  .unique()                  // 重複なし
```

#### オブジェクトバリデーション
```typescript
v.object({
  name: v.string(),
  age: v.number()
})
  .strict()                  // 未定義フィールドを許可しない
  .allowUnknown()            // 未定義フィールドを許可
```

### エラーハンドリング

```typescript
const result = validator.validate(data);

if (isLeft(result)) {
  result.left.forEach(error => {
    console.log(`フィールド「${error.field}」: ${error.message}`);
    
    // エラーの詳細情報
    if (error.code === 'STRING_TOO_SHORT') {
      console.log(`最小長: ${error.constraint}`);
    }
  });
}
```

### 国際化対応

```typescript
// カスタムメッセージの設定
const validator = v.string().min(5).message({
  ja: '5文字以上で入力してください',
  en: 'Must be at least 5 characters',
  zh: '请输入至少5个字符'
});

// 言語設定
validator.setLocale('ja');
```

## パフォーマンスのヒント

1. **早期リターン**: `failFast()` オプションで最初のエラーで停止
2. **非同期最適化**: 並列実行可能な非同期バリデーションは `Promise.all` を使用
3. **キャッシュ**: 重い処理（正規表現など）は結果をキャッシュ
4. **部分バリデーション**: 必要な部分のみを検証する `partial()` オプション

## 実装されている機能

### バリデーターチェーン
- ✅ 文字列、数値、日付、配列、オブジェクト、ブール値
- ✅ ネストしたオブジェクトと配列の検証
- ✅ 条件付きバリデーション
- ✅ カスタムルール
- ✅ 非同期バリデーション

### エラーハンドリング
- ✅ 詳細なエラー情報（フィールド、メッセージ、コード）
- ✅ エラー集約とバッチ処理
- ✅ 国際化対応メッセージ
- ✅ カスタムエラーメッセージ

### パフォーマンス機能
- ✅ 早期リターン（fail-fast）
- ✅ 非同期バリデーションの並列実行
- ✅ 結果キャッシュ
- ✅ 部分バリデーション

### 開発者体験
- ✅ TypeScript型推論の完全サポート
- ✅ Fluent API による直感的な記述
- ✅ 豊富なテストケース
- ✅ 詳細なエラーメッセージ

## ファイル構成

```
examples/validation/
├── README.md                  # このファイル
├── validation-system.ts       # メインバリデーションエンジン (658行)
└── examples.ts               # 使用例とテストケース
```

## 次のステップ

1. `validation-system.ts` でメイン実装を確認
2. `examples.ts` で実際の使用例を参照  
3. 自分のプロジェクトに統合してカスタマイズ

このバリデーションシステムは、Webフォーム、API入力検証、設定ファイル検証など、様々な用途で活用できる企業レベルの実装です。