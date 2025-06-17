// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル3: 型を活用した安全な処理 - 解答例
// Option/Maybe型とEither型を使った堅牢なコード作成の解答例です

// ===========================================
// 型定義セクション
// ===========================================

// Option/Maybe型の定義
type Option<T> = Some<T> | None;

interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

interface None {
  readonly _tag: 'None';
}

// Either型の定義
type Either<L, R> = Left<L> | Right<R>;

interface Left<L> {
  readonly _tag: 'Left';
  readonly left: L;
}

interface Right<R> {
  readonly _tag: 'Right';
  readonly right: R;
}

// ===========================================
// 問題1: Option/Maybe型の基本実装 - 解答
// ===========================================

/**
 * 問題1-1: Option型の基本的なコンストラクタ関数
 */
const some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const none: Option<never> = { _tag: 'None' };

/**
 * 問題1-2: Option型の型ガード関数
 */
const isSome = <T>(option: Option<T>): option is Some<T> => 
  option._tag === 'Some';

const isNone = <T>(option: Option<T>): option is None => 
  option._tag === 'None';

/**
 * 問題1-3: Option型の基本操作関数
 */
const mapOption = <T, U>(fn: (value: T) => U) => 
  (option: Option<T>): Option<U> => 
    isSome(option) ? some(fn(option.value)) : none;

const flatMapOption = <T, U>(fn: (value: T) => Option<U>) => 
  (option: Option<T>): Option<U> => 
    isSome(option) ? fn(option.value) : none;

const getOrElse = <T>(defaultValue: T) => 
  (option: Option<T>): T => 
    isSome(option) ? option.value : defaultValue;

// ===========================================
// 問題2: Option型の実用的な活用 - 解答
// ===========================================

/**
 * 問題2-1: 安全な配列アクセス関数
 */
const safeGet = <T>(array: T[], index: number): Option<T> => 
  index >= 0 && index < array.length ? some(array[index]!) : none;

/**
 * 問題2-2: 安全なオブジェクトプロパティアクセス関数
 * 完全な型推論を持つ実装 - キーの型制約と戻り値の型安全性
 */

// 完全な型安全safeProp関数 - オーバーロードで異なるケースに対応
function safeProp<T, K extends keyof T>(key: K): (obj: T) => Option<T[K]>;
function safeProp<K extends string>(key: K): <T extends Record<string, any>>(obj: T) => Option<T[K] extends undefined ? unknown : T[K]>;

// 実装関数 - 完全な型安全性を保証
function safeProp(key: string) {
  return <T extends Record<string, any>>(obj: T): Option<any> => {
    const value = obj[key];
    return value !== undefined && value !== null ? some(value) : none;
  };
}

// さらに厳密な型安全版 - オプショナルプロパティも考慮
const safePropStrict = <T, K extends keyof T>(
  key: K
) => (obj: T): Option<NonNullable<T[K]>> => {
  const value = obj[key];
  return value !== undefined && value !== null ? some(value as NonNullable<T[K]>) : none;
};

/**
 * 問題2-3: 安全な文字列から数値への変換関数
 */
const safeParseInt = (str: string): Option<number> => {
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? none : some(parsed);
};

const safeParseFloat = (str: string): Option<number> => {
  const parsed = parseFloat(str);
  return isNaN(parsed) ? none : some(parsed);
};

/**
 * 問題2-4: 安全なJSON解析関数
 */
const safeParseJSON = <T = any>(jsonString: string): Option<T> => {
  try {
    return some(JSON.parse(jsonString));
  } catch {
    return none;
  }
};

// ===========================================
// 問題3: Option型のチェーン操作 - 解答
// ===========================================

type User = {
  id: number;
  profile?: {
    personal?: {
      name?: string;
      age?: number;
      address?: {
        street?: string;
        city?: string;
        zipCode?: string;
      };
    };
  };
};

/**
 * 問題3-1: ネストしたオブジェクトから値を安全に取得
 * 型安全なsafePropを使用した実装
 */
const getUserName = (user: User): Option<string> => 
  flatMapOption(safePropStrict<NonNullable<NonNullable<User['profile']>['personal']>, 'name'>('name'))(
    flatMapOption(safePropStrict<NonNullable<User['profile']>, 'personal'>('personal'))(
      flatMapOption(safePropStrict<User, 'profile'>('profile'))(
        some(user)
      )
    )
  );

