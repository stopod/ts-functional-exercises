// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// データ変換パイプライン - メイン実装
// 実際のビジネスアプリケーションで使用できる関数型データ処理システム

// ===========================================
// 型定義
// ===========================================

// Either型（エラーハンドリング用）
type Either<L, R> = Left<L> | Right<R>;
interface Left<L> { readonly _tag: 'Left'; readonly left: L; }
interface Right<R> { readonly _tag: 'Right'; readonly right: R; }

const left = <L, R = never>(value: L): Either<L, R> => ({ _tag: 'Left', left: value });
const right = <L = never, R = never>(value: R): Either<L, R> => ({ _tag: 'Right', right: value });
const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => either._tag === 'Left';
const isRight = <L, R>(either: Either<L, R>): either is Right<R> => either._tag === 'Right';

// パイプライン用の型
type PipelineError = {
  stage: string;
  message: string;
  data?: any;
  cause?: Error;
};

type PipelineResult<T> = Either<PipelineError[], T[]>;

type ValidationRule<T> = (value: any) => Either<string, T>;
type TransformFunction<T, U> = (value: T) => U;
type FilterPredicate<T> = (value: T) => boolean;
type AggregateFunction<T, U> = (values: T[]) => U;

// ===========================================
// DataPipeline メインクラス
// ===========================================

export class DataPipeline<T> {
  private data: Promise<PipelineResult<T>>;

  constructor(data: Promise<PipelineResult<T>>) {
    this.data = data;
  }

