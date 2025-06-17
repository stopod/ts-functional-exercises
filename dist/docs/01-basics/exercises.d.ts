/**
 * 問題1-1: 2つの数値を受け取り、その合計を返す純粋関数を作成してください
 */
/**
 * 問題1-2: 文字列を受け取り、その文字数を返す純粋関数を作成してください
 */
/**
 * 問題1-3: 配列を受け取り、その最大値を返す純粋関数を作成してください
 * 空配列の場合は undefined を返してください
 */
/**
 * 問題2-1: 配列に新しい要素を追加する不変関数を作成してください
 * 元の配列は変更せず、新しい配列を返してください
 */
/**
 * 問題2-2: オブジェクトの特定のプロパティを更新する不変関数を作成してください
 * 元のオブジェクトは変更せず、新しいオブジェクトを返してください
 */
type Person = {
    name: string;
    age: number;
    email: string;
};
/**
 * 問題2-3: 配列から特定の要素を削除する不変関数を作成してください
 */
/**
 * 問題3-1: 数値の配列を受け取り、すべての値を2倍にして返してください
 */
export declare function problem3_1(): number[];
/**
 * 問題3-2: 人物の配列から、年齢が18歳以上の人だけを抽出してください
 */
export declare function problem3_2(): Person[];
/**
 * 問題3-3: 文字列の配列を受け取り、すべての文字列を連結して返してください
 * 例: ['Hello', ' ', 'World'] → 'Hello World'
 */
export declare function problem3_3(): string;
/**
 * 問題3-4: 商品の配列から、価格の合計を計算してください
 */
type Product = {
    name: string;
    price: number;
};
export declare function problem3_4(): number;
/**
 * 問題4-1: 特定の数で割り切れるかどうかを判定する関数を作成する
 * 関数ファクトリーを作成してください
 */
/**
 * 問題4-2: 特定の文字で文字列を囲む関数を作成する関数ファクトリーを作成してください
 */
/**
 * 問題4-3: 配列の要素を特定の条件でフィルタリングする関数を作成する
 * 関数ファクトリーを作成してください
 */
/**
 * 問題5-1: 学生の成績データを処理する関数を作成してください
 * 以下の要件を満たしてください：
 * 1. 合格点（60点）以上の学生のみを抽出
 * 2. 各学生の成績に10点のボーナスを追加
 * 3. 学生の名前のリストを作成
 */
type Student = {
    name: string;
    score: number;
};
export declare function problem5_1(): {
    passingStudents: Student[];
    studentsWithBonus: {
        score: number;
        name: string;
    }[];
    passingStudentNames: string[];
};
/**
 * 問題5-2: ECサイトの注文データを処理する関数を作成してください
 * 以下の要件を満たしてください：
 * 1. 配送済みの注文のみを抽出
 * 2. 各注文の合計金額を計算
 * 3. 全注文の合計売上を計算
 */
type Order = {
    id: string;
    items: Product[];
    status: 'pending' | 'shipped' | 'delivered';
};
export declare function problem5_2(): {
    deliveredOrders: Order[];
    totalRevenue: number;
};
export declare const runLevel1Tests: () => void;
export {};
