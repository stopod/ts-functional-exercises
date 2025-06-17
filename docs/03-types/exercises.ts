// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル3: 型を活用した安全な処理 - 練習問題
// Option/Maybe型とEither型を使った堅牢なコード作成を学びましょう

// src/utils.ts から型と関数をインポート
import { 
  Option, Some, None, some, none, isSome, isNone,
  mapOption, flatMapOption, getOrElse, fold, filterOption,
  Either, Left, Right, left, right, isLeft, isRight,
  mapEither, mapLeft, flatMapEither, foldEither,
  safeParseInt, safeParseFloat, safeParseJSON, safeProp,
  optionToEither, eitherToOption
} from '../../src/utils';

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
const wrapValue = <T>(value: T | null | undefined): Option<T> => 
  value != null ? some(value) : none;

// 例: Option値を安全に2倍にする関数
const doubleOption = (value: Option<number>): Option<number> => 
  mapOption((n: number) => n * 2)(value);

// ===========================================
// 問題2: Option型の実用的な活用（インポートした関数を使用）
// ===========================================

/**
 * 問題2-1: インポートした安全な操作関数を活用してください
 * 注意: safeParseInt, safeParseFloat, safeParseJSON, safeProp は既にインポート済みです
 */

// 実践例: ユーザー設定の安全な取得と変換
type UserSettings = {
  theme?: string;
  fontSize?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
};

// TODO: ユーザー設定からテーマを安全に取得する関数を実装
const getUserTheme = (settings: UserSettings): Option<string> => {
  return safeProp<UserSettings, 'theme'>('theme')(settings);
};

// TODO: ユーザー設定からフォントサイズを数値として安全に取得する関数を実装
const getUserFontSize = (settings: UserSettings): Option<number> => {
  return flatMapOption((sizeStr: string) => safeParseInt(sizeStr))(
    safeProp<UserSettings, 'fontSize'>('fontSize')(settings)
  );
};

// TODO: 設定文字列からJSON設定を安全に解析する関数を実装
const parseUserSettings = (configJson: string): Option<UserSettings> => {
  return safeParseJSON<UserSettings>(configJson);
};

// ===========================================
// 問題3: Option型のチェーン操作
// ===========================================

/**
 * 問題3-1: ネストしたオブジェクトから値を安全に取得してください
 */

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

// TODO: ユーザーの名前を安全に取得する関数（safePropとflatMapOptionを使用）
const getUserName = (user: User): Option<string> => {
  return flatMapOption((profile: any) =>
    flatMapOption((personal: any) =>
      safeProp('name')(personal) as Option<string>
    )(safeProp('personal')(profile))
  )(safeProp('profile')(user));
};

// TODO: ユーザーの都市名を安全に取得する関数
const getUserCity = (user: User): Option<string> => {
  return flatMapOption((profile: any) =>
    flatMapOption((personal: any) =>
      flatMapOption((address: any) =>
        safeProp('city')(address) as Option<string>
      )(safeProp('address')(personal))
    )(safeProp('personal')(profile))
  )(safeProp('profile')(user));
};

// TODO: ユーザーの年齢を安全に取得し、成人かどうかを判定する関数
const isUserAdult = (user: User): Option<boolean> => {
  return mapOption((age: number) => age >= 18)(
    flatMapOption((profile: any) =>
      flatMapOption((personal: any) =>
        safeProp('age')(personal) as Option<number>
      )(safeProp('personal')(profile))
    )(safeProp('profile')(user))
  );
};

/**
 * 問題3-2: 設定オブジェクトから値を取得して処理する関数を作成してください
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

// TODO: データベース接続文字列を作成する関数
// const createDbConnectionString = (config: Config): Option<string> => {
//   // ここに実装
//   // format: "username:password@host:port"
//   // 必要な値がすべて存在する場合のみ接続文字列を作成
// };

// TODO: サーバーポート番号を取得し、有効な範囲かチェックする関数
// const getValidServerPort = (config: Config): Option<number> => {
//   // ここに実装
//   // ポート番号は1-65535の範囲で有効
// };

// ===========================================
// 問題4: Either型の活用（インポートした関数を使用）
// ===========================================

/**
 * 問題4-1: インポートしたEither関数を使って実践的な処理を実装してください
 * 注意: left, right, isLeft, isRight, mapEither, mapLeft, flatMapEither, foldEither は既にインポート済みです
 */

