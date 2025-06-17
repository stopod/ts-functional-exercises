"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル3: 型を活用した安全な処理 - 解答例
// Option/Maybe型とEither型を使った堅牢なコード作成の解答例です
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLevel3Tests = void 0;
// ===========================================
// 問題1: Option/Maybe型の基本実装 - 解答
// ===========================================
/**
 * 問題1-1: Option型の基本的なコンストラクタ関数
 */
const some = (value) => ({ _tag: 'Some', value });
const none = { _tag: 'None' };
/**
 * 問題1-2: Option型の型ガード関数
 */
const isSome = (option) => option._tag === 'Some';
const isNone = (option) => option._tag === 'None';
/**
 * 問題1-3: Option型の基本操作関数
 */
const mapOption = (fn) => (option) => isSome(option) ? some(fn(option.value)) : none;
const flatMapOption = (fn) => (option) => isSome(option) ? fn(option.value) : none;
const getOrElse = (defaultValue) => (option) => isSome(option) ? option.value : defaultValue;
// ===========================================
// 問題2: Option型の実用的な活用 - 解答
// ===========================================
/**
 * 問題2-1: 安全な配列アクセス関数
 */
const safeGet = (array, index) => index >= 0 && index < array.length ? some(array[index]) : none;
// 実装関数 - 完全な型安全性を保証
function safeProp(key) {
    return (obj) => {
        const value = obj[key];
        return value !== undefined && value !== null ? some(value) : none;
    };
}
// さらに厳密な型安全版 - オプショナルプロパティも考慮
const safePropStrict = (key) => (obj) => {
    const value = obj[key];
    return value !== undefined && value !== null ? some(value) : none;
};
/**
 * 問題2-3: 安全な文字列から数値への変換関数
 */
const safeParseInt = (str) => {
    const parsed = parseInt(str, 10);
    return isNaN(parsed) ? none : some(parsed);
};
const safeParseFloat = (str) => {
    const parsed = parseFloat(str);
    return isNaN(parsed) ? none : some(parsed);
};
/**
 * 問題2-4: 安全なJSON解析関数
 */
const safeParseJSON = (jsonString) => {
    try {
        return some(JSON.parse(jsonString));
    }
    catch {
        return none;
    }
};
/**
 * 問題3-1: ネストしたオブジェクトから値を安全に取得
 * 型安全なsafePropを使用した実装
 */
const getUserName = (user) => flatMapOption(safePropStrict('name'))(flatMapOption(safePropStrict('personal'))(flatMapOption(safePropStrict('profile'))(some(user))));
// 別解: 組み立て形式での型安全な実装
const getUserNameComposed = (user) => {
    const getProfile = safePropStrict('profile');
    const getPersonal = safePropStrict('personal');
    const getName = safePropStrict('name');
    return flatMapOption(getName)(flatMapOption(getPersonal)(flatMapOption(getProfile)(some(user))));
};
const getUserCity = (user) => flatMapOption(safePropStrict('city'))(flatMapOption(safePropStrict('address'))(flatMapOption(safePropStrict('personal'))(flatMapOption(safePropStrict('profile'))(some(user)))));
const isUserAdult = (user) => mapOption((age) => age >= 18)(flatMapOption(safePropStrict('age'))(flatMapOption(safePropStrict('personal'))(flatMapOption(safePropStrict('profile'))(some(user)))));
const createDbConnectionString = (config) => {
    const host = flatMapOption(safeProp('host'))(flatMapOption(safeProp('database'))(some(config)));
    const port = flatMapOption(safeProp('port'))(flatMapOption(safeProp('database'))(some(config)));
    const username = flatMapOption(safeProp('username'))(flatMapOption(safeProp('credentials'))(flatMapOption(safeProp('database'))(some(config))));
    const password = flatMapOption(safeProp('password'))(flatMapOption(safeProp('credentials'))(flatMapOption(safeProp('database'))(some(config))));
    // すべての値が存在する場合のみ接続文字列を作成
    if (isSome(host) && isSome(port) && isSome(username) && isSome(password)) {
        return some(`${username.value}:${password.value}@${host.value}:${port.value}`);
    }
    return none;
};
const getValidServerPort = (config) => flatMapOption((port) => port >= 1 && port <= 65535 ? some(port) : none)(flatMapOption(safeParseInt)(flatMapOption((serverConfig) => safeProp('port')(serverConfig))(flatMapOption((config) => safeProp('server')(config))(some(config)))));
// ===========================================
// 問題4: Either型の基本実装 - 解答
// ===========================================
/**
 * 問題4-1: Either型の基本的なコンストラクタ関数
 */
