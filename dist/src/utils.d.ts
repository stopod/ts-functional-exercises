export declare const map: <T, U>(fn: (item: T) => U) => (arr: readonly T[]) => U[];
export declare const filter: <T>(predicate: (item: T) => boolean) => (arr: readonly T[]) => T[];
export declare const reduce: <T, U>(fn: (acc: U, item: T) => U, initial: U) => (arr: readonly T[]) => U;
export declare const safeGet: <T>(arr: readonly T[], index: number) => Option<T>;
export declare const head: <T>(arr: readonly T[]) => Option<T>;
export declare const last: <T>(arr: readonly T[]) => Option<T>;
export type Option<T> = Some<T> | None;
export interface Some<T> {
    readonly _tag: 'Some';
    readonly value: T;
}
export interface None {
    readonly _tag: 'None';
}
export declare const some: <T>(value: T) => Option<T>;
export declare const none: Option<never>;
export declare const isSome: <T>(option: Option<T>) => option is Some<T>;
export declare const isNone: <T>(option: Option<T>) => option is None;
export declare const mapOption: <T, U>(fn: (value: T) => U) => (option: Option<T>) => Option<U>;
export declare const flatMapOption: <T, U>(fn: (value: T) => Option<U>) => (option: Option<T>) => Option<U>;
export declare const getOrElse: <T>(defaultValue: T) => (option: Option<T>) => T;
export declare const fold: <T, U>(onNone: () => U, onSome: (value: T) => U) => (option: Option<T>) => U;
export declare const filterOption: <T>(predicate: (value: T) => boolean) => (option: Option<T>) => Option<T>;
export type Either<L, R> = Left<L> | Right<R>;
export interface Left<L> {
    readonly _tag: 'Left';
    readonly left: L;
}
export interface Right<R> {
    readonly _tag: 'Right';
    readonly right: R;
}
export declare const left: <L, R = never>(value: L) => Either<L, R>;
export declare const right: <L = never, R = never>(value: R) => Either<L, R>;
export declare const isLeft: <L, R>(either: Either<L, R>) => either is Left<L>;
export declare const isRight: <L, R>(either: Either<L, R>) => either is Right<R>;
export declare const mapEither: <L, R, U>(fn: (value: R) => U) => (either: Either<L, R>) => Either<L, U>;
export declare const mapLeft: <L, R, U>(fn: (error: L) => U) => (either: Either<L, R>) => Either<U, R>;
export declare const flatMapEither: <L, R, U>(fn: (value: R) => Either<L, U>) => (either: Either<L, R>) => Either<L, U>;
export declare const foldEither: <L, R, U>(onLeft: (error: L) => U, onRight: (value: R) => U) => (either: Either<L, R>) => U;
export declare const swap: <L, R>(either: Either<L, R>) => Either<R, L>;
export declare const safeParseInt: (str: string, radix?: number) => Option<number>;
export declare const safeParseFloat: (str: string) => Option<number>;
export declare const safeParseJSON: <T = unknown>(jsonString: string) => Option<T>;
export declare const safeProp: <T extends Record<string, unknown>, K extends keyof T>(key: K) => (obj: T) => Option<NonNullable<T[K]>>;
export declare const optionToEither: <L, R>(error: L) => (option: Option<R>) => Either<L, R>;
export declare const eitherToOption: <L, R>(either: Either<L, R>) => Option<R>;
export type Maybe<T> = T | null | undefined;
export declare const fromMaybe: <T>(maybe: Maybe<T>) => Option<T>;
export declare const toMaybe: <T>(option: Option<T>) => Maybe<T>;
export declare const maybe: <T, U>(fn: (value: T) => U) => (value: Maybe<T>) => Maybe<U>;