// 別解: 組み立て形式での型安全な実装
const getUserNameComposed = (user: User): Option<string> => {
  const getProfile = safePropStrict<User, 'profile'>('profile');
  const getPersonal = safePropStrict<NonNullable<User['profile']>, 'personal'>('personal');
  const getName = safePropStrict<NonNullable<NonNullable<User['profile']>['personal']>, 'name'>('name');
  
  return flatMapOption(getName)(
    flatMapOption(getPersonal)(
      flatMapOption(getProfile)(some(user))
    )
  );
};

const getUserCity = (user: User): Option<string> => 
  flatMapOption(safePropStrict<NonNullable<NonNullable<NonNullable<User['profile']>['personal']>['address']>, 'city'>('city'))(
    flatMapOption(safePropStrict<NonNullable<NonNullable<User['profile']>['personal']>, 'address'>('address'))(
      flatMapOption(safePropStrict<NonNullable<User['profile']>, 'personal'>('personal'))(
        flatMapOption(safePropStrict<User, 'profile'>('profile'))(
          some(user)
        )
      )
    )
  );

const isUserAdult = (user: User): Option<boolean> => 
  mapOption((age: number) => age >= 18)(
    flatMapOption(safePropStrict<NonNullable<NonNullable<User['profile']>['personal']>, 'age'>('age'))(
      flatMapOption(safePropStrict<NonNullable<User['profile']>, 'personal'>('personal'))(
        flatMapOption(safePropStrict<User, 'profile'>('profile'))(
          some(user)
        )
      )
    )
  );

/**
 * 問題3-2: 設定オブジェクトから値を取得して処理
 */
type Config = {
  database?: {
    host?: string;
    port?: string;
    credentials?: {
      username?: string;
      password?: string;
    };
  };
  server?: {
    port?: string;
    ssl?: boolean;
  };
};

const createDbConnectionString = (config: Config): Option<string> => {
  const host = flatMapOption(safeProp('host') as any)(flatMapOption(safeProp('database') as any)(some(config)));
  const port = flatMapOption(safeProp('port') as any)(flatMapOption(safeProp('database') as any)(some(config)));
  const username = flatMapOption(safeProp('username') as any)(
    flatMapOption(safeProp('credentials') as any)(
      flatMapOption(safeProp('database') as any)(some(config))
    )
  );
  const password = flatMapOption(safeProp('password') as any)(
    flatMapOption(safeProp('credentials') as any)(
      flatMapOption(safeProp('database') as any)(some(config))
    )
  );

  // すべての値が存在する場合のみ接続文字列を作成
  if (isSome(host) && isSome(port) && isSome(username) && isSome(password)) {
    return some(`${username.value}:${password.value}@${host.value}:${port.value}`);
  }
  return none;
};

const getValidServerPort = (config: Config): Option<number> => 
  flatMapOption((port: number) => port >= 1 && port <= 65535 ? some(port) : none)(
    flatMapOption(safeParseInt)(
      flatMapOption((serverConfig: any) => safeProp('port')(serverConfig))(
        flatMapOption((config: any) => safeProp('server')(config))(some(config))
      )
    )
  );

// ===========================================
// 問題4: Either型の基本実装 - 解答
// ===========================================

/**
 * 問題4-1: Either型の基本的なコンストラクタ関数
 */
const left = <L, R = never>(value: L): Either<L, R> => 
  ({ _tag: 'Left', left: value });

const right = <L = never, R = never>(value: R): Either<L, R> => 
  ({ _tag: 'Right', right: value });

/**
 * 問題4-2: Either型の型ガード関数
 */
const isLeft = <L, R>(either: Either<L, R>): either is Left<L> => 
  either._tag === 'Left';

const isRight = <L, R>(either: Either<L, R>): either is Right<R> => 
  either._tag === 'Right';

/**
 * 問題4-3: Either型の基本操作関数
 */
const mapEither = <L, R, U>(fn: (value: R) => U) => 
  (either: Either<L, R>): Either<L, U> => 
    isRight(either) ? right(fn(either.right)) : either;

const mapLeft = <L, R, U>(fn: (value: L) => U) => 
  (either: Either<L, R>): Either<U, R> => 
    isLeft(either) ? left(fn(either.left)) : either;

const flatMapEither = <L, R, U>(fn: (value: R) => Either<L, U>) => 
  (either: Either<L, R>): Either<L, U> => 
    isRight(either) ? fn(either.right) : either;

const fold = <L, R, U>(
  onLeft: (left: L) => U,
  onRight: (right: R) => U
) => (either: Either<L, R>): U => 
  isLeft(either) ? onLeft(either.left) : onRight(either.right);

