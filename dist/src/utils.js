"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// Utility functions for functional programming
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybe = exports.toMaybe = exports.fromMaybe = exports.eitherToOption = exports.optionToEither = exports.safeProp = exports.safeParseJSON = exports.safeParseFloat = exports.safeParseInt = exports.swap = exports.foldEither = exports.flatMapEither = exports.mapLeft = exports.mapEither = exports.isRight = exports.isLeft = exports.right = exports.left = exports.filterOption = exports.fold = exports.getOrElse = exports.flatMapOption = exports.mapOption = exports.isNone = exports.isSome = exports.none = exports.some = exports.last = exports.head = exports.safeGet = exports.reduce = exports.filter = exports.map = void 0;
// Array utilities
const map = (fn) => (arr) => arr.map(fn);
exports.map = map;
const filter = (predicate) => (arr) => arr.filter(predicate);
exports.filter = filter;
const reduce = (fn, initial) => (arr) => arr.reduce(fn, initial);
exports.reduce = reduce;
// 安全な配列アクセス
const safeGet = (arr, index) => index >= 0 && index < arr.length ? (0, exports.some)(arr[index]) : exports.none;
exports.safeGet = safeGet;
// 配列の最初/最後の要素を安全に取得
const head = (arr) => (0, exports.safeGet)(arr, 0);
exports.head = head;
const last = (arr) => (0, exports.safeGet)(arr, arr.length - 1);
exports.last = last;
// Option constructors
const some = (value) => ({ _tag: 'Some', value });
exports.some = some;
exports.none = { _tag: 'None' };
// Option type guards
const isSome = (option) => option._tag === 'Some';
exports.isSome = isSome;
const isNone = (option) => option._tag === 'None';
exports.isNone = isNone;
// Option operations
const mapOption = (fn) => (option) => (0, exports.isSome)(option) ? (0, exports.some)(fn(option.value)) : exports.none;
exports.mapOption = mapOption;
const flatMapOption = (fn) => (option) => (0, exports.isSome)(option) ? fn(option.value) : exports.none;
exports.flatMapOption = flatMapOption;
const getOrElse = (defaultValue) => (option) => (0, exports.isSome)(option) ? option.value : defaultValue;
exports.getOrElse = getOrElse;
const fold = (onNone, onSome) => (option) => (0, exports.isSome)(option) ? onSome(option.value) : onNone();
exports.fold = fold;
// Optionのフィルタリング
const filterOption = (predicate) => (option) => (0, exports.isSome)(option) && predicate(option.value) ? option : exports.none;
exports.filterOption = filterOption;
// Either constructors
const left = (value) => ({ _tag: 'Left', left: value });
exports.left = left;
const right = (value) => ({ _tag: 'Right', right: value });
exports.right = right;
// Either type guards
const isLeft = (either) => either._tag === 'Left';
exports.isLeft = isLeft;
const isRight = (either) => either._tag === 'Right';
exports.isRight = isRight;
// Either operations
const mapEither = (fn) => (either) => (0, exports.isRight)(either) ? (0, exports.right)(fn(either.right)) : either;
exports.mapEither = mapEither;
const mapLeft = (fn) => (either) => (0, exports.isLeft)(either) ? (0, exports.left)(fn(either.left)) : either;
exports.mapLeft = mapLeft;
const flatMapEither = (fn) => (either) => (0, exports.isRight)(either) ? fn(either.right) : either;
exports.flatMapEither = flatMapEither;
const foldEither = (onLeft, onRight) => (either) => (0, exports.isLeft)(either) ? onLeft(either.left) : onRight(either.right);
exports.foldEither = foldEither;
// Eitherの変換ユーティリティ
const swap = (either) => (0, exports.isLeft)(either) ? (0, exports.right)(either.left) : (0, exports.left)(either.right);
exports.swap = swap;
// 安全な数値変換
const safeParseInt = (str, radix) => {
    const result = parseInt(str, radix);
    return isNaN(result) ? exports.none : (0, exports.some)(result);
};
exports.safeParseInt = safeParseInt;
const safeParseFloat = (str) => {
    const result = parseFloat(str);
    return isNaN(result) ? exports.none : (0, exports.some)(result);
};
exports.safeParseFloat = safeParseFloat;
// 安全なJSON解析
const safeParseJSON = (jsonString) => {
    try {
        const result = JSON.parse(jsonString);
        return (0, exports.some)(result);
    }
    catch {
        return exports.none;
    }
};
exports.safeParseJSON = safeParseJSON;
// 安全なプロパティアクセス
const safeProp = (key) => (obj) => {
    const value = obj[key];
    return value != null ? (0, exports.some)(value) : exports.none;
};
exports.safeProp = safeProp;
// OptionとEitherの相互変換
const optionToEither = (error) => (option) => (0, exports.isSome)(option) ? (0, exports.right)(option.value) : (0, exports.left)(error);
exports.optionToEither = optionToEither;
const eitherToOption = (either) => (0, exports.isRight)(either) ? (0, exports.some)(either.right) : exports.none;
exports.eitherToOption = eitherToOption;
const fromMaybe = (maybe) => maybe != null ? (0, exports.some)(maybe) : exports.none;
exports.fromMaybe = fromMaybe;
const toMaybe = (option) => (0, exports.isSome)(option) ? option.value : null;
exports.toMaybe = toMaybe;
const maybe = (fn) => (value) => value == null ? null : fn(value);
exports.maybe = maybe;
//# sourceMappingURL=utils.js.map