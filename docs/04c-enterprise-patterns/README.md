# レベル4C: エンタープライズパターン

## 目標
このレベルでは、実際の企業レベルのアプリケーションで使用される高度な関数型プログラミングパターンを学びます。

## 前提条件
- [レベル4A: 非同期処理の基礎](../04a-async-basics/README.md)を完了していること
- [レベル4B: 状態管理とパフォーマンス](../04b-state-management/README.md)を完了していること

## 学習内容

### 1. なぜエンタープライズパターンが必要なのか？

**大規模アプリケーションの課題:**

```typescript
// ❌ スケールしないアプローチ
// 小規模では問題ないが、大規模になると破綻する

// 単一のファイルにすべてのロジックが詰め込まれている
const UserService = {
  async getUser(id: number) {
    // データベース接続
    // バリデーション
    // 認証チェック
    // キャッシング
    // ロギング
    // エラーハンドリング
    // すべてが混在...
  },
  
  async createUser(userData: any) {
    // 同様にすべてが混在...
  }
};

// 問題点：
// 1. 責任が分散していない（Single Responsibility Principle違反）
// 2. テストが困難
// 3. 機能追加時の影響範囲が大きい
// 4. チーム開発でコンフリクトが発生しやすい
// 5. 再利用性が低い
```

```typescript
// ✅ エンタープライズパターンによる解決
// 責任を分離し、組み合わせ可能な設計

// Domain Layer: ビジネスロジック
type User = {
  readonly id: UserId;
  readonly email: Email;
  readonly name: UserName;
  readonly createdAt: Date;
};

// Application Layer: ユースケース
interface UserRepository {
  findById(id: UserId): TaskEither<RepositoryError, Option<User>>;
  save(user: User): TaskEither<RepositoryError, User>;
}

interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, error: Error, context?: Record<string, unknown>): void;
}

// ユースケースの実装
const createUserUseCase = 
  (userRepo: UserRepository, logger: Logger) =>
  (userData: CreateUserRequest): TaskEither<ApplicationError, User> => {
    return pipe(
      validateCreateUserRequest(userData),
      TaskEither.fromEither,
      TaskEither.flatMap(validData => 
        createUser(validData)
          .map(user => {
            logger.info('User created successfully', { userId: user.id });
            return user;
          })
      ),
      TaskEither.flatMap(user => userRepo.save(user))
    );
  };

// 利点：
// 1. 各層が明確に分離されている
// 2. 依存関係の注入によりテストしやすい
// 3. 機能追加時の影響範囲が限定的
// 4. 再利用可能なコンポーネント
// 5. チーム開発でのコンフリクトが少ない
```

### 2. 関数型アーキテクチャパターン

#### Clean Architecture + 関数型プログラミング