const left = (value) => ({ _tag: 'Left', left: value });
const right = (value) => ({ _tag: 'Right', right: value });
/**
 * 問題4-2: Either型の型ガード関数
 */
const isLeft = (either) => either._tag === 'Left';
const isRight = (either) => either._tag === 'Right';
/**
 * 問題4-3: Either型の基本操作関数
 */
const mapEither = (fn) => (either) => isRight(either) ? right(fn(either.right)) : either;
const mapLeft = (fn) => (either) => isLeft(either) ? left(fn(either.left)) : either;
const flatMapEither = (fn) => (either) => isRight(either) ? fn(either.right) : either;
const fold = (onLeft, onRight) => (either) => isLeft(either) ? onLeft(either.left) : onRight(either.right);
/**
 * 問題5-1: 基本的なバリデーション関数
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)
        ? right(email)
        : left({ field: 'email', message: '有効なメールアドレスを入力してください' });
};
const validatePassword = (password) => {
    if (password.length < 8) {
        return left({ field: 'password', message: 'パスワードは8文字以上である必要があります' });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasUpper || !hasLower || !hasNumber) {
        return left({
            field: 'password',
            message: 'パスワードは大文字、小文字、数字を含む必要があります'
        });
    }
    return right(password);
};
const validateAge = (ageStr) => {
    const ageNum = parseInt(ageStr, 10);
    if (isNaN(ageNum)) {
        return left({ field: 'age', message: '年齢は数値で入力してください' });
    }
    if (ageNum < 0 || ageNum > 150) {
        return left({ field: 'age', message: '年齢は0-150の範囲で入力してください' });
    }
    return right(ageNum);
};
const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/-/g, '');
    const phoneRegex = /^\d{10,11}$/;
    return phoneRegex.test(cleanPhone)
        ? right(cleanPhone)
        : left({ field: 'phoneNumber', message: '電話番号は10-11桁の数字で入力してください' });
};
const validateUserRegistration = (email, password, ageStr, phoneNumber) => {
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    const ageResult = validateAge(ageStr);
    const phoneResult = validatePhoneNumber(phoneNumber);
    const errors = [];
    if (isLeft(emailResult))
        errors.push(emailResult.left);
    if (isLeft(passwordResult))
        errors.push(passwordResult.left);
    if (isLeft(ageResult))
        errors.push(ageResult.left);
    if (isLeft(phoneResult))
        errors.push(phoneResult.left);
    if (errors.length > 0) {
        return left(errors);
    }
    return right({
        email: emailResult.right,
        password: passwordResult.right,
        age: ageResult.right,
        phoneNumber: phoneResult.right
    });
};
/**
 * 問題6-1: ファイル処理を模擬したEither操作
 */
const readFile = (filename) => {
    switch (filename) {
        case 'config.json':
            return right('{"database": {"host": "localhost", "port": 5432}}');
        case 'secret.txt':
            return left({ type: 'PermissionDenied', filename });
        case 'missing.txt':
            return left({ type: 'NotFound', filename });
        default:
            return right('');
    }
};
const parseJsonEither = (jsonStr) => {
    try {
        return right(JSON.parse(jsonStr));
    }
    catch (error) {
        return left({
            type: 'InvalidFormat',
            filename: 'unknown',
            details: error instanceof Error ? error.message : 'Invalid JSON'
        });
    }
};
const readAndParseJsonFile = (filename) => flatMapEither(parseJsonEither)(readFile(filename));
const createApiError = (status, resource) => {
    switch (status) {
        case 404:
            return { type: 'NotFound', resource };
        case 401:
            return { type: 'Unauthorized' };
        case 400:
            return { type: 'ValidationError', errors: ['Bad Request'] };
        default:
            return { type: 'NetworkError', message: `HTTP ${status}` };
    }
};
const mockApiCall = (endpoint, expectedData) => {
    switch (endpoint) {
        case '/users/1':
            return right(expectedData);
        case '/users/999':
            return left({ type: 'NotFound', resource: 'user' });
        case '/admin/data':
            return left({ type: 'Unauthorized' });
        default:
            return left({ type: 'NetworkError', message: 'Unknown endpoint' });
    }
};
const fetchUserWithProfile = (userId) => {
    const userResult = mockApiCall(`/users/${userId}`, { id: userId, name: 'User' });
    if (isLeft(userResult)) {
        return userResult;
    }
    const profileResult = mockApiCall(`/users/${userId}/profile`, { bio: 'User bio' });
    if (isLeft(profileResult)) {
        return profileResult;
    }
    return right({
        user: userResult.right,
        profile: profileResult.right
    });
};
/**
 * 問題7-1: TaskEither型の基本実装
 */