// 実践例: バリデーション関数の作成
type ValidationError = {
  field: string;
  message: string;
};

// 例: 空文字列チェック
const validateNotEmpty = (field: string, value: string): Either<ValidationError, string> => {
  return value.trim().length > 0 
    ? right(value) 
    : left({ field, message: '必須項目です' });
};

// 例: 最小長チェック
const validateMinLength = (field: string, minLength: number) => 
  (value: string): Either<ValidationError, string> => {
    return value.length >= minLength 
      ? right(value) 
      : left({ field, message: `${minLength}文字以上で入力してください` });
  };

// ===========================================
// 問題5: Either型を使ったバリデーション
// ===========================================

/**
 * 問題5-1: 基本的なバリデーション関数を実装してください
 * ValidationError型は上記で定義済み
 */

// TODO: メールアドレスのバリデーション関数
// const validateEmail = (email: string): Either<ValidationError, string> => {
//   // ここに実装
//   // 簡単な正規表現チェック: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// };

// TODO: パスワードのバリデーション関数
// const validatePassword = (password: string): Either<ValidationError, string> => {
//   // ここに実装
//   // 条件: 8文字以上、大文字・小文字・数字を含む
// };

// TODO: 年齢のバリデーション関数
// const validateAge = (ageStr: string): Either<ValidationError, number> => {
//   // ここに実装
//   // 条件: 数値で、0-150の範囲
// };

// TODO: 電話番号のバリデーション関数
// const validatePhoneNumber = (phone: string): Either<ValidationError, string> => {
//   // ここに実装
//   // 条件: 10-11桁の数字（ハイフンは除去）
// };

/**
 * 問題5-2: 複数のバリデーションを組み合わせる関数を実装してください
 */

type UserRegistration = {
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
};

// TODO: ユーザー登録データの総合バリデーション関数
// const validateUserRegistration = (
//   email: string,
//   password: string,
//   ageStr: string,
//   phoneNumber: string
// ): Either<ValidationError[], UserRegistration> => {
//   // ここに実装
//   // すべてのバリデーションを実行し、エラーがあれば配列で返す
//   // すべて成功すればUserRegistrationオブジェクトを返す
// };

// ===========================================
// 問題6: 高度なEither活用パターン
// ===========================================

/**
 * 問題6-1: ファイル処理を模擬したEither操作
 */

type FileError = 
  | { type: 'NotFound'; filename: string }
  | { type: 'PermissionDenied'; filename: string }
  | { type: 'InvalidFormat'; filename: string; details: string };

// TODO: ファイル読み込みを模擬する関数
// const readFile = (filename: string): Either<FileError, string> => {
//   // ここに実装（模擬実装）
//   // 'config.json' -> 成功 (JSON文字列を返す)
//   // 'secret.txt' -> PermissionDenied エラー
//   // 'missing.txt' -> NotFound エラー
//   // その他 -> 空文字列を返す
// };

// TODO: JSON解析関数（Eitherバージョン）
// const parseJsonEither = (jsonStr: string): Either<FileError, any> => {
//   // ここに実装
//   // 解析失敗時はInvalidFormatエラーを返す
// };

// TODO: ファイルを読み込んでJSONとして解析する関数
// const readAndParseJsonFile = (filename: string): Either<FileError, any> => {
//   // ここに実装（readFileとparseJsonEitherを組み合わせ）
// };

/**
 * 問題6-2: APIレスポンス処理を模擬したEither操作
 */

type ApiError = 
  | { type: 'NetworkError'; message: string }
  | { type: 'NotFound'; resource: string }
  | { type: 'Unauthorized' }
  | { type: 'ValidationError'; errors: string[] };

type ApiResponse<T> = Either<ApiError, T>;

// TODO: HTTPステータスコードからApiErrorを作成する関数
// const createApiError = (status: number, resource: string): ApiError => {
//   // ここに実装
//   // 404 -> NotFound
//   // 401 -> Unauthorized
//   // 400 -> ValidationError
//   // その他 -> NetworkError
// };

