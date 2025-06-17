export declare const identity: <T>(x: T) => T;
export declare const compose: <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (a: A) => C;
export declare const pipe: <T>(...fns: Array<(arg: T) => T>) => (value: T) => T;
export declare const curry: <A, B, C>(fn: (a: A, b: B) => C) => (a: A) => (b: B) => C;
export declare const partial: <A extends any[], B>(fn: (...args: A) => B, ...partialArgs: Partial<A>) => (...remainingArgs: any[]) => B;
