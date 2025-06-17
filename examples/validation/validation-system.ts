// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// バリデーションシステム - メイン実装
// 実際のWebアプリケーションで使用できる型安全で再利用可能なバリデーションライブラリ

// ===========================================
// 型定義
// ===========================================

// Either型（エラーハンドリング用）
type Either<L, R> = Left<L> | Right<R>;
interface Left<L> { readonly _tag: 'Left'; readonly left: L; }
interface Right<R> { readonly _tag: 'Right'; readonly right: R; }

const left = <L, R = never>(value: L): Either<L, R> => ({ _tag: 'Left', left: value });
const right = <L = never, R = never>(value: R): Either<L, R> => ({ _tag: 'Right', right: value });
const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => either._tag === 'Left';
const isRight = <L, R>(either: Either<L, R>): either is Right<R> => either._tag === 'Right';

// バリデーション結果の型
type ValidationError = {
  field: string;
  message: string;
  code?: string;
  context?: Record<string, any>;
};

type ValidationResult<T> = Either<ValidationError[], T>;

// バリデータの基本インターフェース
interface Validator<T> {
  validate(value: unknown, context?: ValidationContext): ValidationResult<T>;
  name?: string;
}

// バリデーション実行時のコンテキスト
type ValidationContext = {
  field?: string;
  parentObject?: any;
  locale?: string;
  customMessages?: Record<string, string>;
};

// ===========================================
// 基本バリデータの実装
// ===========================================