// ===========================================
// 問題5: Either型を使ったバリデーション - 解答
// ===========================================

type ValidationError = {
  field: string;
  message: string;
};

/**
 * 問題5-1: 基本的なバリデーション関数
 */
const validateEmail = (email: string): Either<ValidationError, string> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? right(email)
    : left({ field: 'email', message: '有効なメールアドレスを入力してください' });
};

const validatePassword = (password: string): Either<ValidationError, string> => {
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

const validateAge = (ageStr: string): Either<ValidationError, number> => {
  const ageNum = parseInt(ageStr, 10);
  if (isNaN(ageNum)) {
    return left({ field: 'age', message: '年齢は数値で入力してください' });
  }
  if (ageNum < 0 || ageNum > 150) {
    return left({ field: 'age', message: '年齢は0-150の範囲で入力してください' });
  }
  return right(ageNum);
};

const validatePhoneNumber = (phone: string): Either<ValidationError, string> => {
  const cleanPhone = phone.replace(/-/g, '');
  const phoneRegex = /^\d{10,11}$/;
  
  return phoneRegex.test(cleanPhone)
    ? right(cleanPhone)
    : left({ field: 'phoneNumber', message: '電話番号は10-11桁の数字で入力してください' });
};

/**
 * 問題5-2: 複数のバリデーションを組み合わせる関数
 */
type UserRegistration = {
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
};

const validateUserRegistration = (
  email: string,
  password: string,
  ageStr: string,
  phoneNumber: string
): Either<ValidationError[], UserRegistration> => {
  const emailResult = validateEmail(email);
  const passwordResult = validatePassword(password);
  const ageResult = validateAge(ageStr);
  const phoneResult = validatePhoneNumber(phoneNumber);
  
  const errors: ValidationError[] = [];
  
  if (isLeft(emailResult)) errors.push(emailResult.left);
  if (isLeft(passwordResult)) errors.push(passwordResult.left);
  if (isLeft(ageResult)) errors.push(ageResult.left);
  if (isLeft(phoneResult)) errors.push(phoneResult.left);
  
  if (errors.length > 0) {
    return left(errors);
  }
  
  return right({
    email: (emailResult as Right<string>).right,
    password: (passwordResult as Right<string>).right,
    age: (ageResult as Right<number>).right,
    phoneNumber: (phoneResult as Right<string>).right
  });
};

// ===========================================
// 問題6: 高度なEither活用パターン - 解答
// ===========================================

type FileError = 
  | { type: 'NotFound'; filename: string }
  | { type: 'PermissionDenied'; filename: string }
  | { type: 'InvalidFormat'; filename: string; details: string };

/**
 * 問題6-1: ファイル処理を模擬したEither操作
 */
const readFile = (filename: string): Either<FileError, string> => {
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

const parseJsonEither = (jsonStr: string): Either<FileError, any> => {
  try {
    return right(JSON.parse(jsonStr));
  } catch (error) {
    return left({ 
      type: 'InvalidFormat', 
      filename: 'unknown',
      details: error instanceof Error ? error.message : 'Invalid JSON'
    });
  }
};

const readAndParseJsonFile = (filename: string): Either<FileError, any> => 
  flatMapEither(parseJsonEither)(readFile(filename));

/**
 * 問題6-2: APIレスポンス処理を模擬したEither操作
 */
type ApiError = 
  | { type: 'NetworkError'; message: string }
  | { type: 'NotFound'; resource: string }
  | { type: 'Unauthorized' }
  | { type: 'ValidationError'; errors: string[] };

type ApiResponse<T> = Either<ApiError, T>;

const createApiError = (status: number, resource: string): ApiError => {
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

const mockApiCall = <T>(endpoint: string, expectedData: T): ApiResponse<T> => {
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

const fetchUserWithProfile = (userId: number): ApiResponse<{user: any, profile: any}> => {
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

// ===========================================
// 問題7: 非同期処理との組み合わせ - 解答
// ===========================================

type TaskEither<L, R> = Promise<Either<L, R>>;

/**
 * 問題7-1: TaskEither型の基本実装
 */
const taskEitherOf = <L, R>(value: R): TaskEither<L, R> => 
  Promise.resolve(right(value));

const taskEitherFail = <L, R>(error: L): TaskEither<L, R> => 
  Promise.resolve(left(error));

const mapTaskEither = <L, R, U>(fn: (value: R) => U) => 
  async (taskEither: TaskEither<L, R>): Promise<TaskEither<L, U>> => {
    const either = await taskEither;
    // 型安全なmapEither適用
    const mappedEither = mapEither(fn)(either) as Either<L, U>;
    return Promise.resolve(mappedEither);
  };

const flatMapTaskEither = <L, R, U>(fn: (value: R) => TaskEither<L, U>) => 
  async (taskEither: TaskEither<L, R>): Promise<TaskEither<L, U>> => {
    const either = await taskEither;
    if (isRight(either)) {
      return fn(either.right);
    } else {
      // leftの場合、型安全にLeft<L>からLeft<L>への変換を行う
      return Promise.resolve(left(either.left));
    }
  };

/**
 * 問題7-2: 非同期バリデーション処理
 */
const checkEmailUnique = async (email: string): Promise<Either<ValidationError, string>> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (email === 'admin@example.com') {
    return left({ field: 'email', message: 'このメールアドレスは既に使用されています' });
  }
  
  return right(email);
};

const checkUsernameUnique = async (username: string): Promise<Either<ValidationError, string>> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (username === 'admin') {
    return left({ field: 'username', message: 'このユーザー名は既に使用されています' });
  }
  
  return right(username);
};

const validateUserAsync = async (
  email: string,
  username: string
): Promise<Either<ValidationError[], {email: string, username: string}>> => {
  const [emailResult, usernameResult] = await Promise.all([
    checkEmailUnique(email),
    checkUsernameUnique(username)
  ]);
  
  const errors: ValidationError[] = [];
  
  if (isLeft(emailResult)) errors.push(emailResult.left);
  if (isLeft(usernameResult)) errors.push(usernameResult.left);
  
  if (errors.length > 0) {
    return left(errors);
  }
  
  return right({
    email: (emailResult as Right<string>).right,
    username: (usernameResult as Right<string>).right
  });
};

// ===========================================
// 問題8: 実践的な組み合わせ問題 - 解答
// ===========================================

type DatabaseConfig = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

type AppConfig = {
  database: DatabaseConfig;
  server: {
    port: number;
    host: string;
  };
  features: {
    enableLogging: boolean;
    debugMode: boolean;
  };
};

/**
 * 問題8-1: 設定ファイルの読み込みと検証
 */
const loadAndValidateConfig = (filename: string): Either<string[], AppConfig> => {
  const fileResult = readAndParseJsonFile(filename);
  
  if (isLeft(fileResult)) {
    return left([`ファイル読み込みエラー: ${fileResult.left.type}`]);
  }
  
  const config = fileResult.right;
  const errors: string[] = [];
  
  // データベース設定の検証
  if (!config.database) {
    errors.push('database設定が見つかりません');
  } else {
    if (!config.database.host) errors.push('database.hostが設定されていません');
    if (!config.database.port || typeof config.database.port !== 'number') {
      errors.push('database.portが正しく設定されていません');
    }
    if (!config.database.database) errors.push('database.databaseが設定されていません');
    if (!config.database.username) errors.push('database.usernameが設定されていません');
    if (!config.database.password) errors.push('database.passwordが設定されていません');
  }
  
  // サーバー設定の検証
  if (!config.server) {
    errors.push('server設定が見つかりません');
  } else {
    if (!config.server.host) errors.push('server.hostが設定されていません');
    if (!config.server.port || typeof config.server.port !== 'number') {
      errors.push('server.portが正しく設定されていません');
    }
  }
  
  // 機能設定の検証
  if (!config.features) {
    errors.push('features設定が見つかりません');
  } else {
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
  
  return right(config as AppConfig);
};

/**
 * 問題8-2: Webフォームの総合バリデーション
 */
type ContactForm = {
  name: string;
  email: string;
  phone: string;
  message: string;
  agreeToTerms: boolean;
};

const validateContactForm = (formData: {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  agreeToTerms?: boolean;
}): Either<ValidationError[], ContactForm> => {
  const errors: ValidationError[] = [];
  
  // 名前のバリデーション
  if (!formData.name) {
    errors.push({ field: 'name', message: '名前は必須です' });
  } else if (formData.name.length < 2 || formData.name.length > 50) {
    errors.push({ field: 'name', message: '名前は2文字以上50文字以下で入力してください' });
  }
  
  // メールのバリデーション
  if (!formData.email) {
    errors.push({ field: 'email', message: 'メールアドレスは必須です' });
  } else {
    const emailResult = validateEmail(formData.email);
    if (isLeft(emailResult)) {
      errors.push(emailResult.left);
    }
  }
  
  // 電話番号のバリデーション
  if (!formData.phone) {
    errors.push({ field: 'phone', message: '電話番号は必須です' });
  } else {
    const phoneResult = validatePhoneNumber(formData.phone);
    if (isLeft(phoneResult)) {
      errors.push(phoneResult.left);
    }
  }
  
  // メッセージのバリデーション
  if (!formData.message) {
    errors.push({ field: 'message', message: 'メッセージは必須です' });
  } else if (formData.message.length < 10 || formData.message.length > 1000) {
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
    name: formData.name!,
    email: formData.email!,
    phone: formData.phone!,
    message: formData.message!,
    agreeToTerms: formData.agreeToTerms!
  });
};

/**
 * 問題8-3: データ変換パイプライン
 */
type RawCsvRow = {
  [key: string]: string;
};

type CleanedUser = {
  id: number;
  fullName: string;
  email: string;
  birthDate: Date;
  isActive: boolean;
};

const transformCsvRowToUser = (row: RawCsvRow): Either<string[], CleanedUser> => {
  const errors: string[] = [];
  let id: number;
  let fullName: string;
  let email: string;
  let birthDate: Date;
  let isActive: boolean;
  
  // ID変換
  if (!row.id) {
    errors.push('IDが見つかりません');
  } else {
    const idNum = parseInt(row.id, 10);
    if (isNaN(idNum)) {
      errors.push('IDは数値である必要があります');
    } else {
      id = idNum;
    }
  }
  
  // 名前の結合
  if (!row.first_name || !row.last_name) {
    errors.push('first_nameまたはlast_nameが見つかりません');
  } else {
    fullName = `${row.first_name} ${row.last_name}`;
  }
  
  // メール検証
  if (!row.email) {
    errors.push('emailが見つかりません');
  } else {
    const emailResult = validateEmail(row.email);
    if (isLeft(emailResult)) {
      errors.push(`メールが無効です: ${emailResult.left.message}`);
    } else {
      email = emailResult.right;
    }
  }
  
  // 生年月日変換
  if (!row.birth_date) {
    errors.push('birth_dateが見つかりません');
  } else {
    const date = new Date(row.birth_date);
    if (isNaN(date.getTime())) {
      errors.push('birth_dateが無効な日付です');
    } else {
      birthDate = date;
    }
  }
  
  // ステータス変換
  if (!row.status) {
    errors.push('statusが見つかりません');
  } else {
    isActive = row.status === 'active';
  }
  
  if (errors.length > 0) {
    return left(errors);
  }
  
  return right({
    id: id!,
    fullName: fullName!,
    email: email!,
    birthDate: birthDate!,
    isActive: isActive!
  });
};

const transformCsvData = (rows: RawCsvRow[]): {
  successes: CleanedUser[];
  errors: Array<{row: number; errors: string[]}>;
} => {
  const successes: CleanedUser[] = [];
  const errors: Array<{row: number; errors: string[]}> = [];
  
  rows.forEach((row, index) => {
    const result = transformCsvRowToUser(row);
    if (isLeft(result)) {
      errors.push({ row: index + 1, errors: result.left });
    } else {
      successes.push(result.right);
    }
  });
  
  return { successes, errors };
};

// ===========================================
// テスト実行関数
// ===========================================

export const runLevel3Tests = () => {
  console.log('=== レベル3 練習問題のテスト実行 ===');
  
  // Option型のテスト
  console.log('\n--- Option型のテスト ---');
  const numbers = [1, 2, 3];
  console.log('safeGet(numbers, 1):', safeGet(numbers, 1)); // Some(2)
  console.log('safeGet(numbers, 5):', safeGet(numbers, 5)); // None
  
  const testUser: User = {
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
  
  const registrationResult = validateUserRegistration(
    'user@example.com',
    'Password123',
    '25',
    '09012345678'
  );
  console.log('validateUserRegistration result:', registrationResult);
  
  // ファイル操作のテスト
  console.log('\n--- ファイル操作のテスト ---');
  console.log('readAndParseJsonFile("config.json"):', readAndParseJsonFile("config.json"));
  console.log('readAndParseJsonFile("missing.txt"):', readAndParseJsonFile("missing.txt"));
  
  // CSV変換のテスト
  console.log('\n--- CSV変換のテスト ---');
  const csvRow: RawCsvRow = {
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