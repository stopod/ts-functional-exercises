"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// バリデーションシステム - メイン実装
// 実際のWebアプリケーションで使用できる型安全で再利用可能なバリデーションライブラリ
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRight = exports.isLeft = exports.right = exports.left = exports.v = exports.createArrayValidator = exports.createObjectValidator = exports.ValidatorBuilder = exports.asyncCustom = exports.custom = exports.numberValidators = exports.stringValidators = exports.optional = exports.object = exports.array = exports.primitiveValidators = void 0;
const left = (value) => ({ _tag: 'Left', left: value });
exports.left = left;
const right = (value) => ({ _tag: 'Right', right: value });
exports.right = right;
const isLeft = (either) => either._tag === 'Left';
exports.isLeft = isLeft;
const isRight = (either) => either._tag === 'Right';
exports.isRight = isRight;
// ===========================================
// 基本バリデータの実装
// ===========================================
// プリミティブ型のバリデータ
exports.primitiveValidators = {
    string: () => ({
        name: 'string',
        validate: (value, context) => {
            if (typeof value === 'string') {
                return right(value);
            }
            return left([{
                    field: context?.field || 'root',
                    message: context?.customMessages?.string || 'Expected string',
                    code: 'TYPE_ERROR'
                }]);
        }
    }),
    number: () => ({
        name: 'number',
        validate: (value, context) => {
            if (typeof value === 'number' && !isNaN(value)) {
                return right(value);
            }
            return left([{
                    field: context?.field || 'root',
                    message: context?.customMessages?.number || 'Expected number',
                    code: 'TYPE_ERROR'
                }]);
        }
    }),
    boolean: () => ({
        name: 'boolean',
        validate: (value, context) => {
            if (typeof value === 'boolean') {
                return right(value);
            }
            return left([{
                    field: context?.field || 'root',
                    message: context?.customMessages?.boolean || 'Expected boolean',
                    code: 'TYPE_ERROR'
                }]);
        }
    }),
    date: () => ({
        name: 'date',
        validate: (value, context) => {
            if (value instanceof Date && !isNaN(value.getTime())) {
                return right(value);
            }
            // 文字列からの変換も試行
            if (typeof value === 'string') {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return right(date);
                }
            }
            return left([{
                    field: context?.field || 'root',
                    message: context?.customMessages?.date || 'Expected valid date',
                    code: 'TYPE_ERROR'
                }]);
        }
    })
};
// ===========================================
// バリデータコンビネータ
// ===========================================
// 配列バリデータ
const array = (itemValidator) => ({
    name: `array<${itemValidator.name || 'unknown'}>`,
    validate: (value, context) => {
        if (!Array.isArray(value)) {
            return left([{
                    field: context?.field || 'root',
                    message: context?.customMessages?.array || 'Expected array',
                    code: 'TYPE_ERROR'
                }]);
        }
        const results = [];
        const errors = [];
        const successes = [];
        value.forEach((item, index) => {
            const itemContext = {
                ...context,
                field: `${context?.field || 'root'}[${index}]`
            };
            const result = itemValidator.validate(item, itemContext);
            results.push(result);
            if (isLeft(result)) {
                errors.push(...result.left);
            }
            else {
                successes.push(result.right);
            }
        });
        return errors.length > 0 ? left(errors) : right(successes);
    }
});
exports.array = array;
// オブジェクトバリデータ
const object = (schema) => ({
    name: 'object',
    validate: (value, context) => {
        if (typeof value !== 'object' || value === null) {
            return left([{
                    field: context?.field || 'root',
                    message: context?.customMessages?.object || 'Expected object',
                    code: 'TYPE_ERROR'
                }]);
        }
        const obj = value;
        const errors = [];
        const result = {};
        // 必須フィールドのチェック
        for (const [key, validator] of Object.entries(schema)) {
            const fieldContext = {
                ...context,
                field: context?.field ? `${context.field}.${key}` : key,
                parentObject: obj
            };
            const fieldResult = validator.validate(obj[key], fieldContext);
            if (isLeft(fieldResult)) {
                const fieldErrors = Array.isArray(fieldResult.left) ? fieldResult.left : [fieldResult.left];
                errors.push(...fieldErrors);
            }
            else {
                result[key] = fieldResult.right;
            }
        }
        return errors.length > 0 ? left(errors) : right(result);
    }
});
exports.object = object;
// オプショナルバリデータ
const optional = (validator) => ({
    name: `optional<${validator.name || 'unknown'}>`,
    validate: (value, context) => {
        if (value === undefined || value === null) {
            return right(undefined);
        }
        return validator.validate(value, context);
    }
});
exports.optional = optional;
// ===========================================
// 文字列専用バリデータ
// ===========================================
exports.stringValidators = {
    // 最小長
    minLength: (min) => (validator) => ({
        name: `${validator.name}.minLength(${min})`,
        validate: (value, context) => {
            const stringResult = validator.validate(value, context);
            if (isLeft(stringResult))
                return stringResult;
            const str = stringResult.right;
            if (str.length < min) {
                return left([{
                        field: context?.field || 'root',
                        message: context?.customMessages?.minLength || `Minimum length is ${min}`,
                        code: 'MIN_LENGTH',
                        context: { min, actual: str.length }
                    }]);
            }
            return right(str);
        }
    }),
    // 最大長
    maxLength: (max) => (validator) => ({
        name: `${validator.name}.maxLength(${max})`,
        validate: (value, context) => {
            const stringResult = validator.validate(value, context);
            if (isLeft(stringResult))
                return stringResult;
            const str = stringResult.right;
            if (str.length > max) {
                return left([{
                        field: context?.field || 'root',
                        message: context?.customMessages?.maxLength || `Maximum length is ${max}`,
                        code: 'MAX_LENGTH',
                        context: { max, actual: str.length }
                    }]);
            }
            return right(str);
        }
    }),
    // 正規表現パターン
    pattern: (regex, errorMessage) => (validator) => ({
        name: `${validator.name}.pattern(${regex})`,
        validate: (value, context) => {
            const stringResult = validator.validate(value, context);
            if (isLeft(stringResult))
                return stringResult;
            const str = stringResult.right;
            if (!regex.test(str)) {
                return left([{
                        field: context?.field || 'root',
                        message: errorMessage || context?.customMessages?.pattern || 'Invalid format',
                        code: 'PATTERN_MISMATCH',
                        context: { pattern: regex.toString() }
                    }]);
            }
            return right(str);
        }
    }),
    // メールアドレス
    email: () => (validator) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return exports.stringValidators.pattern(emailRegex, 'Invalid email address')(validator);
    },
    // URL
    url: () => (validator) => {
        const urlRegex = /^https?:\/\/.+/;
        return exports.stringValidators.pattern(urlRegex, 'Invalid URL')(validator);
    },
    // 空文字禁止
    notEmpty: () => (validator) => ({
        name: `${validator.name}.notEmpty()`,
        validate: (value, context) => {
            const stringResult = validator.validate(value, context);
            if (isLeft(stringResult))
                return stringResult;
            const str = stringResult.right.trim();
            if (str.length === 0) {
                return left([{
                        field: context?.field || 'root',
                        message: context?.customMessages?.notEmpty || 'Value cannot be empty',
                        code: 'EMPTY_VALUE'
                    }]);
            }
            return right(stringResult.right);
        }
    })
};
// ===========================================
// 数値専用バリデータ
// ===========================================
exports.numberValidators = {
    // 最小値
    min: (minimum) => (validator) => ({
        name: `${validator.name}.min(${minimum})`,
        validate: (value, context) => {
            const numberResult = validator.validate(value, context);
            if (isLeft(numberResult))
                return numberResult;
            const num = numberResult.right;
            if (num < minimum) {
                return left([{
                        field: context?.field || 'root',
                        message: context?.customMessages?.min || `Minimum value is ${minimum}`,
                        code: 'MIN_VALUE',
                        context: { min: minimum, actual: num }
                    }]);
            }
            return right(num);
        }
    }),
    // 最大値
    max: (maximum) => (validator) => ({
        name: `${validator.name}.max(${maximum})`,
        validate: (value, context) => {
            const numberResult = validator.validate(value, context);
            if (isLeft(numberResult))
                return numberResult;
            const num = numberResult.right;
            if (num > maximum) {
                return left([{
                        field: context?.field || 'root',
                        message: context?.customMessages?.max || `Maximum value is ${maximum}`,
                        code: 'MAX_VALUE',
                        context: { max: maximum, actual: num }
                    }]);
            }
            return right(num);
        }
    }),
    // 整数
    integer: () => (validator) => ({
        name: `${validator.name}.integer()`,
        validate: (value, context) => {
            const numberResult = validator.validate(value, context);
            if (isLeft(numberResult))
                return numberResult;
            const num = numberResult.right;
            if (!Number.isInteger(num)) {
                return left([{
                        field: context?.field || 'root',
                        message: context?.customMessages?.integer || 'Value must be an integer',
                        code: 'NOT_INTEGER'
                    }]);
            }
            return right(num);
        }
    }),
    // 正数
    positive: () => (validator) => ({
        name: `${validator.name}.positive()`,
        validate: (value, context) => {
            const numberResult = validator.validate(value, context);
            if (isLeft(numberResult))
                return numberResult;
            const num = numberResult.right;
            if (num <= 0) {
                return left([{
                        field: context?.field || 'root',
                        message: context?.customMessages?.positive || 'Value must be positive',
                        code: 'NOT_POSITIVE'
                    }]);
            }
            return right(num);
        }
    })
};
// ===========================================
// カスタムバリデータ
// ===========================================
// カスタムバリデーション関数
const custom = (customFn, baseValidator) => ({
    name: `${baseValidator.name}.custom()`,
    validate: (value, context) => {
        const baseResult = baseValidator.validate(value, context);
        if (isLeft(baseResult))
            return baseResult;
        const validValue = baseResult.right;
        const customError = customFn(validValue, context);
        if (customError) {
            return left([customError]);
        }
        return right(validValue);
    }
});
exports.custom = custom;
// 非同期カスタムバリデーション
const asyncCustom = (asyncFn, baseValidator) => ({
    name: `${baseValidator.name}.asyncCustom()`,
    validateAsync: async (value, context) => {
        const baseResult = baseValidator.validate(value, context);
        if (isLeft(baseResult))
            return baseResult;
        const validValue = baseResult.right;
        const customError = await asyncFn(validValue, context);
        if (customError) {
            return left([customError]);
        }
        return right(validValue);
    }
});
exports.asyncCustom = asyncCustom;
// ===========================================
// バリデータビルダー（完全な型安全性）
// ===========================================
class ValidatorBuilder {
    constructor(validator) {
        this.validator = validator;
    }
    // 文字列バリデーション用メソッド（条件付き型で制約）
    minLength(min) {
        return new ValidatorBuilder(exports.stringValidators.minLength(min)(this.validator));
    }
    maxLength(max) {
        return new ValidatorBuilder(exports.stringValidators.maxLength(max)(this.validator));
    }
    pattern(regex, message) {
        return new ValidatorBuilder(exports.stringValidators.pattern(regex, message)(this.validator));
    }
    email() {
        return new ValidatorBuilder(exports.stringValidators.email()(this.validator));
    }
    notEmpty() {
        return new ValidatorBuilder(exports.stringValidators.notEmpty()(this.validator));
    }
    // 数値バリデーション用メソッド（条件付き型で制約）
    min(minimum) {
        return new ValidatorBuilder(exports.numberValidators.min(minimum)(this.validator));
    }
    max(maximum) {
        return new ValidatorBuilder(exports.numberValidators.max(maximum)(this.validator));
    }
    integer() {
        return new ValidatorBuilder(exports.numberValidators.integer()(this.validator));
    }
    positive() {
        return new ValidatorBuilder(exports.numberValidators.positive()(this.validator));
    }
    // カスタムバリデーション（型安全）
    custom(fn) {
        return new ValidatorBuilder((0, exports.custom)(fn, this.validator));
    }
    // オプショナル化
    optional() {
        return new ValidatorBuilder((0, exports.optional)(this.validator));
    }
    // バリデータの取得
    build() {
        return this.validator;
    }
    // 直接バリデーション実行
    validate(value, context) {
        return this.validator.validate(value, context);
    }
}
exports.ValidatorBuilder = ValidatorBuilder;
// ===========================================
// 高階バリデータ関数（完全な型推論）
// ===========================================
// 型安全なオブジェクトバリデータ作成関数
const createObjectValidator = (schema) => {
    return new ValidatorBuilder((0, exports.object)(schema));
};
exports.createObjectValidator = createObjectValidator;
// 型安全な配列バリデータ作成関数
const createArrayValidator = (itemValidator) => {
    return new ValidatorBuilder((0, exports.array)(itemValidator));
};
exports.createArrayValidator = createArrayValidator;
// ===========================================
// ファクトリー関数
// ===========================================
// 完全な型推論を持つファクトリー関数
exports.v = {
    // プリミティブ型
    string: () => new ValidatorBuilder(exports.primitiveValidators.string()),
    number: () => new ValidatorBuilder(exports.primitiveValidators.number()),
    boolean: () => new ValidatorBuilder(exports.primitiveValidators.boolean()),
    date: () => new ValidatorBuilder(exports.primitiveValidators.date()),
    // 複合型（完全な型推論）
    array: (itemValidator) => new ValidatorBuilder((0, exports.array)(itemValidator)),
    object: (schema) => new ValidatorBuilder((0, exports.object)(schema)),
    optional: (validator) => new ValidatorBuilder((0, exports.optional)(validator)),
    // 高度なバリデータ
    literal: (value) => new ValidatorBuilder({
        name: `literal(${value})`,
        validate: (input) => {
            return input === value
                ? right(value)
                : left([{ field: 'root', message: `Expected ${value}`, code: 'LITERAL_MISMATCH' }]);
        }
    }),
    union: (...validators) => new ValidatorBuilder({
        name: `union(${validators.map(v => v.name).join('|')})`,
        validate: (input) => {
            const errors = [];
            for (const validator of validators) {
                const result = validator.validate(input);
                if (isRight(result)) {
                    return result;
                }
                else {
                    errors.push(...result.left);
                }
            }
            return left(errors);
        }
    }),
    tuple: (...validators) => new ValidatorBuilder({
        name: `tuple(${validators.length})`,
        validate: (input) => {
            if (!Array.isArray(input)) {
                return left([{ field: 'root', message: 'Expected array', code: 'TYPE_ERROR' }]);
            }
            if (input.length !== validators.length) {
                return left([{
                        field: 'root',
                        message: `Expected tuple of length ${validators.length}`,
                        code: 'TUPLE_LENGTH_MISMATCH'
                    }]);
            }
            const errors = [];
            const results = [];
            validators.forEach((validator, index) => {
                const result = validator.validate(input[index], { field: `[${index}]` });
                if (isLeft(result)) {
                    errors.push(...result.left);
                }
                else {
                    results[index] = result.right;
                }
            });
            return errors.length > 0
                ? left(errors)
                : right(results);
        }
    })
};
//# sourceMappingURL=validation-system.js.map