// TODO: API呼び出しを模擬する関数
// const mockApiCall = <T>(endpoint: string, expectedData: T): ApiResponse<T> => {
//   // ここに実装（模擬実装）
//   // '/users/1' -> 成功 (expectedDataを返す)
//   // '/users/999' -> NotFound
//   // '/admin/data' -> Unauthorized
//   // その他 -> NetworkError
// };

// TODO: 複数のAPI呼び出しを順次実行する関数
// const fetchUserWithProfile = (userId: number): ApiResponse<{user: any, profile: any}> => {
//   // ここに実装
//   // ユーザー情報とプロフィール情報を順次取得
//   // どちらかが失敗した場合は失敗を返す
// };

// ===========================================
// 問題7: 非同期処理との組み合わせ
// ===========================================

/**
 * 問題7-1: TaskEither型の基本実装
 */

// 非同期処理でEitherを扱う型
type TaskEither<L, R> = Promise<Either<L, R>>;

// TODO: TaskEitherのヘルパー関数を実装してください

// 成功値をTaskEitherでラップ
// const taskEitherOf = <L, R>(value: R): TaskEither<L, R> => {
//   // ここに実装
// };

// エラー値をTaskEitherでラップ
// const taskEitherFail = <L, R>(error: L): TaskEither<L, R> => {
//   // ここに実装
// };

// TaskEitherのmap
// const mapTaskEither = <L, R, U>(fn: (value: R) => U) => 
//   async (taskEither: TaskEither<L, R>): Promise<TaskEither<L, U>> => {
//     // ここに実装
//   };

// TaskEitherのflatMap
// const flatMapTaskEither = <L, R, U>(fn: (value: R) => TaskEither<L, U>) => 
//   async (taskEither: TaskEither<L, R>): Promise<TaskEither<L, U>> => {
//     // ここに実装
//   };

/**
 * 問題7-2: 非同期バリデーション処理
 */

// TODO: 非同期でメールアドレスの重複チェックを行う関数
// const checkEmailUnique = async (email: string): Promise<Either<ValidationError, string>> => {
//   // ここに実装（模擬実装）
//   // 1秒待機後、'admin@example.com'の場合は重複エラー、それ以外は成功
// };

// TODO: 非同期でユーザー名の重複チェックを行う関数
// const checkUsernameUnique = async (username: string): Promise<Either<ValidationError, string>> => {
//   // ここに実装（模擬実装）
//   // 500ms待機後、'admin'の場合は重複エラー、それ以外は成功
// };

// TODO: 複数の非同期バリデーションを組み合わせる関数
// const validateUserAsync = async (
//   email: string,
//   username: string
// ): Promise<Either<ValidationError[], {email: string, username: string}>> => {
//   // ここに実装
//   // 両方のチェックを並行実行し、エラーがあれば配列で返す
// };

// ===========================================
// 問題8: 実践的な組み合わせ問題
// ===========================================

/**
 * 問題8-1: 設定ファイルの読み込みと検証
 */

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

// TODO: 設定ファイルを読み込んで解析・検証する関数
// const loadAndValidateConfig = (filename: string): Either<string[], AppConfig> => {
//   // ここに実装
//   // 1. ファイル読み込み (readFile)
//   // 2. JSON解析 (parseJsonEither)
//   // 3. 各フィールドの存在チェック
//   // 4. 型・値の妥当性チェック
//   // エラーは文字列配列で収集
// };

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

// TODO: お問い合わせフォームの総合バリデーション関数
// const validateContactForm = (formData: {
//   name?: string;
//   email?: string;
//   phone?: string;
//   message?: string;
//   agreeToTerms?: boolean;
// }): Either<ValidationError[], ContactForm> => {
//   // ここに実装
//   // バリデーション要件:
//   // - name: 必須、2文字以上50文字以下
//   // - email: 必須、有効なメール形式
//   // - phone: 必須、有効な電話番号形式
//   // - message: 必須、10文字以上1000文字以下
//   // - agreeToTerms: 必須、trueである必要がある
// };

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

export const runLevel3Tests = () => {
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