const taskEitherOf = (value) => Promise.resolve(right(value));
const taskEitherFail = (error) => Promise.resolve(left(error));
const mapTaskEither = (fn) => async (taskEither) => {
    const either = await taskEither;
    // 型安全なmapEither適用
    const mappedEither = mapEither(fn)(either);
    return Promise.resolve(mappedEither);
};
const flatMapTaskEither = (fn) => async (taskEither) => {
    const either = await taskEither;
    if (isRight(either)) {
        return fn(either.right);
    }
    else {
        // leftの場合、型安全にLeft<L>からLeft<L>への変換を行う
        return Promise.resolve(left(either.left));
    }
};
/**
 * 問題7-2: 非同期バリデーション処理
 */
const checkEmailUnique = async (email) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === 'admin@example.com') {
        return left({ field: 'email', message: 'このメールアドレスは既に使用されています' });
    }
    return right(email);
};
const checkUsernameUnique = async (username) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (username === 'admin') {
        return left({ field: 'username', message: 'このユーザー名は既に使用されています' });
    }
    return right(username);
};
const validateUserAsync = async (email, username) => {
    const [emailResult, usernameResult] = await Promise.all([
        checkEmailUnique(email),
        checkUsernameUnique(username)
    ]);
    const errors = [];
    if (isLeft(emailResult))
        errors.push(emailResult.left);
    if (isLeft(usernameResult))
        errors.push(usernameResult.left);
    if (errors.length > 0) {
        return left(errors);
    }
    return right({
        email: emailResult.right,
        username: usernameResult.right
    });
};
/**
 * 問題8-1: 設定ファイルの読み込みと検証
 */
