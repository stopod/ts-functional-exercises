// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// バリデーションシステム使用例
// 実際のWebアプリケーションでの具体的な使用方法を示します

import { v, ValidationResult, ValidationError, isLeft, isRight } from './validation-system';

// ===========================================
// 1. 基本的なフォームバリデーション
// ===========================================

// ユーザー登録フォームの型定義
type UserRegistrationForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  agreeToTerms: boolean;
};

// ユーザー登録フォームのバリデータ
const userRegistrationValidator = v.object({
  username: v.string()
    .minLength(3)
    .maxLength(20)
    .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .build(),
  
  email: v.string()
    .email()
    .build(),
  
  password: v.string()
    .minLength(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .build(),
  
  confirmPassword: v.string().build(),
  
  age: v.number()
    .integer()
    .min(13)
    .max(120)
    .build(),
  
  agreeToTerms: v.boolean()
    .custom((value) => 
      value ? null : { 
        field: 'agreeToTerms', 
        message: 'You must agree to terms and conditions',
        code: 'TERMS_NOT_AGREED'
      }
    )
    .build()
}).build();

// パスワード確認のカスタムバリデーション
const validatePasswordConfirmation = (formData: any): ValidationResult<UserRegistrationForm> => {
  const baseResult = userRegistrationValidator.validate(formData);
  
  if (isLeft(baseResult)) return baseResult;
  
  const user = baseResult.right;
  if (user.password !== user.confirmPassword) {
    return {
      _tag: 'Left',
      left: [{
        field: 'confirmPassword',
        message: 'Passwords do not match',
        code: 'PASSWORD_MISMATCH'
      }]
    };
  }
  
  return baseResult;
};

// 使用例
const testFormData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
  age: 25,
  agreeToTerms: true
};

const formValidationResult = validatePasswordConfirmation(testFormData);

if (isRight(formValidationResult)) {
  console.log('✅ Form validation passed:', formValidationResult.right);
} else {
  console.log('❌ Form validation failed:', formValidationResult.left);
}

// ===========================================
// 2. APIリクエストのバリデーション
// ===========================================

// 商品作成APIのリクエスト型
type CreateProductRequest = {
  name: string;
  description?: string;
  price: number;
  category: string;
  tags: string[];
  specifications: Record<string, any>;
};

