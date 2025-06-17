# レベル4B: 状態管理とパフォーマンス

## 目標
このレベルでは、関数型プログラミングにおける状態管理パターンと、パフォーマンス最適化技術を学びます。

## 前提条件
- [レベル4A: 非同期処理の基礎](../04a-async-basics/README.md)を完了していること
- TaskEitherの基本的な使い方を理解していること

## 学習内容

### 1. なぜ関数型状態管理が重要なのか？

**従来のミューテーブルな状態管理の問題:**

```typescript
// ❌ 従来のミューテーブルな状態管理
class UserStore {
  private users: User[] = [];
  private loading: boolean = false;
  private error: string | null = null;

  async fetchUsers() {
    this.loading = true; // 状態を直接変更
    this.error = null;
    
    try {
      const response = await fetch('/api/users');
      this.users = await response.json(); // 配列を直接置き換え
    } catch (error) {
      this.error = error.message; // エラー状態を直接設定
    } finally {
      this.loading = false; // ローディング状態を直接変更
    }
  }

  addUser(user: User) {
    this.users.push(user); // 配列を直接変更
  }

  updateUser(id: number, updates: Partial<User>) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex >= 0) {
      this.users[userIndex] = { ...this.users[userIndex], ...updates }; // 直接変更
    }
  }
}

// 問題点：
// 1. 状態変更が予測しにくい
// 2. 副作用が分散している
// 3. テストが困難
// 4. 時間経過による状態の変化を追跡しにくい
// 5. 並行処理で競合状態が発生しやすい
```

```typescript
// ✅ 関数型状態管理の解決策
type UserState = {
  readonly users: readonly User[];
  readonly loading: boolean;
  readonly error: string | null;
};

type UserAction = 
  | { type: 'FETCH_USERS_START' }
  | { type: 'FETCH_USERS_SUCCESS'; payload: User[] }
  | { type: 'FETCH_USERS_FAILURE'; payload: string }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: { id: number; updates: Partial<User> } };

// 純粋関数による状態更新
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'FETCH_USERS_START':
      return { ...state, loading: true, error: null };
      
    case 'FETCH_USERS_SUCCESS':
      return { ...state, loading: false, users: action.payload };
      
    case 'FETCH_USERS_FAILURE':
      return { ...state, loading: false, error: action.payload };
      
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
      
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id
            ? { ...user, ...action.payload.updates }
            : user
        )
      };
      
    default:
      return state;
  }
};

// 利点：
// 1. 状態変更が予測可能（純粋関数）
// 2. 時間経過による状態変化をトレース可能
// 3. テストしやすい
// 4. 並行処理でも安全
// 5. undo/redoが簡単に実装できる
```

### 2. 関数型状態管理パターン

#### Reducer パターン
```typescript
// 汎用的なReducerの型定義
type Reducer<State, Action> = (state: State, action: Action) => State;

// State管理のためのヘルパー関数
const createStore = <State, Action>(
  reducer: Reducer<State, Action>,
  initialState: State
) => {
  let currentState = initialState;
  const listeners: Array<(state: State) => void> = [];

  return {
    getState: (): State => currentState,
    
    dispatch: (action: Action): void => {
      const newState = reducer(currentState, action);
      if (newState !== currentState) {
        currentState = newState;
        listeners.forEach(listener => listener(currentState));
      }
    },
    
    subscribe: (listener: (state: State) => void): (() => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      };
    }
  };
};

// 使用例
const userStore = createStore(userReducer, {
  users: [],
  loading: false,
  error: null
});

// 状態変更
userStore.dispatch({ type: 'FETCH_USERS_START' });
userStore.dispatch({ 
  type: 'FETCH_USERS_SUCCESS', 
  payload: [{ id: 1, name: 'Alice', email: 'alice@example.com' }] 
});
```

### 3. メモ化とパフォーマンス最適化

#### なぜメモ化が必要なのか？

```typescript
// ❌ 非効率な計算の例
const expensiveCalculation = (users: User[]) => {
  console.log('Expensive calculation running...'); // 毎回実行される
  return users
    .filter(user => user.age >= 18)
    .map(user => ({
      ...user,
      displayName: `${user.firstName} ${user.lastName}`,
      isAdult: true
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};

// Reactコンポーネントで使用した場合
const UserList = ({ users }: { users: User[] }) => {
  const processedUsers = expensiveCalculation(users); // 毎回re-renderで実行される
  
  return (
    <div>
      {processedUsers.map(user => (
        <div key={user.id}>{user.displayName}</div>
      ))}
    </div>
  );
};

// 問題: usersが変わらなくても、親コンポーネントがre-renderするたびに計算が実行される
```