const loadAndValidateConfig = (filename) => {
    const fileResult = readAndParseJsonFile(filename);
    if (isLeft(fileResult)) {
        return left([`ファイル読み込みエラー: ${fileResult.left.type}`]);
    }
    const config = fileResult.right;
    const errors = [];
    // データベース設定の検証
    if (!config.database) {
        errors.push('database設定が見つかりません');
    }
    else {
        if (!config.database.host)
            errors.push('database.hostが設定されていません');
        if (!config.database.port || typeof config.database.port !== 'number') {
            errors.push('database.portが正しく設定されていません');
        }
        if (!config.database.database)
            errors.push('database.databaseが設定されていません');
        if (!config.database.username)
            errors.push('database.usernameが設定されていません');
        if (!config.database.password)
            errors.push('database.passwordが設定されていません');
    }
    // サーバー設定の検証
    if (!config.server) {
        errors.push('server設定が見つかりません');
    }
    else {
        if (!config.server.host)
            errors.push('server.hostが設定されていません');
        if (!config.server.port || typeof config.server.port !== 'number') {
            errors.push('server.portが正しく設定されていません');
        }
    }
    // 機能設定の検証
    if (!config.features) {
        errors.push('features設定が見つかりません');
    }
    else {
        if (typeof config.features.enableLogging !== 'boolean') {
            errors.push('features.enableLoggingはboolean値である必要があります');
        }
        if (typeof config.features.debugMode !== 'boolean') {
            errors.push('features.debugModeはboolean値である必要があります');
        }
    }
    if (errors.length > 0) {
        return left(errors);
    }
    return right(config);
};
const validateContactForm = (formData) => {
    const errors = [];
    // 名前のバリデーション
    if (!formData.name) {
        errors.push({ field: 'name', message: '名前は必須です' });
    }
    else if (formData.name.length < 2 || formData.name.length > 50) {
        errors.push({ field: 'name', message: '名前は2文字以上50文字以下で入力してください' });
    }
    // メールのバリデーション
    if (!formData.email) {
        errors.push({ field: 'email', message: 'メールアドレスは必須です' });
    }
    else {
        const emailResult = validateEmail(formData.email);
        if (isLeft(emailResult)) {
            errors.push(emailResult.left);
        }
    }
    // 電話番号のバリデーション
    if (!formData.phone) {
        errors.push({ field: 'phone', message: '電話番号は必須です' });
    }
    else {
        const phoneResult = validatePhoneNumber(formData.phone);
        if (isLeft(phoneResult)) {
            errors.push(phoneResult.left);
        }
    }
    // メッセージのバリデーション
    if (!formData.message) {
        errors.push({ field: 'message', message: 'メッセージは必須です' });
    }
    else if (formData.message.length < 10 || formData.message.length > 1000) {
        errors.push({ field: 'message', message: 'メッセージは10文字以上1000文字以下で入力してください' });
    }
    // 利用規約同意のバリデーション
    if (!formData.agreeToTerms) {
        errors.push({ field: 'agreeToTerms', message: '利用規約に同意してください' });
    }
    if (errors.length > 0) {
        return left(errors);
    }
    return right({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        agreeToTerms: formData.agreeToTerms
    });
};
const transformCsvRowToUser = (row) => {
    const errors = [];
    let id;
    let fullName;
    let email;
    let birthDate;
    let isActive;
    // ID変換
    if (!row.id) {
        errors.push('IDが見つかりません');
    }
    else {
        const idNum = parseInt(row.id, 10);
        if (isNaN(idNum)) {
            errors.push('IDは数値である必要があります');
        }
        else {
            id = idNum;
        }
    }
    // 名前の結合
    if (!row.first_name || !row.last_name) {
        errors.push('first_nameまたはlast_nameが見つかりません');
    }
    else {
        fullName = `${row.first_name} ${row.last_name}`;
    }
    // メール検証
    if (!row.email) {
        errors.push('emailが見つかりません');
    }
    else {
        const emailResult = validateEmail(row.email);
        if (isLeft(emailResult)) {
            errors.push(`メールが無効です: ${emailResult.left.message}`);
        }
        else {
            email = emailResult.right;
        }
    }
    // 生年月日変換
    if (!row.birth_date) {
        errors.push('birth_dateが見つかりません');
    }
    else {
        const date = new Date(row.birth_date);
        if (isNaN(date.getTime())) {
            errors.push('birth_dateが無効な日付です');
        }
        else {
            birthDate = date;
        }
    }
    // ステータス変換
    if (!row.status) {
        errors.push('statusが見つかりません');
    }
    else {
        isActive = row.status === 'active';
    }
    if (errors.length > 0) {
        return left(errors);
    }
    return right({
        id: id,
        fullName: fullName,
        email: email,
        birthDate: birthDate,
        isActive: isActive
    });
};
const transformCsvData = (rows) => {
    const successes = [];
    const errors = [];
    rows.forEach((row, index) => {
        const result = transformCsvRowToUser(row);
        if (isLeft(result)) {
            errors.push({ row: index + 1, errors: result.left });
        }
        else {
            successes.push(result.right);
        }
    });
    return { successes, errors };
};
// ===========================================
// テスト実行関数
// ===========================================
const runLevel3Tests = () => {
    console.log('=== レベル3 練習問題のテスト実行 ===');
    // Option型のテスト
    console.log('\n--- Option型のテスト ---');
    const numbers = [1, 2, 3];
    console.log('safeGet(numbers, 1):', safeGet(numbers, 1)); // Some(2)
    console.log('safeGet(numbers, 5):', safeGet(numbers, 5)); // None
    const testUser = {
        id: 1,
        profile: {
            personal: {
                name: '太郎',
                age: 25
            }
        }
    };
    console.log('getUserName(testUser):', getUserName(testUser)); // Some('太郎')
    console.log('isUserAdult(testUser):', isUserAdult(testUser)); // Some(true)
    // Either型のテスト
    console.log('\n--- Either型のテスト ---');
    console.log('validateEmail("test@example.com"):', validateEmail("test@example.com")); // Right
    console.log('validateEmail("invalid-email"):', validateEmail("invalid-email")); // Left
    const registrationResult = validateUserRegistration('user@example.com', 'Password123', '25', '09012345678');
    console.log('validateUserRegistration result:', registrationResult);
    // ファイル操作のテスト
    console.log('\n--- ファイル操作のテスト ---');
    console.log('readAndParseJsonFile("config.json"):', readAndParseJsonFile("config.json"));
    console.log('readAndParseJsonFile("missing.txt"):', readAndParseJsonFile("missing.txt"));
    // CSV変換のテスト
    console.log('\n--- CSV変換のテスト ---');
    const csvRow = {
        id: '1',
        first_name: '太郎',
        last_name: '山田',
        email: 'taro@example.com',
        birth_date: '1990-01-01',
        status: 'active'
    };
    console.log('transformCsvRowToUser result:', transformCsvRowToUser(csvRow));
    console.log('\n=== すべてのテストが完了しました ===');
};
exports.runLevel3Tests = runLevel3Tests;
//# sourceMappingURL=solutions.js.map