// プリミティブ型のバリデータ
export const primitiveValidators = {
  string: (): Validator<string> => ({
    name: 'string',
    validate: (value: unknown, context?: ValidationContext): ValidationResult<string> => {
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

  number: (): Validator<number> => ({
    name: 'number',
    validate: (value: unknown, context?: ValidationContext): ValidationResult<number> => {
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

  boolean: (): Validator<boolean> => ({
    name: 'boolean',
    validate: (value: unknown, context?: ValidationContext): ValidationResult<boolean> => {
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

  date: (): Validator<Date> => ({
    name: 'date',
    validate: (value: unknown, context?: ValidationContext): ValidationResult<Date> => {
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
export const array = <T>(itemValidator: Validator<T>): Validator<T[]> => ({
  name: `array<${itemValidator.name || 'unknown'}>`,
  validate: (value: unknown, context?: ValidationContext): ValidationResult<T[]> => {
    if (!Array.isArray(value)) {
      return left([{
        field: context?.field || 'root',
        message: context?.customMessages?.array || 'Expected array',
        code: 'TYPE_ERROR'
      }]);
    }

    const results: ValidationResult<T>[] = [];
    const errors: ValidationError[] = [];
    const successes: T[] = [];

    value.forEach((item, index) => {
      const itemContext: ValidationContext = {
        ...context,
        field: `${context?.field || 'root'}[${index}]`
      };
      
      const result = itemValidator.validate(item, itemContext);
      results.push(result);
      
      if (isLeft(result)) {
        errors.push(...result.left);
      } else {
        successes.push(result.right);
      }
    });

    return errors.length > 0 ? left(errors) : right(successes);
  }
});

// オブジェクトバリデータ
export const object = <T extends Record<string, any>>(
  schema: { [K in keyof T]: Validator<T[K]> }
): Validator<T> => ({
  name: 'object',
  validate: (value: unknown, context?: ValidationContext): ValidationResult<T> => {
    if (typeof value !== 'object' || value === null) {
      return left([{
        field: context?.field || 'root',
        message: context?.customMessages?.object || 'Expected object',
        code: 'TYPE_ERROR'
      }]);
    }

    const obj = value as Record<string, unknown>;
    const errors: ValidationError[] = [];
    const result: Partial<T> = {};

    // 必須フィールドのチェック
    for (const [key, validator] of Object.entries(schema)) {
      const fieldContext: ValidationContext = {
        ...context,
        field: context?.field ? `${context.field}.${key}` : key,
        parentObject: obj
      };

      const fieldResult = validator.validate(obj[key], fieldContext);
      
      if (isLeft(fieldResult)) {
        const fieldErrors = Array.isArray(fieldResult.left) ? fieldResult.left : [fieldResult.left];
        errors.push(...fieldErrors);
      } else {
        (result as any)[key] = fieldResult.right;
      }
    }

    return errors.length > 0 ? left(errors) : right(result as T);
  }
});

// オプショナルバリデータ
export const optional = <T>(validator: Validator<T>): Validator<T | undefined> => ({
  name: `optional<${validator.name || 'unknown'}>`,
  validate: (value: unknown, context?: ValidationContext): ValidationResult<T | undefined> => {
    if (value === undefined || value === null) {
      return right(undefined);
    }
    return validator.validate(value, context);
  }
});

// ===========================================
// 文字列専用バリデータ
// ===========================================

export const stringValidators = {
  // 最小長
  minLength: (min: number) => (validator: Validator<string>): Validator<string> => ({
    name: `${validator.name}.minLength(${min})`,
    validate: (value: unknown, context?: ValidationContext): ValidationResult<string> => {
      const stringResult = validator.validate(value, context);
      if (isLeft(stringResult)) return stringResult;
      
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
  maxLength: (max: number) => (validator: Validator<string>): Validator<string> => ({
    name: `${validator.name}.maxLength(${max})`,
    validate: (value: unknown, context?: ValidationContext): ValidationResult<string> => {
      const stringResult = validator.validate(value, context);
      if (isLeft(stringResult)) return stringResult;
      
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
  pattern: (regex: RegExp, errorMessage?: string) => (validator: Validator<string>): Validator<string> => ({
    name: `${validator.name}.pattern(${regex})`,
    validate: (value: unknown, context?: ValidationContext): ValidationResult<string> => {
      const stringResult = validator.validate(value, context);
      if (isLeft(stringResult)) return stringResult;
      
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
  email: () => (validator: Validator<string>): Validator<string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return stringValidators.pattern(emailRegex, 'Invalid email address')(validator);
  },

  // URL
  url: () => (validator: Validator<string>): Validator<string> => {
    const urlRegex = /^https?:\/\/.+/;
    return stringValidators.pattern(urlRegex, 'Invalid URL')(validator);
  },

  // 空文字禁止
  notEmpty: () => (validator: Validator<string>): Validator<string> => ({
    name: `${validator.name}.notEmpty()`,
    validate: (value: unknown, context?: ValidationContext): ValidationResult<string> => {
      const stringResult = validator.validate(value, context);
      if (isLeft(stringResult)) return stringResult;
      
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

export const numberValidators = {
  // 最小値
  min: (minimum: number) => (validator: Validator<number>): Validator<number> => ({
    name: `${validator.name}.min(${minimum})`,
    validate: (value: unknown, context?: ValidationContext): ValidationResult<number> => {
      const numberResult = validator.validate(value, context);
      if (isLeft(numberResult)) return numberResult;
      
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
  max: (maximum: number) => (validator: Validator<number>): Validator<number> => ({
    name: `${validator.name}.max(${maximum})`,
    validate: (value: unknown, context?: ValidationContext): ValidationResult<number> => {
      const numberResult = validator.validate(value, context);
      if (isLeft(numberResult)) return numberResult;
      
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
  integer: () => (validator: Validator<number>): Validator<number> => ({
    name: `${validator.name}.integer()`,
    validate: (value: unknown, context?: ValidationContext): ValidationResult<number> => {
      const numberResult = validator.validate(value, context);
      if (isLeft(numberResult)) return numberResult;
      
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
  positive: () => (validator: Validator<number>): Validator<number> => ({
    name: `${validator.name}.positive()`,
    validate: (value: unknown, context?: ValidationContext): ValidationResult<number> => {
      const numberResult = validator.validate(value, context);
      if (isLeft(numberResult)) return numberResult;
      
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
export const custom = <T>(
  customFn: (value: T, context?: ValidationContext) => ValidationError | null,
  baseValidator: Validator<T>
): Validator<T> => ({
  name: `${baseValidator.name}.custom()`,
  validate: (value: unknown, context?: ValidationContext): ValidationResult<T> => {
    const baseResult = baseValidator.validate(value, context);
    if (isLeft(baseResult)) return baseResult;
    
    const validValue = baseResult.right;
    const customError = customFn(validValue, context);
    
    if (customError) {
      return left([customError]);
    }
    
    return right(validValue);
  }
});

// 非同期カスタムバリデーション
export const asyncCustom = <T>(
  asyncFn: (value: T, context?: ValidationContext) => Promise<ValidationError | null>,
  baseValidator: Validator<T>
): AsyncValidator<T> => ({
  name: `${baseValidator.name}.asyncCustom()`,
  validateAsync: async (value: unknown, context?: ValidationContext): Promise<ValidationResult<T>> => {
    const baseResult = baseValidator.validate(value, context);
    if (isLeft(baseResult)) return baseResult;
    
    const validValue = baseResult.right;
    const customError = await asyncFn(validValue, context);
    
    if (customError) {
      return left([customError]);
    }
    
    return right(validValue);
  }
});

// 非同期バリデータのインターフェース
interface AsyncValidator<T> {
  validateAsync(value: unknown, context?: ValidationContext): Promise<ValidationResult<T>>;
  name?: string;
}

// ===========================================
// 型推論ヘルパー
// ===========================================

// スキーマから型を推論するヘルパー型
type InferValidatorType<T> = T extends Validator<infer U> ? U : never;
type InferSchemaType<T> = {
  [K in keyof T]: InferValidatorType<T[K]>;
};

// 条件付き型でバリデータの型を制約
type StringValidator = Validator<string>;
type NumberValidator = Validator<number>;

// ===========================================
// バリデータビルダー（完全な型安全性）
// ===========================================

export class ValidatorBuilder<T> {
  constructor(private validator: Validator<T>) {}

  // 文字列バリデーション用メソッド（条件付き型で制約）
  minLength<U extends T>(this: ValidatorBuilder<string>, min: number): ValidatorBuilder<string> {
    return new ValidatorBuilder(stringValidators.minLength(min)(this.validator as StringValidator));
  }

  maxLength<U extends T>(this: ValidatorBuilder<string>, max: number): ValidatorBuilder<string> {
    return new ValidatorBuilder(stringValidators.maxLength(max)(this.validator as StringValidator));
  }

  pattern<U extends T>(this: ValidatorBuilder<string>, regex: RegExp, message?: string): ValidatorBuilder<string> {
    return new ValidatorBuilder(stringValidators.pattern(regex, message)(this.validator as StringValidator));
  }

  email<U extends T>(this: ValidatorBuilder<string>): ValidatorBuilder<string> {
    return new ValidatorBuilder(stringValidators.email()(this.validator as StringValidator));
  }

  notEmpty<U extends T>(this: ValidatorBuilder<string>): ValidatorBuilder<string> {
    return new ValidatorBuilder(stringValidators.notEmpty()(this.validator as StringValidator));
  }

  // 数値バリデーション用メソッド（条件付き型で制約）
  min<U extends T>(this: ValidatorBuilder<number>, minimum: number): ValidatorBuilder<number> {
    return new ValidatorBuilder(numberValidators.min(minimum)(this.validator as NumberValidator));
  }

  max<U extends T>(this: ValidatorBuilder<number>, maximum: number): ValidatorBuilder<number> {
    return new ValidatorBuilder(numberValidators.max(maximum)(this.validator as NumberValidator));
  }

  integer<U extends T>(this: ValidatorBuilder<number>): ValidatorBuilder<number> {
    return new ValidatorBuilder(numberValidators.integer()(this.validator as NumberValidator));
  }

  positive<U extends T>(this: ValidatorBuilder<number>): ValidatorBuilder<number> {
    return new ValidatorBuilder(numberValidators.positive()(this.validator as NumberValidator));
  }

  // カスタムバリデーション（型安全）
  custom(fn: (value: T, context?: ValidationContext) => ValidationError | null): ValidatorBuilder<T> {
    return new ValidatorBuilder(custom(fn, this.validator));
  }

  // オプショナル化
  optional(): ValidatorBuilder<T | undefined> {
    return new ValidatorBuilder(optional(this.validator));
  }

  // バリデータの取得
  build(): Validator<T> {
    return this.validator;
  }

  // 直接バリデーション実行
  validate(value: unknown, context?: ValidationContext): ValidationResult<T> {
    return this.validator.validate(value, context);
  }
}

// ===========================================
// 高階バリデータ関数（完全な型推論）
// ===========================================

// 型安全なオブジェクトバリデータ作成関数
export const createObjectValidator = <T extends Record<string, Validator<any>>>(
  schema: T
): ValidatorBuilder<InferSchemaType<T>> => {
  return new ValidatorBuilder(object(schema as any));
};

// 型安全な配列バリデータ作成関数
export const createArrayValidator = <T>(
  itemValidator: Validator<T>
): ValidatorBuilder<T[]> => {
  return new ValidatorBuilder(array(itemValidator));
};

// ===========================================
// ファクトリー関数
// ===========================================

// 完全な型推論を持つファクトリー関数
export const v = {
  // プリミティブ型
  string: () => new ValidatorBuilder(primitiveValidators.string()),
  number: () => new ValidatorBuilder(primitiveValidators.number()),
  boolean: () => new ValidatorBuilder(primitiveValidators.boolean()),
  date: () => new ValidatorBuilder(primitiveValidators.date()),
  
  // 複合型（完全な型推論）
  array: <T>(itemValidator: Validator<T>) => 
    new ValidatorBuilder(array(itemValidator)),
  
  object: <T extends Record<string, Validator<any>>>(schema: T) => 
    new ValidatorBuilder(object(schema)) as ValidatorBuilder<InferSchemaType<T>>,
  
  optional: <T>(validator: Validator<T>) => 
    new ValidatorBuilder(optional(validator)),
  
  // 高度なバリデータ
  literal: <T extends string | number | boolean>(value: T) => 
    new ValidatorBuilder({
      name: `literal(${value})`,
      validate: (input: unknown): ValidationResult<T> => {
        return input === value 
          ? right(value) 
          : left([{ field: 'root', message: `Expected ${value}`, code: 'LITERAL_MISMATCH' }]);
      }
    } as Validator<T>),
    
  union: <T extends readonly Validator<any>[]>(...validators: T) => 
    new ValidatorBuilder({
      name: `union(${validators.map(v => v.name).join('|')})`,
      validate: (input: unknown): ValidationResult<InferValidatorType<T[number]>> => {
        const errors: ValidationError[] = [];
        
        for (const validator of validators) {
          const result = validator.validate(input);
          if (isRight(result)) {
            return result as ValidationResult<InferValidatorType<T[number]>>;
          } else {
            errors.push(...result.left);
          }
        }
        
        return left(errors);
      }
    } as Validator<InferValidatorType<T[number]>>),
    
  tuple: <T extends readonly Validator<any>[]>(...validators: T) => 
    new ValidatorBuilder({
      name: `tuple(${validators.length})`,
      validate: (input: unknown): ValidationResult<{ [K in keyof T]: InferValidatorType<T[K]> }> => {
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
        
        const errors: ValidationError[] = [];
        const results: any[] = [];
        
        validators.forEach((validator, index) => {
          const result = validator.validate(input[index], { field: `[${index}]` });
          if (isLeft(result)) {
            errors.push(...result.left);
          } else {
            results[index] = result.right;
          }
        });
        
        return errors.length > 0 
          ? left(errors) 
          : right(results as { [K in keyof T]: InferValidatorType<T[K]> });
      }
    } as Validator<{ [K in keyof T]: InferValidatorType<T[K]> }>)
};

// ===========================================
// エクスポート
// ===========================================

export {
  Validator,
  AsyncValidator,
  ValidationError,
  ValidationResult,
  ValidationContext,
  left,
  right,
  isLeft,
  isRight
};