```typescript
// ✅ メモ化による最適化
const createMemoize = <Args extends readonly unknown[], Return>(
  fn: (...args: Args) => Return,
  keyFn?: (...args: Args) => string
): ((...args: Args) => Return) => {
  const cache = new Map<string, Return>();
  
  return (...args: Args): Return => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      console.log('Cache hit!');
      return cache.get(key)!;
    }
    
    console.log('Cache miss, calculating...');
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// メモ化された計算関数
const memoizedExpensiveCalculation = createMemoize(
  expensiveCalculation,
  (users) => `users-${users.length}-${users.map(u => u.id).join(',')}`
);

// LRUキャッシュの実装
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  
  constructor(private maxSize: number) {}
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 最近使用されたアイテムを最後に移動
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 最も古いアイテムを削除
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// LRUキャッシュを使ったメモ化
const createLRUMemoize = <Args extends readonly unknown[], Return>(
  fn: (...args: Args) => Return,
  maxSize: number = 100,
  keyFn?: (...args: Args) => string
) => {
  const cache = new LRUCache<string, Return>(maxSize);
  
  return (...args: Args): Return => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
```

### 4. 実践例：ショッピングカートの状態管理

```typescript
// ショッピングカートの型定義
type CartItem = {
  readonly productId: number;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
};

type CartState = {
  readonly items: readonly CartItem[];
  readonly discountCode: string | null;
  readonly discountAmount: number;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'APPLY_DISCOUNT'; payload: { code: string; amount: number } }
  | { type: 'CLEAR_CART' };

// カート状態のReducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }]
        };
      }
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
    
    case 'APPLY_DISCOUNT':
      return {
        ...state,
        discountCode: action.payload.code,
        discountAmount: action.payload.amount
      };
    
    case 'CLEAR_CART':
      return {
        items: [],
        discountCode: null,
        discountAmount: 0
      };
    
    default:
      return state;
  }
};

// カート計算のメモ化
const calculateCartTotals = createMemoize((state: CartState) => {
  const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = state.discountAmount;
  const total = Math.max(0, subtotal - discountAmount);
  
  return {
    subtotal,
    discountAmount,
    total,
    itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0)
  };
});

// 使用例
const cartStore = createStore(cartReducer, {
  items: [],
  discountCode: null,
  discountAmount: 0
});

// 商品追加
cartStore.dispatch({
  type: 'ADD_ITEM',
  payload: { productId: 1, name: 'TypeScript本', price: 3000 }
});

// 合計計算（メモ化されているため、状態が変わらない限り再計算されない）
const totals = calculateCartTotals(cartStore.getState());
console.log(totals); // { subtotal: 3000, discountAmount: 0, total: 3000, itemCount: 1 }
```

### 5. 学習のポイント

#### 重要な概念
1. **不変性** - 状態を直接変更せず、新しい状態を作成する
2. **純粋関数** - Reducerは同じ入力に対して常に同じ出力を返す
3. **予測可能性** - 状態変更がアクションによって明示的に定義される
4. **テスタビリティ** - 純粋関数なので単体テストが簡単

#### パフォーマンス考慮事項
1. **メモ化** - 重い計算を避けるため
2. **参照の同一性** - 不要な再レンダリングを避けるため
3. **データ構造の選択** - 効率的な更新のため

## 練習問題

### 問題1: Todoリストの状態管理
```typescript
// TODO: TodoリストのReducerを実装してください
type Todo = {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
  readonly createdAt: Date;
};

type TodoState = {
  readonly todos: readonly Todo[];
  readonly filter: 'all' | 'active' | 'completed';
};

type TodoAction = 
  | { type: 'ADD_TODO'; payload: { text: string } }
  | { type: 'TOGGLE_TODO'; payload: number }
  | { type: 'DELETE_TODO'; payload: number }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' };

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  // ここに実装
};
```

### 問題2: メモ化されたフィルタリング関数
```typescript
// TODO: フィルタリングされたTodoリストを返すメモ化関数を実装してください
const getFilteredTodos = createMemoize((state: TodoState): readonly Todo[] => {
  // フィルタに基づいてTodoをフィルタリング
  // ヒント: state.filterに基づいてstate.todosをフィルタリング
});
```

## 次のステップ
このレベルをマスターしたら、[レベル4C: エンタープライズパターン](../04c-enterprise-patterns/README.md)に進んで、実際の企業レベルのアプリケーションで使われるパターンを学びましょう。