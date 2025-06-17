"use strict";
// Utility functions for functional programming
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRight = exports.isLeft = exports.right = exports.left = exports.maybe = exports.reduce = exports.filter = exports.map = void 0;
// Array utilities
const map = (fn) => (arr) => arr.map(fn);
exports.map = map;
const filter = (predicate) => (arr) => arr.filter(predicate);
exports.filter = filter;
const reduce = (fn, initial) => (arr) => arr.reduce(fn, initial);
exports.reduce = reduce;
const maybe = (fn) => (value) => value == null ? null : fn(value);
exports.maybe = maybe;
const left = (value) => ({ type: 'left', value });
exports.left = left;
const right = (value) => ({ type: 'right', value });
exports.right = right;
const isLeft = (either) => either.type === 'left';
exports.isLeft = isLeft;
const isRight = (either) => either.type === 'right';
exports.isRight = isRight;
//# sourceMappingURL=utils.js.map