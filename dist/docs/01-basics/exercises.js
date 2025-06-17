"use strict";
// @ts-nocheck - 教育用練習問題ファイル（未使用変数/型は意図的）
// レベル1: 基礎概念 - 練習問題
// 各問題を解いて、関数型プログラミングの基礎を身につけましょう
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLevel1Tests = void 0;
exports.problem3_1 = problem3_1;
exports.problem3_2 = problem3_2;
exports.problem3_3 = problem3_3;
exports.problem3_4 = problem3_4;
exports.problem5_1 = problem5_1;
exports.problem5_2 = problem5_2;
// TODO: updatePersonAge関数を実装してください
// const updatePersonAge = (person: Person, newAge: number): Person => {
//   // ここに実装
// };
/**
 * 問題2-3: 配列から特定の要素を削除する不変関数を作成してください
 */
// TODO: removeElement関数を実装してください
// const removeElement = <T>(arr: T[], elementToRemove: T): T[] => {
//   // ここに実装
// };
// ===========================================
// 問題3: 高階関数の活用
// ===========================================
/**
 * 問題3-1: 数値の配列を受け取り、すべての値を2倍にして返してください
 */
// TODO: mapを使って実装してください
function problem3_1() {
    const numbers = [1, 2, 3, 4, 5];
    const doubledNumbers = numbers.map((n) => n * 2);
    return doubledNumbers;
}
/**
 * 問題3-2: 人物の配列から、年齢が18歳以上の人だけを抽出してください
 */
// TODO: filterを使って実装してください
function problem3_2() {
    const people = [
        { name: '太郎', age: 17, email: 'taro@example.com' },
        { name: '花子', age: 22, email: 'hanako@example.com' },
        { name: '次郎', age: 16, email: 'jiro@example.com' },
        { name: '美子', age: 25, email: 'miko@example.com' }
    ];
    const adults = people.filter((person) => person.age >= 18);
    return adults;
}
/**
 * 問題3-3: 文字列の配列を受け取り、すべての文字列を連結して返してください
 * 例: ['Hello', ' ', 'World'] → 'Hello World'
 */
// TODO: reduceを使って実装してください
function problem3_3() {
    const words = ['TypeScript', 'は', '素晴らしい', '言語', 'です'];
    const sentence = words.reduce((acc, word) => acc + word, '');
    return sentence;
}
// TODO: reduceを使って実装してください
function problem3_4() {
    const products = [
        { name: 'ノートPC', price: 80000 },
        { name: 'キーボード', price: 5000 },
        { name: 'マウス', price: 2000 },
        { name: 'モニター', price: 30000 }
    ];
    const totalPrice = products.reduce((acc, product) => acc + product.price, 0);
    return totalPrice;
}
function problem5_1() {
    const students = [
        { name: '田中', score: 85 },
        { name: '佐藤', score: 45 },
        { name: '鈴木', score: 72 },
        { name: '高橋', score: 58 },
        { name: '山田', score: 90 }
    ];
    // 1. 合格点以上の学生を抽出
    const passingStudents = students.filter((student) => student.score >= 60);
    // 2. ボーナス点を追加した学生データを作成
    const studentsWithBonus = passingStudents.map((student) => ({
        ...student,
        score: student.score + 10
    }));
    // 3. 学生の名前のリストを作成
    const passingStudentNames = studentsWithBonus.map((student) => student.name);
    return { passingStudents, studentsWithBonus, passingStudentNames };
}
function problem5_2() {
    const orders = [
        {
            id: 'order-1',
            items: [
                { name: 'ノートPC', price: 80000 },
                { name: 'マウス', price: 2000 }
            ],
            status: 'delivered'
        },
        {
            id: 'order-2',
            items: [
                { name: 'キーボード', price: 5000 }
            ],
            status: 'pending'
        },
        {
            id: 'order-3',
            items: [
                { name: 'モニター', price: 30000 },
                { name: 'キーボード', price: 5000 },
                { name: 'マウス', price: 2000 }
            ],
            status: 'shipped'
        }
    ];
    // 1. 配送済みの注文を抽出
    const deliveredOrders = orders.filter((order) => order.status === 'delivered');
    // 2. 各注文の合計金額を計算する関数
    const calculateOrderTotal = (order) => {
        return order.items.reduce((acc, item) => acc + item.price, 0);
    };
    // 3. 全注文の合計売上を計算
    const totalRevenue = deliveredOrders
        .map(calculateOrderTotal)
        .reduce((acc, total) => acc + total, 0);
    return { deliveredOrders, totalRevenue };
}
// ===========================================
// テスト用の関数（実装が完了したら実行してください）
// ===========================================
const runLevel1Tests = () => {
    console.log('=== レベル1 練習問題のテスト ===');
    // テスト実行のコードは solutions.ts で確認してください
    console.log('solutions.ts を確認して、実装を確認してください');
    // 実際のテスト実行
    console.log('Problem 3-1 result:', problem3_1());
    console.log('Problem 3-2 result:', problem3_2());
    console.log('Problem 3-3 result:', problem3_3());
    console.log('Problem 3-4 result:', problem3_4());
    console.log('Problem 5-1 result:', problem5_1());
    console.log('Problem 5-2 result:', problem5_2());
};
exports.runLevel1Tests = runLevel1Tests;
//# sourceMappingURL=exercises.js.map