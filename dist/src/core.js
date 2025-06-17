"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// Core functional programming utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.constant = exports.flip = exports.partial2 = exports.curry4 = exports.curry3 = exports.curry = exports.pipeWith = exports.pipe = exports.compose3 = exports.compose = exports.identity = void 0;
exports.flow = flow;
exports.partial = partial;
// Identity function
const identity = (x) => x;
exports.identity = identity;
// Composition - 2つの関数を合成
const compose = (f, g) => (a) => f(g(a));
exports.compose = compose;
// 3つの関数を合成
const compose3 = (f, g, h) => (a) => f(g(h(a)));
exports.compose3 = compose3;
// Pipe - 関数を左から右に適用（同じ型）
const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value);
exports.pipe = pipe;
// Pipe - 型変換可能な版
const pipeWith = (value) => ({
    pipe: (fn) => (0, exports.pipeWith)(fn(value)),
    value: () => value
});
exports.pipeWith = pipeWith;
function flow(...fns) {
    return (input) => fns.reduce((acc, fn) => fn(acc), input);
}
// Curry - 2引数の関数をカリー化
const curry = (fn) => (a) => (b) => fn(a, b);
exports.curry = curry;
// 3引数の関数をカリー化
const curry3 = (fn) => (a) => (b) => (c) => fn(a, b, c);
exports.curry3 = curry3;
// 4引数の関数をカリー化
const curry4 = (fn) => (a) => (b) => (c) => (d) => fn(a, b, c, d);
exports.curry4 = curry4;
function partial(fn, ...partialArgs) {
    return (...remainingArgs) => {
        const allArgs = [...partialArgs, ...remainingArgs];
        return fn(...allArgs);
    };
}
// より型安全な部分適用（2引数用）
const partial2 = (fn) => (a) => (b) => fn(a, b);
exports.partial2 = partial2;
// Flip - 2引数関数の引数順序を入れ替え
const flip = (fn) => (b, a) => fn(a, b);
exports.flip = flip;
// Constant - 常に同じ値を返す関数を作成
const constant = (value) => () => value;
exports.constant = constant;
//# sourceMappingURL=core.js.map