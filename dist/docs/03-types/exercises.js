"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル3: 型を活用した安全な処理 - 練習問題
// Option/Maybe型とEither型を使った堅牢なコード作成を学びましょう
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLevel3Tests = void 0;
// src/utils.ts から型と関数をインポート
const utils_1 = require("../../src/utils");
// ===========================================
// 型定義セクション（練習で使用する基本型）
// ===========================================
// Option/Maybe型とEither型は src/utils.ts からインポート済み
// ===========================================
// 問題1: Option/Maybe型の基本操作（インポートした関数を使用）
// ===========================================
/**
 * 問題1-1: インポートしたOption関数を使って基本的な操作を実装してください
 * 注意: some, none, isSome, isNone, mapOption, flatMapOption, getOrElse は既にインポート済みです
 */
// 使用例とテスト用の関数を実装してください
// 例: 値をOptionでラップする関数
const wrapValue = (value) => value != null ? (0, utils_1.some)(value) : utils_1.none;
// 例: Option値を安全に2倍にする関数
const doubleOption = (value) => (0, utils_1.mapOption)((n) => n * 2)(value);
// TODO: ユーザー設定からテーマを安全に取得する関数を実装
const getUserTheme = (settings) => {
    return (0, utils_1.safeProp)('theme')(settings);
};
// TODO: ユーザー設定からフォントサイズを数値として安全に取得する関数を実装
const getUserFontSize = (settings) => {
    return (0, utils_1.flatMapOption)((sizeStr) => (0, utils_1.safeParseInt)(sizeStr))((0, utils_1.safeProp)('fontSize')(settings));
};
// TODO: 設定文字列からJSON設定を安全に解析する関数を実装
const parseUserSettings = (configJson) => {
    return (0, utils_1.safeParseJSON)(configJson);
};
// TODO: ユーザーの名前を安全に取得する関数（safePropとflatMapOptionを使用）
const getUserName = (user) => {
    return (0, utils_1.flatMapOption)((profile) => (0, utils_1.flatMapOption)((personal) => (0, utils_1.safeProp)('name')(personal))((0, utils_1.safeProp)('personal')(profile)))((0, utils_1.safeProp)('profile')(user));
};
// TODO: ユーザーの都市名を安全に取得する関数
const getUserCity = (user) => {
    return (0, utils_1.flatMapOption)((profile) => (0, utils_1.flatMapOption)((personal) => (0, utils_1.flatMapOption)((address) => (0, utils_1.safeProp)('city')(address))((0, utils_1.safeProp)('address')(personal)))((0, utils_1.safeProp)('personal')(profile)))((0, utils_1.safeProp)('profile')(user));
};
// TODO: ユーザーの年齢を安全に取得し、成人かどうかを判定する関数
const isUserAdult = (user) => {
    return (0, utils_1.mapOption)((age) => age >= 18)((0, utils_1.flatMapOption)((profile) => (0, utils_1.flatMapOption)((personal) => (0, utils_1.safeProp)('age')(personal))((0, utils_1.safeProp)('personal')(profile)))((0, utils_1.safeProp)('profile')(user)));
};
// 例: 空文字列チェック
const validateNotEmpty = (field, value) => {
    return value.trim().length > 0
        ? (0, utils_1.right)(value)
        : (0, utils_1.left)({ field, message: '必須項目です' });
};
// 例: 最小長チェック
const validateMinLength = (field, minLength) => (value) => {
    return value.length >= minLength
        ? (0, utils_1.right)(value)
        : (0, utils_1.left)({ field, message: `${minLength}文字以上で入力してください` });
};
// TODO: CSV行データをCleanedUserに変換する関数
// const transformCsvRowToUser = (row: RawCsvRow): Either<string[], CleanedUser> => {
//   // ここに実装
//   // 期待されるCSVカラム: id, first_name, last_name, email, birth_date, status
//   // 変換処理:
//   // - id: 数値変換
//   // - fullName: first_name + ' ' + last_name
//   // - email: バリデーション
//   // - birthDate: 日付文字列をDateオブジェクトに変換
//   // - isActive: status === 'active'
// };
// TODO: 複数のCSV行を一括変換する関数
// const transformCsvData = (rows: RawCsvRow[]): {
//   successes: CleanedUser[];
//   errors: Array<{row: number; errors: string[]}>;
// } => {
//   // ここに実装
//   // 各行を変換し、成功・失敗を分けて返す
// };
// ===========================================
// テスト実行関数
// ===========================================
const runLevel3Tests = () => {
    console.log('=== レベル3 練習問題のテスト ===');
    console.log('solutions.ts を確認して、実装を確認してください');
    // 基本的なテストケース例:
    console.log('\n基本的なテストケース例:');
    console.log('// Option型のテスト');
    console.log('// const numbers = [1, 2, 3];');
    console.log('// console.log(safeGet(numbers, 1)); // Some(2)');
    console.log('// console.log(safeGet(numbers, 5)); // None');
    console.log('\n// Either型のテスト');
    console.log('// console.log(validateEmail("test@example.com")); // Right');
    console.log('// console.log(validateEmail("invalid-email")); // Left');
};
exports.runLevel3Tests = runLevel3Tests;
//# sourceMappingURL=exercises.js.map