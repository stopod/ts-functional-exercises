# データ変換パイプライン

## 概要

このモジュールは、関数型プログラミングの原則に基づいた型安全で拡張可能なデータ処理パイプラインを提供します。CSV、JSON、APIからのデータを読み込み、バリデーション、変換、集計を行うことができます。

**ファイル**: `pipeline.ts` (685行の本格的な実装)

## 主な機能

### 🔄 データソース対応
- CSV ファイル読み込み
- JSON ファイル読み込み
- API からのデータ取得
- ストリーミング処理対応

### 🛡️ 型安全な変換
- スキーマベースバリデーション
- 型安全な変換チェーン
- エラーハンドリングとリカバリ
- 部分的な失敗の処理

### ⚡ パフォーマンス最適化
- 遅延評価による効率的な処理
- バッチ処理による高速化
- メモリ効率的なストリーミング
- 並列処理サポート

## 使用例

### 基本的な使用方法

```typescript
import { DataPipeline, transforms, aggregates, isRight, isLeft } from './pipeline';

// CSVデータの処理
const result = await DataPipeline
  .fromCsv('users.csv')
  .validate(row => typeof row.email === 'string' ? right(row) : left({ stage: 'validate', message: 'Invalid email' }))
  .transform(user => ({ ...user, fullName: `${user.firstName} ${user.lastName}` }))
  .filter(user => user.isActive)
  .run();

// 結果の取得
if (isRight(result)) {
  console.log('処理成功:', result.right);
} else {
  console.error('エラー:', result.left);
}
```

### 高度な使用例

```typescript
// 複数データソースの結合処理
const enrichedData = DataPipeline
  .fromCsv('orders.csv')
  .validate(orderSchema)
  .enrichWith(
    DataPipeline.fromApi('/api/customers'),
    (order, customers) => ({
      ...order,
      customer: customers.find(c => c.id === order.customerId)
    })
  )
  .groupBy(order => order.customer.region)
  .aggregate(orders => ({
    totalAmount: orders.reduce((sum, order) => sum + order.amount, 0),
    orderCount: orders.length,
    averageOrder: orders.reduce((sum, order) => sum + order.amount, 0) / orders.length
  }))
  .collect();
```

## アーキテクチャ

### データフロー
```
Data Source → Parse → Validate → Transform → Filter → Aggregate → Output
     ↓           ↓        ↓          ↓         ↓         ↓         ↓
   CSV/JSON    型変換   スキーマ    ビジネス   条件      集計    結果保存
             エラー処理  チェック   ロジック   絞込み    処理    
```

### 主要コンポーネント

1. **DataPipeline**: メインのパイプラインクラス
2. **Parser**: データ解析（CSV/JSON/API）
3. **Validator**: スキーマベースバリデーション
4. **Transformer**: データ変換処理
5. **Aggregator**: 集計処理
6. **ErrorHandler**: エラーハンドリング

## ファイル構成

```
examples/data-pipeline/
├── README.md              # このファイル
├── pipeline.ts            # メインパイプライン実装
├── parsers.ts             # データ解析器
├── validators.ts          # バリデーター
├── transformers.ts        # 変換処理
├── aggregators.ts         # 集計処理
├── error-handling.ts      # エラーハンドリング
├── examples/              # 使用例
│   ├── user-processing.ts    # ユーザーデータ処理例
│   ├── sales-analysis.ts     # 売上分析例
│   └── data-migration.ts     # データ移行例
└── test/                  # テストファイル
    ├── pipeline.test.ts
    ├── parsers.test.ts
    └── validators.test.ts
```

## 次のステップ

1. `pipeline.ts` でメインのパイプライン実装を確認
2. `examples/` ディレクトリの実用例を参照
3. 自分のプロジェクトに適用してカスタマイズ

このパイプラインシステムは、大規模なデータ処理、ETL処理、リアルタイム分析など、様々な用途で活用できます。