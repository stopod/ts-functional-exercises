export declare const map: <T, U>(fn: (item: T) => U) => (arr: T[]) => U[];
export declare const filter: <T>(predicate: (item: T) => boolean) => (arr: T[]) => T[];
export declare const reduce: <T, U>(fn: (acc: U, item: T) => U, initial: U) => (arr: T[]) => U;
export type Maybe<T> = T | null | undefined;
export declare const maybe: <T, U>(fn: (value: T) => U) => (value: Maybe<T>) => Maybe<U>;
export type Either<L, R> = {
    type: 'left';
    value: L;
} | {
    type: 'right';
    value: R;
};
export declare const left: <L, R>(value: L) => Either<L, R>;
export declare const right: <L, R>(value: R) => Either<L, R>;
export declare const isLeft: <L, R>(either: Either<L, R>) => either is {
    type: "left";
    value: L;
};
export declare const isRight: <L, R>(either: Either<L, R>) => either is {
    type: "right";
    value: R;
};
