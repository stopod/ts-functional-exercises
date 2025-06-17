"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// バリデーションシステム使用例
// 実際のWebアプリケーションでの具体的な使用方法を示します
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationErrors = formatValidationErrors;
exports.groupErrorsByField = groupErrorsByField;
exports.mapValidationResult = mapValidationResult;
exports.runValidationExamples = runValidationExamples;
const validation_system_1 = require("./validation-system");
// ユーザー登録フォームのバリデータ
const userRegistrationValidator = validation_system_1.v.object({
    username: validation_system_1.v.string()
        .minLength(3)
        .maxLength(20)
        .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .build(),
    email: validation_system_1.v.string()
        .email()
        .build(),
    password: validation_system_1.v.string()
        .minLength(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
        .build(),
    confirmPassword: validation_system_1.v.string().build(),
    age: validation_system_1.v.number()
        .integer()
        .min(13)
        .max(120)
        .build(),
    agreeToTerms: validation_system_1.v.boolean()
        .custom((value) => value ? null : {
        field: 'agreeToTerms',
        message: 'You must agree to terms and conditions',
        code: 'TERMS_NOT_AGREED'
    })
        .build()
}).build();
// パスワード確認のカスタムバリデーション
const validatePasswordConfirmation = (formData) => {
    const baseResult = userRegistrationValidator.validate(formData);
    if ((0, validation_system_1.isLeft)(baseResult))
        return baseResult;
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
if ((0, validation_system_1.isRight)(formValidationResult)) {
    console.log('✅ Form validation passed:', formValidationResult.right);
}
else {
    console.log('❌ Form validation failed:', formValidationResult.left);
}
// 商品作成リクエストのバリデータ
const createProductValidator = validation_system_1.v.object({
    name: validation_system_1.v.string()
        .notEmpty()
        .minLength(2)
        .maxLength(100)
        .build(),
    description: validation_system_1.v.optional(validation_system_1.v.string()
        .maxLength(1000)
        .build()).build(),
    price: validation_system_1.v.number()
        .positive()
        .custom((price) => price > 1000000 ? {
        field: 'price',
        message: 'Price cannot exceed 1,000,000',
        code: 'PRICE_TOO_HIGH'
    } : null)
        .build(),
    category: validation_system_1.v.string()
        .custom((category) => {
        const validCategories = ['electronics', 'clothing', 'books', 'home', 'sports'];
        return validCategories.includes(category) ? null : {
            field: 'category',
            message: `Category must be one of: ${validCategories.join(', ')}`,
            code: 'INVALID_CATEGORY'
        };
    })
        .build(),
    tags: validation_system_1.v.array(validation_system_1.v.string()
        .notEmpty()
        .build()).build(),
    specifications: validation_system_1.v.object({}).build() // 任意のオブジェクト
}).build();
// API ハンドラーでの使用例
function handleCreateProduct(requestBody) {
    const validationResult = createProductValidator.validate(requestBody);
    if ((0, validation_system_1.isLeft)(validationResult)) {
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
// 設定ファイルのバリデータ
const appConfigValidator = validation_system_1.v.object({
    database: validation_system_1.v.object({
        host: validation_system_1.v.string().notEmpty().build(),
        port: validation_system_1.v.number().integer().min(1).max(65535).build(),
        username: validation_system_1.v.string().notEmpty().build(),
        password: validation_system_1.v.string().minLength(8).build(),
        database: validation_system_1.v.string().notEmpty().build(),
        ssl: validation_system_1.v.boolean().build()
    }).build(),
    server: validation_system_1.v.object({
        port: validation_system_1.v.number().integer().min(1000).max(65535).build(),
        host: validation_system_1.v.string().notEmpty().build(),
        cors: validation_system_1.v.object({
            origins: validation_system_1.v.array(validation_system_1.v.string().notEmpty().build()).build(),
            credentials: validation_system_1.v.boolean().build()
        }).build()
    }).build(),
    features: validation_system_1.v.object({
        enableLogging: validation_system_1.v.boolean().build(),
        logLevel: validation_system_1.v.string()
            .custom((level) => {
            const validLevels = ['debug', 'info', 'warn', 'error'];
            return validLevels.includes(level) ? null : {
                field: 'logLevel',
                message: `Log level must be one of: ${validLevels.join(', ')}`,
                code: 'INVALID_LOG_LEVEL'
            };
        })
            .build(),
        enableMetrics: validation_system_1.v.boolean().build()
    }).build(),
    external: validation_system_1.v.object({
        apiKeys: validation_system_1.v.object({}).build(), // Record<string, string> として扱う
        webhookUrls: validation_system_1.v.array(validation_system_1.v.string().build()).build()
    }).build()
}).build();
// 設定ファイル読み込み時の使用例
function loadConfig(configData) {
    const validationResult = appConfigValidator.validate(configData);
    if ((0, validation_system_1.isLeft)(validationResult)) {
        const errorMessages = validationResult.left.map(err => `${err.field}: ${err.message}`).join('\n');
        throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }
    return validationResult.right;
}
// 注文データのバリデータ
const orderValidator = validation_system_1.v.object({
    id: validation_system_1.v.string()
        .pattern(/^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}$/, 'Invalid order ID format')
        .build(),
    customer: validation_system_1.v.object({
        id: validation_system_1.v.string().notEmpty().build(),
        name: validation_system_1.v.string().notEmpty().minLength(2).build(),
        email: validation_system_1.v.string().email().build(),
        address: validation_system_1.v.object({
            street: validation_system_1.v.string().notEmpty().build(),
            city: validation_system_1.v.string().notEmpty().build(),
            zipCode: validation_system_1.v.string().pattern(/^\d{5}(-\d{4})?$/, 'Invalid zip code').build(),
            country: validation_system_1.v.string().minLength(2).maxLength(2).build()
        }).build()
    }).build(),
    items: validation_system_1.v.array(validation_system_1.v.object({
        productId: validation_system_1.v.string().notEmpty().build(),
        quantity: validation_system_1.v.number().integer().positive().build(),
        price: validation_system_1.v.number().positive().build(),
        discounts: validation_system_1.v.optional(validation_system_1.v.array(validation_system_1.v.object({
            type: validation_system_1.v.string()
                .custom((type) => ['percentage', 'fixed'].includes(type) ? null : {
                field: 'type',
                message: 'Discount type must be "percentage" or "fixed"',
                code: 'INVALID_DISCOUNT_TYPE'
            })
                .build(),
            value: validation_system_1.v.number().positive().build()
        }).build()).build()).build()
    }).build()).build(),
    payment: validation_system_1.v.object({
        method: validation_system_1.v.string()
            .custom((method) => {
            const validMethods = ['credit_card', 'paypal', 'bank_transfer'];
            return validMethods.includes(method) ? null : {
                field: 'method',
                message: `Payment method must be one of: ${validMethods.join(', ')}`,
                code: 'INVALID_PAYMENT_METHOD'
            };
        })
            .build(),
        amount: validation_system_1.v.number().positive().build(),
        currency: validation_system_1.v.string().minLength(3).maxLength(3).build(),
        status: validation_system_1.v.string()
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
    metadata: validation_system_1.v.optional(validation_system_1.v.object({}).build()).build()
}).build();
// ===========================================
// 5. バリデーション結果の処理ユーティリティ
// ===========================================
// エラーメッセージの整形
function formatValidationErrors(errors) {
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
function groupErrorsByField(errors) {
    return errors.reduce((acc, error) => {
        const field = error.field;
        if (!acc[field]) {
            acc[field] = [];
        }
        acc[field].push(error);
        return acc;
    }, {});
}
// バリデーション結果のマッピング
function mapValidationResult(result, mapper) {
    return (0, validation_system_1.isRight)(result)
        ? { _tag: 'Right', right: mapper(result.right) }
        : result;
}
// ===========================================
// 使用例のテスト実行
// ===========================================
function runValidationExamples() {
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
    if ((0, validation_system_1.isLeft)(formResult)) {
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
//# sourceMappingURL=examples.js.map