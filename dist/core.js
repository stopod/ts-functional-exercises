"use strict";
// Core functional programming utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.partial = exports.curry = exports.pipe = exports.compose = exports.identity = void 0;
// Identity function
const identity = (x) => x;
exports.identity = identity;
// Composition
const compose = (f, g) => (a) => f(g(a));
exports.compose = compose;
// Pipe
const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value);
exports.pipe = pipe;
// Curry
const curry = (fn) => (a) => (b) => fn(a, b);
exports.curry = curry;
// Partial application
const partial = (fn, ...partialArgs) => (...remainingArgs) => fn(...partialArgs.concat(remainingArgs));
exports.partial = partial;
//# sourceMappingURL=core.js.map