type Either<L, R> = Left<L> | Right<R>;
interface Left<L> {
    readonly _tag: 'Left';
    readonly left: L;
}
interface Right<R> {
    readonly _tag: 'Right';
    readonly right: R;
}
declare const left: <L, R = never>(value: L) => Either<L, R>;
declare const right: <L = never, R = never>(value: R) => Either<L, R>;
declare const isLeft: <L, R>(either: Either<L, R>) => either is Left<L>;
declare const isRight: <L, R>(either: Either<L, R>) => either is Right<R>;
type ValidationError = {
    field: string;
    message: string;
    code?: string;
    context?: Record<string, any>;
};
type ValidationResult<T> = Either<ValidationError[], T>;
interface Validator<T> {
    validate(value: unknown, context?: ValidationContext): ValidationResult<T>;
    name?: string;
}
type ValidationContext = {
    field?: string;
    parentObject?: any;
    locale?: string;
    customMessages?: Record<string, string>;
};
export declare const primitiveValidators: {
    string: () => Validator<string>;
    number: () => Validator<number>;
    boolean: () => Validator<boolean>;
    date: () => Validator<Date>;
};
export declare const array: <T>(itemValidator: Validator<T>) => Validator<T[]>;
export declare const object: <T extends Record<string, any>>(schema: { [K in keyof T]: Validator<T[K]>; }) => Validator<T>;
export declare const optional: <T>(validator: Validator<T>) => Validator<T | undefined>;
export declare const stringValidators: {
    minLength: (min: number) => (validator: Validator<string>) => Validator<string>;
    maxLength: (max: number) => (validator: Validator<string>) => Validator<string>;
    pattern: (regex: RegExp, errorMessage?: string) => (validator: Validator<string>) => Validator<string>;
    email: () => (validator: Validator<string>) => Validator<string>;
    url: () => (validator: Validator<string>) => Validator<string>;
    notEmpty: () => (validator: Validator<string>) => Validator<string>;
};
export declare const numberValidators: {
    min: (minimum: number) => (validator: Validator<number>) => Validator<number>;
    max: (maximum: number) => (validator: Validator<number>) => Validator<number>;
    integer: () => (validator: Validator<number>) => Validator<number>;
    positive: () => (validator: Validator<number>) => Validator<number>;
};
export declare const custom: <T>(customFn: (value: T, context?: ValidationContext) => ValidationError | null, baseValidator: Validator<T>) => Validator<T>;
export declare const asyncCustom: <T>(asyncFn: (value: T, context?: ValidationContext) => Promise<ValidationError | null>, baseValidator: Validator<T>) => AsyncValidator<T>;
interface AsyncValidator<T> {
    validateAsync(value: unknown, context?: ValidationContext): Promise<ValidationResult<T>>;
    name?: string;
}
type InferValidatorType<T> = T extends Validator<infer U> ? U : never;
type InferSchemaType<T> = {
    [K in keyof T]: InferValidatorType<T[K]>;
};
export declare class ValidatorBuilder<T> {
    private validator;
    constructor(validator: Validator<T>);
    minLength<U extends T>(this: ValidatorBuilder<string>, min: number): ValidatorBuilder<string>;
    maxLength<U extends T>(this: ValidatorBuilder<string>, max: number): ValidatorBuilder<string>;
    pattern<U extends T>(this: ValidatorBuilder<string>, regex: RegExp, message?: string): ValidatorBuilder<string>;
    email<U extends T>(this: ValidatorBuilder<string>): ValidatorBuilder<string>;
    notEmpty<U extends T>(this: ValidatorBuilder<string>): ValidatorBuilder<string>;
    min<U extends T>(this: ValidatorBuilder<number>, minimum: number): ValidatorBuilder<number>;
    max<U extends T>(this: ValidatorBuilder<number>, maximum: number): ValidatorBuilder<number>;
    integer<U extends T>(this: ValidatorBuilder<number>): ValidatorBuilder<number>;
    positive<U extends T>(this: ValidatorBuilder<number>): ValidatorBuilder<number>;
    custom(fn: (value: T, context?: ValidationContext) => ValidationError | null): ValidatorBuilder<T>;
    optional(): ValidatorBuilder<T | undefined>;
    build(): Validator<T>;
    validate(value: unknown, context?: ValidationContext): ValidationResult<T>;
}
export declare const createObjectValidator: <T extends Record<string, Validator<any>>>(schema: T) => ValidatorBuilder<InferSchemaType<T>>;
export declare const createArrayValidator: <T>(itemValidator: Validator<T>) => ValidatorBuilder<T[]>;
export declare const v: {
    string: () => ValidatorBuilder<string>;
    number: () => ValidatorBuilder<number>;
    boolean: () => ValidatorBuilder<boolean>;
    date: () => ValidatorBuilder<Date>;
    array: <T>(itemValidator: Validator<T>) => ValidatorBuilder<T[]>;
    object: <T extends Record<string, Validator<any>>>(schema: T) => ValidatorBuilder<InferSchemaType<T>>;
    optional: <T>(validator: Validator<T>) => ValidatorBuilder<T | undefined>;
    literal: <T extends string | number | boolean>(value: T) => ValidatorBuilder<T>;
    union: <T extends readonly Validator<any>[]>(...validators: T) => ValidatorBuilder<InferValidatorType<T[number]>>;
    tuple: <T extends readonly Validator<any>[]>(...validators: T) => ValidatorBuilder<{ [K in keyof T]: InferValidatorType<T[K]>; }>;
};
export { Validator, AsyncValidator, ValidationError, ValidationResult, ValidationContext, left, right, isLeft, isRight };
