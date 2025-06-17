// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// Utility functions for functional programming

// Array utilities
export const map = <T, U>(fn: (item: T) => U) => (arr: readonly T[]): U[] => arr.map(fn);
export const filter = <T>(predicate: (item: T) => boolean) => (arr: readonly T[]): T[] => arr.filter(predicate);
export const reduce = <T, U>(fn: (acc: U, item: T) => U, initial: U) => (arr: readonly T[]): U => arr.reduce(fn, initial);

// 安全な配列アクセス
export const safeGet = <T>(arr: readonly T[], index: number): Option<T> => 
  index >= 0 && index < arr.length ? some(arr[index]!) : none;

// 配列の最初/最後の要素を安全に取得
export const head = <T>(arr: readonly T[]): Option<T> => safeGet(arr, 0);
export const last = <T>(arr: readonly T[]): Option<T> => safeGet(arr, arr.length - 1);

// Option/Maybe type - 完全に型安全な実装
export type Option<T> = Some<T> | None;

export interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

export interface None {
  readonly _tag: 'None';
}

// Option constructors
export const some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
export const none: Option<never> = { _tag: 'None' };

// Option type guards
export const isSome = <T>(option: Option<T>): option is Some<T> => option._tag === 'Some';
export const isNone = <T>(option: Option<T>): option is None => option._tag === 'None';

// Option operations
export const mapOption = <T, U>(fn: (value: T) => U) => 
  (option: Option<T>): Option<U> => 
    isSome(option) ? some(fn(option.value)) : none;

export const flatMapOption = <T, U>(fn: (value: T) => Option<U>) => 
  (option: Option<T>): Option<U> => 
    isSome(option) ? fn(option.value) : none;

export const getOrElse = <T>(defaultValue: T) => 
  (option: Option<T>): T => 
    isSome(option) ? option.value : defaultValue;

export const fold = <T, U>(
  onNone: () => U,
  onSome: (value: T) => U
) => (option: Option<T>): U => 
  isSome(option) ? onSome(option.value) : onNone();

// Optionのフィルタリング
export const filterOption = <T>(predicate: (value: T) => boolean) => 
  (option: Option<T>): Option<T> => 
    isSome(option) && predicate(option.value) ? option : none;

// Either type - 完全に型安全な実装
export type Either<L, R> = Left<L> | Right<R>;

export interface Left<L> {
  readonly _tag: 'Left';
  readonly left: L;
}

export interface Right<R> {
  readonly _tag: 'Right';
  readonly right: R;
}

// Either constructors
export const left = <L, R = never>(value: L): Either<L, R> => ({ _tag: 'Left', left: value });
export const right = <L = never, R = never>(value: R): Either<L, R> => ({ _tag: 'Right', right: value });

// Either type guards
export const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => either._tag === 'Left';
export const isRight = <L, R>(either: Either<L, R>): either is Right<R> => either._tag === 'Right';

// Either operations
export const mapEither = <L, R, U>(fn: (value: R) => U) => 
  (either: Either<L, R>): Either<L, U> => 
    isRight(either) ? right(fn(either.right)) : either;

export const mapLeft = <L, R, U>(fn: (error: L) => U) => 
  (either: Either<L, R>): Either<U, R> => 
    isLeft(either) ? left(fn(either.left)) : either;

export const flatMapEither = <L, R, U>(fn: (value: R) => Either<L, U>) => 
  (either: Either<L, R>): Either<L, U> => 
    isRight(either) ? fn(either.right) : either;

export const foldEither = <L, R, U>(
  onLeft: (error: L) => U,
  onRight: (value: R) => U
) => (either: Either<L, R>): U => 
  isLeft(either) ? onLeft(either.left) : onRight(either.right);

// Eitherの変換ユーティリティ
export const swap = <L, R>(either: Either<L, R>): Either<R, L> => 
  isLeft(either) ? right(either.left) : left(either.right);

// 安全な数値変換
export const safeParseInt = (str: string, radix?: number): Option<number> => {
  const result = parseInt(str, radix);
  return isNaN(result) ? none : some(result);
};

export const safeParseFloat = (str: string): Option<number> => {
  const result = parseFloat(str);
  return isNaN(result) ? none : some(result);
};

// 安全なJSON解析
export const safeParseJSON = <T = unknown>(jsonString: string): Option<T> => {
  try {
    const result = JSON.parse(jsonString) as T;
    return some(result);
  } catch {
    return none;
  }
};

// 安全なプロパティアクセス
export const safeProp = <T extends Record<string, unknown>, K extends keyof T>(key: K) => 
  (obj: T): Option<NonNullable<T[K]>> => {
    const value = obj[key];
    return value != null ? some(value as NonNullable<T[K]>) : none;
  };

// OptionとEitherの相互変換
export const optionToEither = <L, R>(error: L) => 
  (option: Option<R>): Either<L, R> => 
    isSome(option) ? right(option.value) : left(error);

export const eitherToOption = <L, R>(either: Either<L, R>): Option<R> => 
  isRight(either) ? some(either.right) : none;

// 旧来のMaybe型との互換性のため
export type Maybe<T> = T | null | undefined;

export const fromMaybe = <T>(maybe: Maybe<T>): Option<T> => 
  maybe != null ? some(maybe) : none;

export const toMaybe = <T>(option: Option<T>): Maybe<T> => 
  isSome(option) ? option.value : null;

export const maybe = <T, U>(fn: (value: T) => U) => (value: Maybe<T>): Maybe<U> => 
  value == null ? null : fn(value);