  // ファクトリーメソッド: CSVファイルから作成
  static fromCsv<T>(filePath: string): DataPipeline<Record<string, string>> {
    const data = import('fs/promises')
      .then(fs => fs.readFile(filePath, 'utf-8'))
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

            const row: Record<string, string> = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return right(row);
          });

          const errors: PipelineError[] = [];
          const successes: Record<string, string>[] = [];

          rows.forEach(row => {
            if (isLeft(row)) {
              errors.push(row.left);
            } else {
              successes.push(row.right);
            }
          });

          return errors.length > 0 ? left(errors) : right(successes);
        } catch (error) {
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
  static fromJson<T>(filePath: string): DataPipeline<T> {
    const data = import('fs/promises')
      .then(fs => fs.readFile(filePath, 'utf-8'))
      .then(content => {
        try {
          const parsed = JSON.parse(content);
          const array = Array.isArray(parsed) ? parsed : [parsed];
          return right(array);
        } catch (error) {
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
  static fromApi<T>(url: string, options?: RequestInit): DataPipeline<T> {
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
  static from<T>(data: T[]): DataPipeline<T> {
    return new DataPipeline(Promise.resolve(right(data)));
  }

  // バリデーション
  validate<U>(validator: ValidationRule<U>): DataPipeline<U> {
    const newData = this.data.then(result => {
      if (isLeft(result)) return result;

      const errors: PipelineError[] = [];
      const successes: U[] = [];

      result.right.forEach((item, index) => {
        const validation = validator(item);
        if (isLeft(validation)) {
          errors.push({
            stage: 'validate',
            message: `Item ${index}: ${validation.left}`,
            data: item
          });
        } else {
          successes.push(validation.right);
        }
      });

      return errors.length > 0 ? left(errors) : right(successes);
    });

    return new DataPipeline(newData);
  }

  // データ変換
  transform<U>(fn: TransformFunction<T, U>): DataPipeline<U> {
    const newData = this.data.then(result => {
      if (isLeft(result)) return result;

      try {
        const transformed = result.right.map(fn);
        return right(transformed);
      } catch (error) {
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
  filter(predicate: FilterPredicate<T>): DataPipeline<T> {
    const newData = this.data.then(result => {
      if (isLeft(result)) return result;

      try {
        const filtered = result.right.filter(predicate);
        return right(filtered);
      } catch (error) {
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
  map<U>(fn: TransformFunction<T, U>): DataPipeline<U> {
    return this.transform(fn);
  }

  // 並行処理での変換
  mapAsync<U>(fn: (value: T) => Promise<U>): DataPipeline<U> {
    const newData = this.data.then(async result => {
      if (isLeft(result)) return result;

      try {
        const promises = result.right.map(fn);
        const transformed = await Promise.all(promises);
        return right(transformed);
      } catch (error) {
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
  groupBy<K extends string | number>(keyFn: (item: T) => K): DataPipeline<{ key: K; items: T[] }> {
    const newData = this.data.then(result => {
      if (isLeft(result)) return result;

      try {
        const groups = new Map<K, T[]>();
        
        result.right.forEach(item => {
          const key = keyFn(item);
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(item);
        });

        const groupedArray = Array.from(groups.entries()).map(([key, items]) => ({
          key,
          items
        }));

        return right(groupedArray);
      } catch (error) {
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
  aggregate<U>(fn: AggregateFunction<T, U>): DataPipeline<U> {
    const newData = this.data.then(result => {
      if (isLeft(result)) return result;

      try {
        const aggregated = fn(result.right);
        return right([aggregated]);
      } catch (error) {
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
  collect(): DataPipeline<T> {
    return this;
  }

  // 他のパイプラインとの結合
  join<U, V>(
    other: DataPipeline<U>,
    joinFn: (left: T, right: U) => V | null
  ): DataPipeline<V> {
    const newData = Promise.all([this.data, other.data]).then(([leftResult, rightResult]) => {
      if (isLeft(leftResult)) return leftResult;
      if (isLeft(rightResult)) return rightResult;

      try {
        const joined: V[] = [];
        
        leftResult.right.forEach(leftItem => {
          rightResult.right.forEach(rightItem => {
            const result = joinFn(leftItem, rightItem);
            if (result !== null) {
              joined.push(result);
            }
          });
        });

        return right(joined);
      } catch (error) {
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
  async run(): Promise<PipelineResult<T>> {
    return this.data;
  }

  // 成功時のみ実行
  async runAndGet(): Promise<T[]> {
    const result = await this.data;
    if (isLeft(result)) {
      throw new Error(`Pipeline failed: ${result.left.map(e => e.message).join(', ')}`);
    }
    return result.right;
  }

  // 統計情報の取得
  async getStats(): Promise<{
    totalItems: number;
    errors: PipelineError[];
    hasErrors: boolean;
  }> {
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
  recover(recoveryFn: (errors: PipelineError[]) => T[]): DataPipeline<T> {
    const newData = this.data.then(result => {
      if (isLeft(result)) {
        try {
          const recovered = recoveryFn(result.left);
          return right(recovered);
        } catch (error) {
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
  debug(label?: string): DataPipeline<T> {
    const newData = this.data.then(result => {
      console.log(`[DEBUG${label ? ` - ${label}` : ''}]:`, result);
      return result;
    });

    return new DataPipeline(newData);
  }
}

// ===========================================
// ヘルパー関数とユーティリティ
// ===========================================

// よく使用される変換関数
export const transforms = {
  // 文字列の正規化
  normalizeString: (str: string): string => 
    str.trim().toLowerCase().replace(/\s+/g, ' '),

  // 数値の解析
  parseNumber: (str: string): number => {
    const num = parseFloat(str);
    if (isNaN(num)) throw new Error(`Cannot parse "${str}" as number`);
    return num;
  },

  // 日付の解析
  parseDate: (str: string): Date => {
    const date = new Date(str);
    if (isNaN(date.getTime())) throw new Error(`Cannot parse "${str}" as date`);
    return date;
  },

  // プロパティの抽出
  pick: <T, K extends keyof T>(keys: K[]) => (obj: T): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      result[key] = obj[key];
    });
    return result;
  },

  // プロパティの除外
  omit: <T, K extends keyof T>(keys: K[]) => (obj: T): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete (result as any)[key];
    });
    return result;
  }
};

// よく使用される集計関数
export const aggregates = {
  // 合計
  sum: (items: number[]): number => 
    items.reduce((sum, item) => sum + item, 0),

  // 平均
  average: (items: number[]): number => 
    items.length > 0 ? aggregates.sum(items) / items.length : 0,

  // 最大値
  max: (items: number[]): number => 
    items.length > 0 ? Math.max(...items) : 0,

  // 最小値
  min: (items: number[]): number => 
    items.length > 0 ? Math.min(...items) : 0,

  // カウント
  count: <T>(items: T[]): number => items.length,

  // ユニークカウント
  uniqueCount: <T>(items: T[], keyFn?: (item: T) => any): number => {
    if (!keyFn) return new Set(items).size;
    return new Set(items.map(keyFn)).size;
  }
};

// ===========================================
// エクスポート
// ===========================================

export { PipelineError, PipelineResult, ValidationRule, TransformFunction, FilterPredicate, AggregateFunction };