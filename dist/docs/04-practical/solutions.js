"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル4: 実践的パターン - 解答例（抜粋版）
// 実際のWebアプリケーション開発で使える高度な関数型プログラミング技術の解答例
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLevel4Tests = void 0;
const left = (value) => ({ _tag: 'Left', left: value });
const right = (value) => ({ _tag: 'Right', right: value });
const isLeft = (either) => either._tag === 'Left';
const isRight = (either) => either._tag === 'Right';
// TaskEither型の完全実装
class TaskEither {
    constructor(task) {
        this.task = task;
    }
    static of(value) {
        return new TaskEither(Promise.resolve(right(value)));
    }
    static left(error) {
        return new TaskEither(Promise.resolve(left(error)));
    }
    static fromPromise(promise, onError) {
        return new TaskEither(promise
            .then(value => right(value))
            .catch(error => left(onError(error))));
    }
    map(fn) {
        return new TaskEither(this.task.then(either => isRight(either) ? right(fn(either.right)) : either));
    }
    flatMap(fn) {
        return new TaskEither(this.task.then(either => isRight(either) ? fn(either.right).run() : Promise.resolve(either)));
    }
    run() {
        return this.task;
    }
}
// 安全なAPI呼び出し
const safeApiCall = (url) => TaskEither.fromPromise(fetch(url).then(async (res) => {
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
}), (error) => ({
    status: 500,
    message: error.message || 'Network error'
}));
// 並行API呼び出し
const fetchUserWithProfile = (userId) => {
    const userTask = safeApiCall(`/api/users/${userId}`);
    const profileTask = safeApiCall(`/api/users/${userId}/profile`);
    return new TaskEither(Promise.all([userTask.run(), profileTask.run()]).then(([userResult, profileResult]) => {
        if (isLeft(userResult))
            return userResult;
        if (isLeft(profileResult))
            return profileResult;
        return right({
            user: userResult.right,
            profile: profileResult.right
        });
    }));
};
const memoizeWithExpiry = (fn, ttlMs = 60000, keyGenerator) => {
    const cache = new Map();
    const generateKey = keyGenerator || ((...args) => JSON.stringify(args));
    const memoized = ((...args) => {
        const key = generateKey(...args);
        const now = Date.now();
        const cached = cache.get(key);
        if (cached && cached.expiry > now) {
            return cached.value;
        }
        const result = fn(...args);
        cache.set(key, { value: result, expiry: now + ttlMs });
        return result;
    });
    memoized.cache = cache;
    memoized.clear = () => cache.clear();
    memoized.clearExpired = () => {
        const now = Date.now();
        for (const [key, entry] of Array.from(cache.entries())) {
            if (entry.expiry <= now) {
                cache.delete(key);
            }
        }
    };
    return memoized;
};
// LRUキャッシュ実装
class LRUCache {
    constructor(capacity) {
        this.cache = new Map();
        this.capacity = capacity;
    }
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // 最新として扱うため、一度削除して再追加
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.capacity) {
            // 最も古いアイテム（最初のキー）を削除
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
const createAction = (type) => (payload) => ({ type, payload });
const createSimpleAction = (type) => () => ({ type, payload: {} });
const matchAction = (matchers) => (defaultHandler) => (state, action) => {
    const handler = matchers[action.type];
    return handler ? handler(state, action) : defaultHandler(state, action);
};
// 型安全なAction作成関数
const addItem = (item) => ({ type: 'ADD_ITEM', payload: item });
const removeItem = (id) => ({ type: 'REMOVE_ITEM', payload: { id } });
const updateQuantity = (id, quantity) => ({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
const applyDiscount = (code, amount) => ({ type: 'APPLY_DISCOUNT', payload: { code, amount } });
const clearCart = () => ({ type: 'CLEAR_CART', payload: {} });
const calculateTotal = (items, discountAmount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return Math.max(0, subtotal - discountAmount);
};
const cartReducer = matchAction({
    ADD_ITEM: (state, action) => {
        // 型安全: action.payloadは自動的にCartItem型として推論される
        const payload = action.payload;
        const existingItem = state.items.find(item => item.id === payload.id);
        let newItems;
        if (existingItem) {
            newItems = state.items.map(item => item.id === payload.id
                ? { ...item, quantity: item.quantity + payload.quantity }
                : item);
        }
        else {
            newItems = [...state.items, payload];
        }
        return {
            ...state,
            items: newItems,
            total: calculateTotal(newItems, state.discountAmount)
        };
    },
    REMOVE_ITEM: (state, action) => {
        // 型安全: action.payloadは自動的に{ id: string }型として推論される
        const payload = action.payload;
        const newItems = state.items.filter(item => item.id !== payload.id);
        return {
            ...state,
            items: newItems,
            total: calculateTotal(newItems, state.discountAmount)
        };
    },
    UPDATE_QUANTITY: (state, action) => {
        // 型安全: action.payloadは自動的に{ id: string; quantity: number }型として推論される
        const payload = action.payload;
        const newItems = state.items.map(item => item.id === payload.id
            ? { ...item, quantity: payload.quantity }
            : item).filter(item => item.quantity > 0);
        return {
            ...state,
            items: newItems,
            total: calculateTotal(newItems, state.discountAmount)
        };
    },
    APPLY_DISCOUNT: (state, action) => {
        // 型安全: action.payloadは自動的に{ code: string; amount: number }型として推論される
        const payload = action.payload;
        const newState = {
            ...state,
            discountCode: payload.code,
            discountAmount: payload.amount
        };
        return {
            ...newState,
            total: calculateTotal(state.items, payload.amount)
        };
    },
    CLEAR_CART: () => ({
        items: [],
        total: 0,
        discountAmount: 0
    })
})((state) => state);
// 基本バリデータ
const string = {
    validate: (value) => typeof value === 'string'
        ? right(value)
        : left([{ field: 'root', message: 'Expected string' }])
};
const number = {
    validate: (value) => typeof value === 'number'
        ? right(value)
        : left([{ field: 'root', message: 'Expected number' }])
};
const boolean = {
    validate: (value) => typeof value === 'boolean'
        ? right(value)
        : left([{ field: 'root', message: 'Expected boolean' }])
};
// 配列バリデータ
const array = (itemValidator) => ({
    validate: (value) => {
        if (!Array.isArray(value)) {
            return left([{ field: 'root', message: 'Expected array' }]);
        }
        const errors = [];
        const results = [];
        value.forEach((item, index) => {
            const result = itemValidator.validate(item);
            if (isLeft(result)) {
                errors.push(...result.left.map(err => ({
                    ...err,
                    field: `[${index}].${err.field}`
                })));
            }
            else {
                results.push(result.right);
            }
        });
        return errors.length > 0 ? left(errors) : right(results);
    }
});
// オブジェクトバリデータ
const object = (schema) => ({
    validate: (value) => {
        if (typeof value !== 'object' || value === null) {
            return left([{ field: 'root', message: 'Expected object' }]);
        }
        const obj = value;
        const errors = [];
        const result = {};
        for (const [key, validator] of Object.entries(schema)) {
            const fieldResult = validator.validate(obj[key]);
            if (isLeft(fieldResult)) {
                const fieldErrors = fieldResult.left;
                errors.push(...fieldErrors.map((err) => ({
                    ...err,
                    field: key
                })));
            }
            else {
                result[key] = fieldResult.right;
            }
        }
        return errors.length > 0 ? left(errors) : right(result);
    }
});
// バリデータコンビネータ
const minLength = (min) => (validator) => ({
    validate: (value) => {
        const stringResult = validator.validate(value);
        if (isLeft(stringResult))
            return stringResult;
        return stringResult.right.length >= min
            ? right(stringResult.right)
            : left([{ field: 'root', message: `Minimum length is ${min}` }]);
    }
});
const maxLength = (max) => (validator) => ({
    validate: (value) => {
        const stringResult = validator.validate(value);
        if (isLeft(stringResult))
            return stringResult;
        return stringResult.right.length <= max
            ? right(stringResult.right)
            : left([{ field: 'root', message: `Maximum length is ${max}` }]);
    }
});
const pattern = (regex, message) => (validator) => ({
    validate: (value) => {
        const stringResult = validator.validate(value);
        if (isLeft(stringResult))
            return stringResult;
        return regex.test(stringResult.right)
            ? right(stringResult.right)
            : left([{ field: 'root', message }]);
    }
});
const email = (validator) => pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')(validator);
const url = (validator) => pattern(/^https?:\/\/.+/, 'Invalid URL format')(validator);
const min = (minimum) => (validator) => ({
    validate: (value) => {
        const numberResult = validator.validate(value);
        if (isLeft(numberResult))
            return numberResult;
        return numberResult.right >= minimum
            ? right(numberResult.right)
            : left([{ field: 'root', message: `Minimum value is ${minimum}` }]);
    }
});
const max = (maximum) => (validator) => ({
    validate: (value) => {
        const numberResult = validator.validate(value);
        if (isLeft(numberResult))
            return numberResult;
        return numberResult.right <= maximum
            ? right(numberResult.right)
            : left([{ field: 'root', message: `Maximum value is ${maximum}` }]);
    }
});
// パイプライン風のバリデーション
const pipe = (...validators) => (baseValidator) => validators.reduce((acc, validator) => validator(acc), baseValidator);
// 使用例
const userValidator = object({
    name: pipe(minLength(2), maxLength(50))(string),
    email: email(string),
    age: pipe(min(0), max(150))(number),
    isActive: boolean,
    tags: array(string)
});
const validateUser = (data) => userValidator.validate(data);
// エラーファクトリー
const createError = (code, message, category, severity, details, cause) => ({
    code,
    message,
    category,
    severity,
    ...(details && { details }),
    ...(cause && { cause }),
    timestamp: new Date(),
    ...(cause?.stack || new Error().stack) && { stack: cause?.stack || new Error().stack }
});
// 事前定義されたエラータイプ
const ErrorTypes = {
    NETWORK_ERROR: (message, cause) => createError('NETWORK_ERROR', message, 'network', 'medium', undefined, cause),
    VALIDATION_ERROR: (field, message) => createError('VALIDATION_ERROR', message, 'validation', 'low', { field }),
    UNAUTHORIZED: (resource) => createError('UNAUTHORIZED', `Access denied to ${resource}`, 'authorization', 'high', { resource }),
    NOT_FOUND: (resource, id) => createError('NOT_FOUND', `${resource} not found`, 'business', 'medium', { resource, id }),
    SYSTEM_ERROR: (message, cause) => createError('SYSTEM_ERROR', message, 'system', 'critical', undefined, cause)
};
const createConsoleLogger = () => ({
    log: (error) => {
        const logLevel = error.severity === 'critical' ? 'error' :
            error.severity === 'high' ? 'warn' : 'info';
        console[logLevel](`[${error.code}] ${error.message}`, {
            category: error.category,
            severity: error.severity,
            timestamp: error.timestamp,
            details: error.details,
            cause: error.cause?.message
        });
    }
});
const createErrorHandler = (handlers, defaultHandler) => (error) => {
    const handler = handlers[error.category] || defaultHandler;
    return handler(error);
};
// リトライ機能
const withRetry = (operation, options = {}) => {
    const { maxRetries = 3, delay = 1000, backoffMultiplier = 2, retryCondition = (error) => error.category === 'network' && error.severity !== 'critical' } = options;
    const attempt = (retriesLeft, currentDelay) => {
        return new TaskEither(operation().run().then(result => {
            if (isRight(result) || retriesLeft === 0) {
                return result;
            }
            const error = result.left;
            if (retryCondition(error)) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        attempt(retriesLeft - 1, currentDelay * backoffMultiplier).run().then(resolve);
                    }, currentDelay);
                });
            }
            return result;
        }));
    };
    return attempt(maxRetries, delay);
};
// サーキットブレーカーパターン
class CircuitBreaker {
    constructor(operation, threshold = 5, timeout = 60000) {
        this.operation = operation;
        this.threshold = threshold;
        this.timeout = timeout;
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.state = 'CLOSED';
    }
    execute() {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
            }
            else {
                return TaskEither.left(ErrorTypes.SYSTEM_ERROR('Circuit breaker is OPEN'));
            }
        }
        return new TaskEither(this.operation().run().then(result => {
            if (isRight(result)) {
                this.onSuccess();
            }
            else {
                this.onFailure();
            }
            return result;
        }));
    }
    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
        }
    }
}
// エラー集約ユーティリティ
const collectErrors = (operations) => {
    return new TaskEither(Promise.all(operations.map(op => op().run())).then(results => {
        const errors = [];
        const successes = [];
        results.forEach(result => {
            if (isLeft(result)) {
                errors.push(result.left);
            }
            else {
                successes.push(result.right);
            }
        });
        return errors.length > 0 ? left(errors) : right(successes);
    }));
};
// ===========================================
// 問題7: 非同期パイプライン - 解答
// ===========================================
// 並列処理ユーティリティ
const parallel = (tasks) => {
    return new TaskEither(Promise.all(tasks.map(task => task.run())).then(results => {
        const errors = [];
        const successes = [];
        results.forEach(result => {
            if (isLeft(result)) {
                errors.push(result.left);
            }
            else {
                successes.push(result.right);
            }
        });
        return errors.length > 0 ? left(errors) : right(successes);
    }));
};
// シーケンシャル処理
const sequence = (tasks) => {
    return tasks.reduce((acc, task) => acc.flatMap(results => task().map(result => [...results, result])), TaskEither.of([]));
};
// タイムアウト付き処理
const withTimeout = (task, timeoutMs) => {
    return new TaskEither(Promise.race([
        task.run(),
        new Promise(resolve => setTimeout(() => resolve(left(ErrorTypes.SYSTEM_ERROR('Operation timed out'))), timeoutMs))
    ]));
};
// バッチ処理
const batch = (items, processor, batchSize = 10) => {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
    }
    return batches.reduce((acc, batch) => acc.flatMap(results => {
        const batchTasks = batch.map(processor);
        const parallelResult = parallel(batchTasks);
        return new TaskEither(parallelResult.run().then(batchResults => {
            if (isRight(batchResults)) {
                return right([...results, ...batchResults.right]);
            }
            else {
                return right(results);
            }
        }));
    }), TaskEither.of([]));
};
// ===========================================
// 問題8: パフォーマンス最適化 - 解答
// ===========================================
// Lazy評価
class Lazy {
    constructor(computation) {
        this.computation = computation;
        this._computed = false;
    }
    get value() {
        if (!this._computed) {
            this._value = this.computation();
            this._computed = true;
        }
        return this._value;
    }
    map(fn) {
        return new Lazy(() => fn(this.value));
    }
    flatMap(fn) {
        return new Lazy(() => fn(this.value).value);
    }
    static of(value) {
        return new Lazy(() => value);
    }
    force() {
        return this.value;
    }
    isComputed() {
        return this._computed;
    }
}
// メモ化拡張版
class AdvancedMemoizer {
    constructor(fn, options = {}) {
        this.fn = fn;
        this.cache = new Map();
        this.memoized = (...args) => {
            const key = this.keyGenerator(...args);
            const now = Date.now();
            const cached = this.cache.get(key);
            if (cached && cached.expiry > now) {
                cached.hitCount++;
                return cached.value;
            }
            if (this.cache.size >= this.maxSize) {
                this.evictLeastUsed();
            }
            const result = this.fn(...args);
            this.cache.set(key, {
                value: result,
                expiry: now + this.ttl,
                hitCount: 1
            });
            return result;
        };
        this.maxSize = options.maxSize || 1000;
        this.ttl = options.ttl || 300000; // 5分
        this.keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));
    }
    evictLeastUsed() {
        let leastUsedKey = '';
        let minHitCount = Infinity;
        // 型安全なIterator処理 - downlevelIteration不要の実装
        const entriesIterator = this.cache.entries();
        let result = entriesIterator.next();
        while (!result.done) {
            const [key, entry] = result.value;
            if (entry.hitCount < minHitCount) {
                minHitCount = entry.hitCount;
                leastUsedKey = key;
            }
            result = entriesIterator.next();
        }
        if (leastUsedKey) {
            this.cache.delete(leastUsedKey);
        }
    }
    clear() {
        this.cache.clear();
    }
    stats() {
        // 型安全なIterator処理でtotalHitsを計算
        let totalHits = 0;
        let entryCount = 0;
        const valuesIterator = this.cache.values();
        let result = valuesIterator.next();
        while (!result.done) {
            totalHits += result.value.hitCount;
            entryCount++;
            result = valuesIterator.next();
        }
        const totalCalls = entryCount + totalHits;
        return {
            size: this.cache.size,
            hitRatio: totalCalls > 0 ? totalHits / totalCalls : 0
        };
    }
}
// ストリーム処理
class Stream {
    constructor(source) {
        this.source = source;
    }
    static from(items) {
        return new Stream(function* () {
            for (const item of items) {
                yield item;
            }
        });
    }
    static range(start, end) {
        return new Stream(function* () {
            for (let i = start; i < end; i++) {
                yield i;
            }
        });
    }
    map(fn) {
        const source = this.source;
        return new Stream(function* () {
            // 型安全なIterator処理 - for...ofの代わりに手動Iterator使用
            const iterator = source();
            let result = iterator.next();
            while (!result.done) {
                yield fn(result.value);
                result = iterator.next();
            }
        });
    }
    filter(predicate) {
        const source = this.source;
        return new Stream(function* () {
            // 型安全なIterator処理
            const iterator = source();
            let result = iterator.next();
            while (!result.done) {
                if (predicate(result.value)) {
                    yield result.value;
                }
                result = iterator.next();
            }
        });
    }
    take(count) {
        const source = this.source;
        return new Stream(function* () {
            let taken = 0;
            // 型安全なIterator処理
            const iterator = source();
            let result = iterator.next();
            while (!result.done && taken < count) {
                yield result.value;
                taken++;
                result = iterator.next();
            }
        });
    }
    toArray() {
        // 型安全なIterator処理で配列を構築
        const result = [];
        const iterator = this.source();
        let iterResult = iterator.next();
        while (!iterResult.done) {
            result.push(iterResult.value);
            iterResult = iterator.next();
        }
        return result;
    }
    reduce(fn, initial) {
        let acc = initial;
        // 型安全なIterator処理
        const iterator = this.source();
        let result = iterator.next();
        while (!result.done) {
            acc = fn(acc, result.value);
            result = iterator.next();
        }
        return acc;
    }
}
// パフォーマンスモニタリング
const measurePerformance = (operation, label) => {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    console.log(`[${label}] Execution time: ${(end - start).toFixed(2)}ms`);
    return result;
};
const measureAsyncPerformance = async (operation, label) => {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    console.log(`[${label}] Execution time: ${(end - start).toFixed(2)}ms`);
    return result;
};
// ===========================================
// テスト実行関数
// ===========================================
const runLevel4Tests = () => {
    console.log('=== レベル4 練習問題のテスト実行 ===');
    // TaskEither のテスト
    console.log('\n--- TaskEither のテスト ---');
    const testTaskEither = TaskEither.of(42).map(x => x * 2);
    testTaskEither.run().then(result => {
        console.log('TaskEither result:', result); // Right(84)
    });
    // メモ化のテスト
    console.log('\n--- メモ化のテスト ---');
    const expensiveFunction = (x) => {
        console.log(`Computing ${x}...`);
        return x * x;
    };
    const memoized = memoizeWithExpiry(expensiveFunction, 5000);
    console.log('First call:', memoized(5)); // 計算実行
    console.log('Second call:', memoized(5)); // キャッシュから取得
    // LRUキャッシュのテスト
    console.log('\n--- LRUキャッシュのテスト ---');
    const lru = new LRUCache(3);
    lru.set('a', 1);
    lru.set('b', 2);
    lru.set('c', 3);
    lru.set('d', 4); // 'a' が削除される
    console.log('Has a:', lru.has('a')); // false
    console.log('Has d:', lru.has('d')); // true
    // バリデーションのテスト
    console.log('\n--- バリデーションのテスト ---');
    const nameValidator = minLength(2)(string);
    const emailValidator = email(string);
    console.log('Valid name:', nameValidator.validate('太郎'));
    console.log('Invalid name:', nameValidator.validate('太'));
    console.log('Valid email:', emailValidator.validate('test@example.com'));
    console.log('Invalid email:', emailValidator.validate('invalid-email'));
    // Lazy評価のテスト
    console.log('\n--- Lazy評価のテスト ---');
    const lazyComputation = new Lazy(() => {
        console.log('Expensive computation...');
        return 42 * 42;
    });
    console.log('Is computed?', lazyComputation.isComputed()); // false
    console.log('Value:', lazyComputation.value); // 計算実行
    console.log('Is computed?', lazyComputation.isComputed()); // true
    // エラーハンドリングのテスト
    console.log('\n--- エラーハンドリングのテスト ---');
    const networkError = ErrorTypes.NETWORK_ERROR('Connection failed');
    const validationError = ErrorTypes.VALIDATION_ERROR('email', 'Invalid format');
    console.log('Network error:', networkError);
    console.log('Validation error:', validationError);
    // サーキットブレーカーのテスト
    console.log('\n--- サーキットブレーカーのテスト ---');
    let failCount = 0;
    const flakyOperation = () => {
        failCount++;
        return failCount > 3
            ? TaskEither.of('Success!')
            : TaskEither.left(ErrorTypes.NETWORK_ERROR('Simulated failure'));
    };
    const circuitBreaker = new CircuitBreaker(flakyOperation, 2, 1000);
    console.log('Circuit breaker created');
    // ストリームのテスト
    console.log('\n--- ストリームのテスト ---');
    const streamResult = Stream.range(1, 10)
        .filter(n => n % 2 === 0)
        .map(n => n * 2)
        .take(3)
        .toArray();
    console.log('Stream result:', streamResult); // [4, 8, 12]
    // 高度なメモ化のテスト
    console.log('\n--- 高度なメモ化のテスト ---');
    const fibonacci = (n) => {
        if (n <= 1)
            return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    };
    const memoizer = new AdvancedMemoizer(fibonacci, { maxSize: 100, ttl: 10000 });
    console.log('First call:', measurePerformance(() => memoizer.memoized(35), 'Fibonacci(35)'));
    console.log('Second call:', measurePerformance(() => memoizer.memoized(35), 'Fibonacci(35) cached'));
    console.log('Cache stats:', memoizer.stats());
    console.log('\n=== すべてのテストが完了しました ===');
};
exports.runLevel4Tests = runLevel4Tests;
//# sourceMappingURL=solutions.js.map