```typescript
// Domain Layer: エンティティとビジネスルール
namespace Domain {
  // Value Objects
  export type UserId = Branded<number, 'UserId'>;
  export type Email = Branded<string, 'Email'>;
  export type UserName = Branded<string, 'UserName'>;
  
  // Branded Types for type safety
  type Branded<T, B> = T & { readonly __brand: B };
  
  export const createUserId = (value: number): Either<ValidationError, UserId> =>
    value > 0 
      ? right(value as UserId)
      : left({ field: 'userId', message: 'User ID must be positive' });
  
  export const createEmail = (value: string): Either<ValidationError, Email> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value)
      ? right(value as Email)
      : left({ field: 'email', message: 'Invalid email format' });
  };
  
  export const createUserName = (value: string): Either<ValidationError, UserName> =>
    value.length >= 2 && value.length <= 50
      ? right(value as UserName)
      : left({ field: 'userName', message: 'User name must be 2-50 characters' });
  
  // Domain Entity
  export type User = {
    readonly id: UserId;
    readonly email: Email;
    readonly name: UserName;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  };
  
  // Domain Service
  export const createUser = (
    email: Email,
    name: UserName
  ): User => ({
    id: generateId() as UserId,
    email,
    name,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Application Layer: ユースケース
namespace Application {
  export type CreateUserRequest = {
    email: string;
    name: string;
  };
  
  export type UserResponse = {
    id: number;
    email: string;
    name: string;
    createdAt: string;
  };
  
  // Port (Interface)
  export interface UserRepository {
    findByEmail(email: Domain.Email): TaskEither<RepositoryError, Option<Domain.User>>;
    save(user: Domain.User): TaskEither<RepositoryError, Domain.User>;
  }
  
  export interface EventPublisher {
    publish<T>(event: DomainEvent<T>): TaskEither<PublishError, void>;
  }
  
  // Use Case
  export const createUserUseCase = 
    (userRepo: UserRepository, eventPublisher: EventPublisher) =>
    (request: CreateUserRequest): TaskEither<ApplicationError, UserResponse> => {
      
      const validateRequest = (req: CreateUserRequest): Either<ValidationError, Domain.User> =>
        pipe(
          sequenceEither({
            email: Domain.createEmail(req.email),
            name: Domain.createUserName(req.name)
          }),
          mapEither(({ email, name }) => Domain.createUser(email, name))
        );
      
      const checkEmailUniqueness = (user: Domain.User): TaskEither<ApplicationError, Domain.User> =>
        userRepo.findByEmail(user.email)
          .mapLeft(err => ({ type: 'RepositoryError' as const, details: err }))
          .flatMap(optionUser =>
            isSome(optionUser)
              ? TaskEither.left({ type: 'EmailAlreadyExists' as const, email: user.email })
              : TaskEither.of(user)
          );
      
      const persistUser = (user: Domain.User): TaskEither<ApplicationError, Domain.User> =>
        userRepo.save(user)
          .mapLeft(err => ({ type: 'RepositoryError' as const, details: err }));
      
      const publishEvent = (user: Domain.User): TaskEither<ApplicationError, Domain.User> =>
        eventPublisher.publish({
          type: 'UserCreated',
          payload: user,
          timestamp: new Date()
        })
        .map(() => user)
        .mapLeft(err => ({ type: 'EventPublishError' as const, details: err }));
      
      const mapToResponse = (user: Domain.User): UserResponse => ({
        id: user.id as number,
        email: user.email as string,
        name: user.name as string,
        createdAt: user.createdAt.toISOString()
      });
      
      return pipe(
        validateRequest(request),
        TaskEither.fromEither,
        TaskEither.mapLeft(err => ({ type: 'ValidationError' as const, details: err })),
        TaskEither.flatMap(checkEmailUniqueness),
        TaskEither.flatMap(persistUser),
        TaskEither.flatMap(publishEvent),
        TaskEither.map(mapToResponse)
      );
    };
}

// Infrastructure Layer: 実装詳細
namespace Infrastructure {
  // Adapter
  export class DatabaseUserRepository implements Application.UserRepository {
    constructor(private db: DatabaseConnection) {}
    
    findByEmail(email: Domain.Email): TaskEither<RepositoryError, Option<Domain.User>> {
      return TaskEither.fromPromise(
        this.db.query('SELECT * FROM users WHERE email = ?', [email]),
        (error): RepositoryError => ({
          type: 'DatabaseError',
          message: error.message,
          query: 'findByEmail'
        })
      ).map(rows => 
        rows.length > 0 
          ? some(this.mapRowToUser(rows[0]))
          : none
      );
    }
    
    save(user: Domain.User): TaskEither<RepositoryError, Domain.User> {
      return TaskEither.fromPromise(
        this.db.query(
          'INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [user.id, user.email, user.name, user.createdAt, user.updatedAt]
        ),
        (error): RepositoryError => ({
          type: 'DatabaseError',
          message: error.message,
          query: 'save'
        })
      ).map(() => user);
    }
    
    private mapRowToUser(row: any): Domain.User {
      // データベースの行をDomainオブジェクトにマッピング
      return {
        id: row.id as Domain.UserId,
        email: row.email as Domain.Email,
        name: row.name as Domain.UserName,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    }
  }
}
```

### 3. 高度なエラーハンドリングパターン

#### Railway Oriented Programming

