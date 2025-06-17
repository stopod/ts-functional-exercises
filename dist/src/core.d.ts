export declare const identity: <T>(x: T) => T;
export declare const compose: <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (a: A) => C;
export declare const compose3: <A, B, C, D>(f: (c: C) => D, g: (b: B) => C, h: (a: A) => B) => (a: A) => D;
export declare const pipe: <T>(...fns: Array<(arg: T) => T>) => (value: T) => T;
export declare const pipeWith: <T>(value: T) => {
    pipe: <U>(fn: (value: T) => U) => {
        pipe: <U_1>(fn: (value: U) => U_1) => {
            pipe: <U_2>(fn: (value: U_1) => U_2) => {
                pipe: <U_3>(fn: (value: U_2) => U_3) => {
                    pipe: <U_4>(fn: (value: U_3) => U_4) => {
                        pipe: <U_5>(fn: (value: U_4) => U_5) => {
                            pipe: <U_6>(fn: (value: U_5) => U_6) => {
                                pipe: <U_7>(fn: (value: U_6) => U_7) => {
                                    pipe: <U_8>(fn: (value: U_7) => U_8) => {
                                        pipe: <U_9>(fn: (value: U_8) => U_9) => {
                                            pipe: <U_10>(fn: (value: U_9) => U_10) => /*elided*/ any;
                                            value: () => U_9;
                                        };
                                        value: () => U_8;
                                    };
                                    value: () => U_7;
                                };
                                value: () => U_6;
                            };
                            value: () => U_5;
                        };
                        value: () => U_4;
                    };
                    value: () => U_3;
                };
                value: () => U_2;
            };
            value: () => U_1;
        };
        value: () => U;
    };
    value: () => T;
};
export declare function flow<A, B>(fn1: (a: A) => B): (a: A) => B;
export declare function flow<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
export declare function flow<A, B, C, D>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): (a: A) => D;
export declare function flow<A, B, C, D, E>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): (a: A) => E;
export declare function flow<A, B, C, D, E, F>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F): (a: A) => F;
export declare const curry: <A, B, C>(fn: (a: A, b: B) => C) => (a: A) => (b: B) => C;
export declare const curry3: <A, B, C, D>(fn: (a: A, b: B, c: C) => D) => (a: A) => (b: B) => (c: C) => D;
export declare const curry4: <A, B, C, D, E>(fn: (a: A, b: B, c: C, d: D) => E) => (a: A) => (b: B) => (c: C) => (d: D) => E;
export declare function partial<T extends readonly unknown[], R>(fn: (...args: T) => R, ...partialArgs: unknown[]): (...args: unknown[]) => R;
export declare const partial2: <A, B, C>(fn: (a: A, b: B) => C) => (a: A) => (b: B) => C;
export declare const flip: <A, B, C>(fn: (a: A, b: B) => C) => (b: B, a: A) => C;
export declare const constant: <T>(value: T) => () => T;
