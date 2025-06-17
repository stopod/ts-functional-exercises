// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// Core functional programming utilities

// Identity function
export const identity = <T>(x: T): T => x;

// Composition - 2つの関数を合成
export const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => 
  (a: A): C => f(g(a));

// 3つの関数を合成
export const compose3 = <A, B, C, D>(
  f: (c: C) => D,
  g: (b: B) => C,
  h: (a: A) => B
) => (a: A): D => f(g(h(a)));

// Pipe - 関数を左から右に適用（同じ型）
export const pipe = <T>(...fns: Array<(arg: T) => T>) => 
  (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

// Pipe - 型変換可能な版
export const pipeWith = <T>(value: T) => ({
  pipe: <U>(fn: (value: T) => U) => pipeWith(fn(value)),
  value: (): T => value
});

// Flow - 複数の関数を連鎖（型安全）
export function flow<A, B>(fn1: (a: A) => B): (a: A) => B;
export function flow<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
export function flow<A, B, C, D>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): (a: A) => D;
export function flow<A, B, C, D, E>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): (a: A) => E;
export function flow<A, B, C, D, E, F>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F): (a: A) => F;
export function flow(...fns: Array<(arg: unknown) => unknown>): (arg: unknown) => unknown {
  return (input: unknown) => fns.reduce((acc, fn) => fn(acc), input);
}

// Curry - 2引数の関数をカリー化
export const curry = <A, B, C>(fn: (a: A, b: B) => C) => 
  (a: A) => (b: B): C => fn(a, b);

// 3引数の関数をカリー化
export const curry3 = <A, B, C, D>(fn: (a: A, b: B, c: C) => D) => 
  (a: A) => (b: B) => (c: C): D => fn(a, b, c);

// 4引数の関数をカリー化
export const curry4 = <A, B, C, D, E>(fn: (a: A, b: B, c: C, d: D) => E) => 
  (a: A) => (b: B) => (c: C) => (d: D): E => fn(a, b, c, d);

// Partial application - 型安全な部分適用
type PartialTuple<T extends readonly unknown[]> = {
  [K in keyof T]?: T[K];
};

type RemainingArgs<T extends readonly unknown[], P extends readonly unknown[]> = 
  T extends readonly [...P, ...infer R] ? R : never;

export function partial<T extends readonly unknown[], R>(
  fn: (...args: T) => R,
  ...partialArgs: unknown[]
): (...args: unknown[]) => R {
  return (...remainingArgs: unknown[]): R => {
    const allArgs = [...partialArgs, ...remainingArgs];
    return fn(...(allArgs as unknown as T));
  };
}

// より型安全な部分適用（2引数用）
export const partial2 = <A, B, C>(fn: (a: A, b: B) => C) => 
  (a: A) => (b: B): C => fn(a, b);

// Flip - 2引数関数の引数順序を入れ替え
export const flip = <A, B, C>(fn: (a: A, b: B) => C) => 
  (b: B, a: A): C => fn(a, b);

// Constant - 常に同じ値を返す関数を作成
export const constant = <T>(value: T) => (): T => value;