```typescript
// エラーチェーンの管理
type ValidationResult<T> = Either<ValidationError[], T>;

// 複数のバリデーションを組み合わせる
const validateUserRegistration = (data: UserRegistrationData): ValidationResult<ValidatedUserData> => {
  const validations = [
    validateEmail(data.email),
    validatePassword(data.password),
    validateAge(data.age),
    validateTermsAccepted(data.termsAccepted)
  ];
  
  // すべてのエラーを収集
  return sequenceValidation(validations)
    .mapEither(([email, password, age, termsAccepted]) => ({
      email,
      password,
      age,
      termsAccepted
    }));
};

// バリデーション結果を収集するヘルパー
const sequenceValidation = <T>(
  validations: Either<ValidationError, T>[]
): Either<ValidationError[], T[]> => {
  const errors: ValidationError[] = [];
  const values: T[] = [];
  
  for (const validation of validations) {
    if (isLeft(validation)) {
      errors.push(validation.left);
    } else {
      values.push(validation.right);
    }
  }
  
  return errors.length > 0 ? left(errors) : right(values);
};
```

### 4. サーキットブレーカーパターン

```typescript
// 外部サービスの障害に対する保護
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

type CircuitBreakerConfig = {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
};

class CircuitBreaker<T, E> {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  
  constructor(
    private config: CircuitBreakerConfig,
    private operation: () => TaskEither<E, T>
  ) {}
  
  execute(): TaskEither<E | CircuitBreakerError, T> {
    switch (this.state) {
      case 'OPEN':
        if (this.shouldAttemptReset()) {
          return this.attemptReset();
        }
        return TaskEither.left({
          type: 'CircuitOpen',
          message: 'Circuit breaker is open'
        } as CircuitBreakerError);
        
      case 'HALF_OPEN':
        return this.executeInHalfOpenState();
        
      case 'CLOSED':
        return this.executeInClosedState();
    }
  }
  
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime > this.config.recoveryTimeout;
  }
  
  private attemptReset(): TaskEither<E | CircuitBreakerError, T> {
    this.state = 'HALF_OPEN';
    this.successCount = 0;
    return this.executeInHalfOpenState();
  }
  
  private executeInClosedState(): TaskEither<E | CircuitBreakerError, T> {
    return this.operation()
      .mapLeft(error => {
        this.onFailure();
        return error;
      })
      .map(result => {
        this.onSuccess();
        return result;
      });
  }
  
  private executeInHalfOpenState(): TaskEither<E | CircuitBreakerError, T> {
    return this.operation()
      .mapLeft(error => {
        this.state = 'OPEN';
        this.onFailure();
        return error;
      })
      .map(result => {
        this.successCount++;
        if (this.successCount >= 3) { // 3回成功したらCLOSEDに戻す
          this.state = 'CLOSED';
          this.failureCount = 0;
        }
        return result;
      });
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
  }
}

// 使用例
const apiCall = (): TaskEither<ApiError, ApiResponse> =>
  TaskEither.fromPromise(
    fetch('/api/external-service'),
    (error): ApiError => ({ type: 'NetworkError', message: error.message })
  );

const protectedApiCall = new CircuitBreaker(
  {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1分
    monitoringPeriod: 10000  // 10秒
  },
  apiCall
);
```

### 5. 実践例：Eコマースの注文処理システム