// 商品作成リクエストのバリデータ
const createProductValidator = v.object({
  name: v.string()
    .notEmpty()
    .minLength(2)
    .maxLength(100)
    .build(),
  
  description: v.optional(
    v.string()
      .maxLength(1000)
      .build()
  ).build(),
  
  price: v.number()
    .positive()
    .custom((price) => 
      price > 1000000 ? {
        field: 'price',
        message: 'Price cannot exceed 1,000,000',
        code: 'PRICE_TOO_HIGH'
      } : null
    )
    .build(),
  
  category: v.string()
    .custom((category) => {
      const validCategories = ['electronics', 'clothing', 'books', 'home', 'sports'];
      return validCategories.includes(category) ? null : {
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}`,
        code: 'INVALID_CATEGORY'
      };
    })
    .build(),
  
  tags: v.array(
    v.string()
      .notEmpty()
      .build()
  ).build(),
  
  specifications: v.object({}).build() // 任意のオブジェクト
}).build();

// API ハンドラーでの使用例
function handleCreateProduct(requestBody: unknown) {
  const validationResult = createProductValidator.validate(requestBody);
  
  if (isLeft(validationResult)) {
    return {
      status: 400,
      body: {
        error: 'Validation failed',
        details: validationResult.left
      }
    };
  }
  
  const product = validationResult.right;
  // 商品を作成する処理...
  
  return {
    status: 201,
    body: { message: 'Product created successfully', product }
  };
}

// ===========================================
// 3. 設定ファイルのバリデーション
// ===========================================

// アプリケーション設定の型
type AppConfig = {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
  };
  server: {
    port: number;
    host: string;
    cors: {
      origins: string[];
      credentials: boolean;
    };
  };
  features: {
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
  };
  external: {
    apiKeys: Record<string, string>;
    webhookUrls: string[];
  };
};

// 設定ファイルのバリデータ
const appConfigValidator = v.object({
  database: v.object({
    host: v.string().notEmpty().build(),
    port: v.number().integer().min(1).max(65535).build(),
    username: v.string().notEmpty().build(),
    password: v.string().minLength(8).build(),
    database: v.string().notEmpty().build(),
    ssl: v.boolean().build()
  }).build(),
  
  server: v.object({
    port: v.number().integer().min(1000).max(65535).build(),
    host: v.string().notEmpty().build(),
    cors: v.object({
      origins: v.array(v.string().notEmpty().build()).build(),
      credentials: v.boolean().build()
    }).build()
  }).build(),
  
  features: v.object({
    enableLogging: v.boolean().build(),
    logLevel: v.string()
      .custom((level) => {
        const validLevels = ['debug', 'info', 'warn', 'error'];
        return validLevels.includes(level) ? null : {
          field: 'logLevel',
          message: `Log level must be one of: ${validLevels.join(', ')}`,
          code: 'INVALID_LOG_LEVEL'
        };
      })
      .build(),
    enableMetrics: v.boolean().build()
  }).build(),
  
  external: v.object({
    apiKeys: v.object({}).build(), // Record<string, string> として扱う
    webhookUrls: v.array(v.string().build()).build()
  }).build()
}).build();

// 設定ファイル読み込み時の使用例
function loadConfig(configData: unknown): AppConfig {
  const validationResult = appConfigValidator.validate(configData);
  
  if (isLeft(validationResult)) {
    const errorMessages = validationResult.left.map(err => 
      `${err.field}: ${err.message}`
    ).join('\n');
    
    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  }
  
  return validationResult.right as AppConfig;
}

// ===========================================
// 4. 複雑なネストしたデータの検証
// ===========================================

// 注文データの型定義
type Order = {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    };
  };
  items: {
    productId: string;
    quantity: number;
    price: number;
    discounts?: {
      type: 'percentage' | 'fixed';
      value: number;
    }[];
  }[];
  payment: {
    method: 'credit_card' | 'paypal' | 'bank_transfer';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
  };
  metadata?: Record<string, any>;
};

// 注文データのバリデータ
const orderValidator = v.object({
  id: v.string()
    .pattern(/^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}$/, 'Invalid order ID format')
    .build(),
  
  customer: v.object({
    id: v.string().notEmpty().build(),
    name: v.string().notEmpty().minLength(2).build(),
    email: v.string().email().build(),
    address: v.object({
      street: v.string().notEmpty().build(),
      city: v.string().notEmpty().build(),
      zipCode: v.string().pattern(/^\d{5}(-\d{4})?$/, 'Invalid zip code').build(),
      country: v.string().minLength(2).maxLength(2).build()
    }).build()
  }).build(),
  
  items: v.array(
    v.object({
      productId: v.string().notEmpty().build(),
      quantity: v.number().integer().positive().build(),
      price: v.number().positive().build(),
      discounts: v.optional(
        v.array(
          v.object({
            type: v.string()
              .custom((type) => 
                ['percentage', 'fixed'].includes(type) ? null : {
                  field: 'type',
                  message: 'Discount type must be "percentage" or "fixed"',
                  code: 'INVALID_DISCOUNT_TYPE'
                }
              )
              .build(),
            value: v.number().positive().build()
          }).build()
        ).build()
      ).build()
    }).build()
  ).build(),
  
  payment: v.object({
    method: v.string()
      .custom((method) => {
        const validMethods = ['credit_card', 'paypal', 'bank_transfer'];
        return validMethods.includes(method) ? null : {
          field: 'method',
          message: `Payment method must be one of: ${validMethods.join(', ')}`,
          code: 'INVALID_PAYMENT_METHOD'
        };
      })
      .build(),
    amount: v.number().positive().build(),
    currency: v.string().minLength(3).maxLength(3).build(),
    status: v.string()
      .custom((status) => {
        const validStatuses = ['pending', 'completed', 'failed'];
        return validStatuses.includes(status) ? null : {
          field: 'status',
          message: `Payment status must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_PAYMENT_STATUS'
        };
      })
      .build()
  }).build(),
  
  metadata: v.optional(v.object({}).build()).build()
}).build();

// ===========================================
// 5. バリデーション結果の処理ユーティリティ
// ===========================================

// エラーメッセージの整形
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => {
    let message = `${error.field}: ${error.message}`;
    if (error.context) {
      const contextInfo = Object.entries(error.context)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      message += ` (${contextInfo})`;
    }
    return message;
  }).join('\n');
}

// フィールド別エラーグループ化
export function groupErrorsByField(errors: ValidationError[]): Record<string, ValidationError[]> {
  return errors.reduce((acc, error) => {
    const field = error.field;
    if (!acc[field]) {
      acc[field] = [];
    }
    acc[field].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);
}

// バリデーション結果のマッピング
export function mapValidationResult<T, U>(
  result: ValidationResult<T>,
  mapper: (value: T) => U
): ValidationResult<U> {
  return isRight(result) 
    ? { _tag: 'Right', right: mapper(result.right) }
    : result;
}

// ===========================================
// 使用例のテスト実行
// ===========================================

export function runValidationExamples() {
  console.log('=== バリデーション使用例のテスト ===');
  
  // フォームバリデーションのテスト
  console.log('\n1. フォームバリデーション:');
  const invalidForm = {
    username: 'a', // 短すぎる
    email: 'invalid-email',
    password: '123', // 弱い
    confirmPassword: '456', // 不一致
    age: 15, // 若すぎる
    agreeToTerms: false
  };
  
  const formResult = validatePasswordConfirmation(invalidForm);
  if (isLeft(formResult)) {
    console.log('Validation errors:');
    console.log(formatValidationErrors(formResult.left));
  }
  
  // API リクエストバリデーションのテスト
  console.log('\n2. API リクエストバリデーション:');
  const invalidProduct = {
    name: '',
    price: -100,
    category: 'invalid_category',
    tags: [],
    specifications: {}
  };
  
  const apiResult = handleCreateProduct(invalidProduct);
  console.log('API Response:', apiResult);
  
  console.log('\n=== テスト完了 ===');
}

// テスト実行（コメントアウトを外して実行）
// runValidationExamples();