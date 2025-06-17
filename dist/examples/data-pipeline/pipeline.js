"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// データ変換パイプライン - メイン実装
// 実際のビジネスアプリケーションで使用できる関数型データ処理システム
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregates = exports.transforms = exports.DataPipeline = void 0;
const left = (value) => ({ _tag: 'Left', left: value });
const right = (value) => ({ _tag: 'Right', right: value });
const isLeft = (either) => either._tag === 'Left';
const isRight = (either) => either._tag === 'Right';
// ===========================================
// DataPipeline メインクラス
// ===========================================
class DataPipeline {
    constructor(data) {
        this.data = data;
    }
    // ファクトリーメソッド: CSVファイルから作成
    static fromCsv(filePath) {
        const data = Promise.resolve().then(() => __importStar(require('fs/promises'))).then(fs => fs.readFile(filePath, 'utf-8'))
            .then(content => {
            try {
                const lines = content.trim().split('\n');
                if (lines.length === 0) {
                    return left([{ stage: 'parse', message: 'Empty CSV file' }]);
                }
                const headers = lines[0]?.split(',').map(h => h.trim()) || [];
                const rows = lines.slice(1).map((line, index) => {
                    const values = line.split(',').map(v => v.trim());
                    if (values.length !== headers.length) {
                        return left({
                            stage: 'parse',
                            message: `Row ${index + 2}: Column count mismatch`,
                            data: { expected: headers.length, actual: values.length }
                        });
                    }
                    const row = {};
                    headers.forEach((header, i) => {
                        row[header] = values[i] || '';
                    });
                    return right(row);
                });
                const errors = [];
                const successes = [];
                rows.forEach(row => {
                    if (isLeft(row)) {
                        errors.push(row.left);
                    }
                    else {
                        successes.push(row.right);
                    }
                });
                return errors.length > 0 ? left(errors) : right(successes);
            }
            catch (error) {
                return left([{
                        stage: 'parse',
                        message: 'CSV parsing failed',
                        cause: error instanceof Error ? error : new Error(String(error))
                    }]);
            }
        })
            .catch(error => left([{
                stage: 'read',
                message: 'File reading failed',
                cause: error instanceof Error ? error : new Error(String(error))
            }]));
        return new DataPipeline(data);
    }
    // ファクトリーメソッド: JSONファイルから作成
    static fromJson(filePath) {
        const data = Promise.resolve().then(() => __importStar(require('fs/promises'))).then(fs => fs.readFile(filePath, 'utf-8'))
            .then(content => {
            try {
                const parsed = JSON.parse(content);
                const array = Array.isArray(parsed) ? parsed : [parsed];
                return right(array);
            }
            catch (error) {
                return left([{
                        stage: 'parse',
                        message: 'JSON parsing failed',
                        cause: error instanceof Error ? error : new Error(String(error))
                    }]);
            }
        })
            .catch(error => left([{
                stage: 'read',
                message: 'File reading failed',
                cause: error instanceof Error ? error : new Error(String(error))
            }]));
        return new DataPipeline(data);
    }
    // ファクトリーメソッド: APIから作成
    static fromApi(url, options) {
        const data = fetch(url, options)
            .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
            .then(data => {
            const array = Array.isArray(data) ? data : [data];
            return right(array);
        })
            .catch(error => left([{
                stage: 'fetch',
                message: 'API call failed',
                cause: error instanceof Error ? error : new Error(String(error))
            }]));
        return new DataPipeline(data);
    }
    // ファクトリーメソッド: 静的データから作成
    static from(data) {
        return new DataPipeline(Promise.resolve(right(data)));
    }
    // バリデーション
    validate(validator) {
        const newData = this.data.then(result => {
            if (isLeft(result))
                return result;
            const errors = [];
            const successes = [];
            result.right.forEach((item, index) => {
                const validation = validator(item);
                if (isLeft(validation)) {
                    errors.push({
                        stage: 'validate',
                        message: `Item ${index}: ${validation.left}`,
                        data: item
                    });
                }
                else {
                    successes.push(validation.right);
                }
            });
            return errors.length > 0 ? left(errors) : right(successes);
        });
        return new DataPipeline(newData);
    }
    // データ変換
    transform(fn) {
        const newData = this.data.then(result => {
            if (isLeft(result))
                return result;
            try {
                const transformed = result.right.map(fn);
                return right(transformed);
            }
            catch (error) {
                return left([{
                        stage: 'transform',
                        message: 'Transformation failed',
                        cause: error instanceof Error ? error : new Error(String(error))
                    }]);
            }
        });
        return new DataPipeline(newData);
    }
    // フィルタリング
    filter(predicate) {
        const newData = this.data.then(result => {
            if (isLeft(result))
                return result;
            try {
                const filtered = result.right.filter(predicate);
                return right(filtered);
            }
            catch (error) {
                return left([{
                        stage: 'filter',
                        message: 'Filtering failed',
                        cause: error instanceof Error ? error : new Error(String(error))
                    }]);
            }
        });
        return new DataPipeline(newData);
    }
    // マッピング（変換の別名）
    map(fn) {
        return this.transform(fn);
    }
    // 並行処理での変換
    mapAsync(fn) {
        const newData = this.data.then(async (result) => {
            if (isLeft(result))
                return result;
            try {
                const promises = result.right.map(fn);
                const transformed = await Promise.all(promises);
                return right(transformed);
            }
            catch (error) {
                return left([{
                        stage: 'mapAsync',
                        message: 'Async transformation failed',
                        cause: error instanceof Error ? error : new Error(String(error))
                    }]);
            }
        });
        return new DataPipeline(newData);
    }
    // グループ化
    groupBy(keyFn) {
        const newData = this.data.then(result => {
            if (isLeft(result))
                return result;
            try {
                const groups = new Map();
                result.right.forEach(item => {
                    const key = keyFn(item);
                    if (!groups.has(key)) {
                        groups.set(key, []);
                    }
                    groups.get(key).push(item);
                });
                const groupedArray = Array.from(groups.entries()).map(([key, items]) => ({
                    key,
                    items
                }));
                return right(groupedArray);
            }
            catch (error) {
                return left([{
                        stage: 'groupBy',
                        message: 'Grouping failed',
                        cause: error instanceof Error ? error : new Error(String(error))
                    }]);
            }
        });
        return new DataPipeline(newData);
    }
    // 集計
    aggregate(fn) {
        const newData = this.data.then(result => {
            if (isLeft(result))
                return result;
            try {
                const aggregated = fn(result.right);
                return right([aggregated]);
            }
            catch (error) {
                return left([{
                        stage: 'aggregate',
                        message: 'Aggregation failed',
                        cause: error instanceof Error ? error : new Error(String(error))
                    }]);
            }
        });
        return new DataPipeline(newData);
    }
    // データの収集（非集計）
    collect() {
        return this;
    }
    // 他のパイプラインとの結合
    join(other, joinFn) {
        const newData = Promise.all([this.data, other.data]).then(([leftResult, rightResult]) => {
            if (isLeft(leftResult))
                return leftResult;
            if (isLeft(rightResult))
                return rightResult;
            try {
                const joined = [];
                leftResult.right.forEach(leftItem => {
                    rightResult.right.forEach(rightItem => {
                        const result = joinFn(leftItem, rightItem);
                        if (result !== null) {
                            joined.push(result);
                        }
                    });
                });
                return right(joined);
            }
            catch (error) {
                return left([{
                        stage: 'join',
                        message: 'Join operation failed',
                        cause: error instanceof Error ? error : new Error(String(error))
                    }]);
            }
        });
        return new DataPipeline(newData);
    }
    // データの取得
    async run() {
        return this.data;
    }
    // 成功時のみ実行
    async runAndGet() {
        const result = await this.data;
        if (isLeft(result)) {
            throw new Error(`Pipeline failed: ${result.left.map(e => e.message).join(', ')}`);
        }
        return result.right;
    }
    // 統計情報の取得
    async getStats() {
        const result = await this.data;
        if (isLeft(result)) {
            return {
                totalItems: 0,
                errors: result.left,
                hasErrors: true
            };
        }
        return {
            totalItems: result.right.length,
            errors: [],
            hasErrors: false
        };
    }
    // エラー回復
    recover(recoveryFn) {
        const newData = this.data.then(result => {
            if (isLeft(result)) {
                try {
                    const recovered = recoveryFn(result.left);
                    return right(recovered);
                }
                catch (error) {
                    return left([{
                            stage: 'recover',
                            message: 'Recovery failed',
                            cause: error instanceof Error ? error : new Error(String(error))
                        }]);
                }
            }
            return result;
        });
        return new DataPipeline(newData);
    }
    // デバッグ用: 中間結果の出力
    debug(label) {
        const newData = this.data.then(result => {
            console.log(`[DEBUG${label ? ` - ${label}` : ''}]:`, result);
            return result;
        });
        return new DataPipeline(newData);
    }
}
exports.DataPipeline = DataPipeline;
// ===========================================
// ヘルパー関数とユーティリティ
// ===========================================
// よく使用される変換関数
exports.transforms = {
    // 文字列の正規化
    normalizeString: (str) => str.trim().toLowerCase().replace(/\s+/g, ' '),
    // 数値の解析
    parseNumber: (str) => {
        const num = parseFloat(str);
        if (isNaN(num))
            throw new Error(`Cannot parse "${str}" as number`);
        return num;
    },
    // 日付の解析
    parseDate: (str) => {
        const date = new Date(str);
        if (isNaN(date.getTime()))
            throw new Error(`Cannot parse "${str}" as date`);
        return date;
    },
    // プロパティの抽出
    pick: (keys) => (obj) => {
        const result = {};
        keys.forEach(key => {
            result[key] = obj[key];
        });
        return result;
    },
    // プロパティの除外
    omit: (keys) => (obj) => {
        const result = { ...obj };
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    }
};
// よく使用される集計関数
exports.aggregates = {
    // 合計
    sum: (items) => items.reduce((sum, item) => sum + item, 0),
    // 平均
    average: (items) => items.length > 0 ? exports.aggregates.sum(items) / items.length : 0,
    // 最大値
    max: (items) => items.length > 0 ? Math.max(...items) : 0,
    // 最小値
    min: (items) => items.length > 0 ? Math.min(...items) : 0,
    // カウント
    count: (items) => items.length,
    // ユニークカウント
    uniqueCount: (items, keyFn) => {
        if (!keyFn)
            return new Set(items).size;
        return new Set(items.map(keyFn)).size;
    }
};
//# sourceMappingURL=pipeline.js.map