```typescript
// ドメインモデル
namespace OrderDomain {
  export type OrderId = Branded<string, 'OrderId'>;
  export type ProductId = Branded<string, 'ProductId'>;
  export type UserId = Branded<string, 'UserId'>;
  export type Money = Branded<number, 'Money'>;
  
  export type OrderItem = {
    readonly productId: ProductId;
    readonly quantity: number;
    readonly unitPrice: Money;
  };
  
  export type Order = {
    readonly id: OrderId;
    readonly userId: UserId;
    readonly items: readonly OrderItem[];
    readonly status: OrderStatus;
    readonly createdAt: Date;
  };
  
  export type OrderStatus = 
    | 'PENDING'
    | 'CONFIRMED'
    | 'PAID'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';
}

// アプリケーションサービス
namespace OrderApplication {
  export const processOrderUseCase = 
    (
      orderRepo: OrderRepository,
      inventoryService: InventoryService,
      paymentService: PaymentService,
      emailService: EmailService,
      eventPublisher: EventPublisher
    ) =>
    (request: CreateOrderRequest): TaskEither<OrderError, OrderDomain.Order> => {
      
      const validateOrder = (req: CreateOrderRequest): TaskEither<OrderError, OrderDomain.Order> =>
        pipe(
          validateOrderRequest(req),
          TaskEither.fromEither,
          TaskEither.mapLeft(err => ({ type: 'ValidationError' as const, details: err }))
        );
      
      const checkInventory = (order: OrderDomain.Order): TaskEither<OrderError, OrderDomain.Order> =>
        inventoryService.checkAvailability(order.items)
          .mapLeft(err => ({ type: 'InventoryError' as const, details: err }))
          .map(() => order);
      
      const reserveInventory = (order: OrderDomain.Order): TaskEither<OrderError, OrderDomain.Order> =>
        inventoryService.reserve(order.items)
          .mapLeft(err => ({ type: 'InventoryError' as const, details: err }))
          .map(() => order);
      
      const calculateTotal = (order: OrderDomain.Order): OrderDomain.Order => ({
        ...order,
        // 合計金額の計算ロジック
      });
      
      const processPayment = (order: OrderDomain.Order): TaskEither<OrderError, OrderDomain.Order> =>
        paymentService.charge(order.userId, calculateOrderTotal(order))
          .mapLeft(err => ({ type: 'PaymentError' as const, details: err }))
          .map(() => ({ ...order, status: 'PAID' as const }));
      
      const saveOrder = (order: OrderDomain.Order): TaskEither<OrderError, OrderDomain.Order> =>
        orderRepo.save(order)
          .mapLeft(err => ({ type: 'RepositoryError' as const, details: err }));
      
      const sendConfirmationEmail = (order: OrderDomain.Order): TaskEither<OrderError, OrderDomain.Order> =>
        emailService.sendOrderConfirmation(order)
          .mapLeft(err => ({ type: 'EmailError' as const, details: err }))
          .map(() => order);
      
      const publishOrderCreatedEvent = (order: OrderDomain.Order): TaskEither<OrderError, OrderDomain.Order> =>
        eventPublisher.publish({
          type: 'OrderCreated',
          payload: order,
          timestamp: new Date()
        })
        .mapLeft(err => ({ type: 'EventError' as const, details: err }))
        .map(() => order);
      
      // すべての処理をパイプラインで組み合わせ
      return pipe(
        validateOrder(request),
        TaskEither.flatMap(checkInventory),
        TaskEither.map(calculateTotal),
        TaskEither.flatMap(reserveInventory),
        TaskEither.flatMap(processPayment),
        TaskEither.flatMap(saveOrder),
        TaskEither.flatMap(sendConfirmationEmail),
        TaskEither.flatMap(publishOrderCreatedEvent)
      );
    };
}
```

## 学習のポイント

### アーキテクチャの原則
1. **関心の分離** - 各層が明確な責任を持つ
2. **依存関係の逆転** - 抽象に依存し、具象に依存しない
3. **テスタビリティ** - 依存関係の注入によりテストしやすい設計

### エラーハンドリングの戦略
1. **Railway Oriented Programming** - エラーを明示的に扱う
2. **Circuit Breaker** - 外部システムの障害から保護
3. **Retry with Backoff** - 一時的な障害への対処

### パフォーマンス考慮事項
1. **非同期処理の最適化** - TaskEitherの効率的な使用
2. **メモ化** - 重い計算の最適化
3. **イベント駆動アーキテクチャ** - 疎結合な設計

## 練習問題

### 問題1: 在庫管理システム
```typescript
// TODO: 在庫管理システムのユースケースを実装してください
// 要件:
// 1. 商品の在庫を確認
// 2. 在庫を予約
// 3. 在庫を削減
// 4. 在庫不足の場合は適切なエラーを返す
// 5. すべての操作はトランザクション内で実行される必要がある
```

### 問題2: サーキットブレーカーの実装
```typescript
// TODO: より高度なサーキットブレーカーを実装してください
// 要件:
// 1. タイムアウト機能
// 2. 成功率に基づく回復判定
// 3. メトリクスの収集
// 4. 設定可能なフォールバック機能
```

## まとめ
エンタープライズパターンをマスターすることで、大規模で複雑なアプリケーションを関数型プログラミングで構築できるようになります。これらのパターンは、保守性、テスタビリティ、スケーラビリティを向上させるために不可欠です。