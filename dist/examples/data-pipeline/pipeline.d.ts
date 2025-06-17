type Either<L, R> = Left<L> | Right<R>;
interface Left<L> {
    readonly _tag: 'Left';
    readonly left: L;
}
interface Right<R> {
    readonly _tag: 'Right';
    readonly right: R;
}
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
export declare class DataPipeline<T> {
    private data;
    constructor(data: Promise<PipelineResult<T>>);
    static fromCsv<T>(filePath: string): DataPipeline<Record<string, string>>;
    static fromJson<T>(filePath: string): DataPipeline<T>;
    static fromApi<T>(url: string, options?: RequestInit): DataPipeline<T>;
    static from<T>(data: T[]): DataPipeline<T>;
    validate<U>(validator: ValidationRule<U>): DataPipeline<U>;
    transform<U>(fn: TransformFunction<T, U>): DataPipeline<U>;
    filter(predicate: FilterPredicate<T>): DataPipeline<T>;
    map<U>(fn: TransformFunction<T, U>): DataPipeline<U>;
    mapAsync<U>(fn: (value: T) => Promise<U>): DataPipeline<U>;
    groupBy<K extends string | number>(keyFn: (item: T) => K): DataPipeline<{
        key: K;
        items: T[];
    }>;
    aggregate<U>(fn: AggregateFunction<T, U>): DataPipeline<U>;
    collect(): DataPipeline<T>;
    join<U, V>(other: DataPipeline<U>, joinFn: (left: T, right: U) => V | null): DataPipeline<V>;
    run(): Promise<PipelineResult<T>>;
    runAndGet(): Promise<T[]>;
    getStats(): Promise<{
        totalItems: number;
        errors: PipelineError[];
        hasErrors: boolean;
    }>;
    recover(recoveryFn: (errors: PipelineError[]) => T[]): DataPipeline<T>;
    debug(label?: string): DataPipeline<T>;
}
export declare const transforms: {
    normalizeString: (str: string) => string;
    parseNumber: (str: string) => number;
    parseDate: (str: string) => Date;
    pick: <T, K extends keyof T>(keys: K[]) => (obj: T) => Pick<T, K>;
    omit: <T, K extends keyof T>(keys: K[]) => (obj: T) => Omit<T, K>;
};
export declare const aggregates: {
    sum: (items: number[]) => number;
    average: (items: number[]) => number;
    max: (items: number[]) => number;
    min: (items: number[]) => number;
    count: <T>(items: T[]) => number;
    uniqueCount: <T>(items: T[], keyFn?: (item: T) => any) => number;
};
export { PipelineError, PipelineResult, ValidationRule, TransformFunction, FilterPredicate, AggregateFunction };
