# Event Communication Between Host and Remote

Four approaches for passing events and data between the shell (host) and remote apps in a Module Federation setup.

## 1. Props

The simplest and most natural approach. Since a remote component is just a React component, you can pass props directly.

```tsx
// shell/src/App.tsx
const ProductList = React.lazy(() => import("products/ProductList"));

function App() {
  const handleSelect = (id: number) => {
    console.log("Selected product:", id);
  };

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ProductList onProductSelect={handleSelect} />
    </Suspense>
  );
}
```

```tsx
// products/src/components/ProductList.tsx
interface ProductListProps {
  onProductSelect?: (id: number) => void;
}

export default function ProductList({ onProductSelect }: ProductListProps) {
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id} onClick={() => onProductSelect?.(p.id)}>
          {p.name}
        </li>
      ))}
    </ul>
  );
}
```

**Pros:**
- Type-safe
- Standard React pattern, no extra dependency
- Easy to test

**Cons:**
- Host must know the remote's prop interface (tight coupling)
- Only works parent → child direction
- Not suitable for sibling remote-to-remote communication

**Best for:** Simple parent-child interactions, callback-based communication.

---

## 2. Custom Events

Browser's native `CustomEvent` API. Zero dependencies, fully decoupled.

```tsx
// products/src/components/ProductList.tsx — dispatch event
function handleClick(product: Product) {
  window.dispatchEvent(
    new CustomEvent("product:select", {
      detail: { id: product.id, name: product.name },
    })
  );
}

export default function ProductList() {
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id} onClick={() => handleClick(p)}>
          {p.name}
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// shell/src/App.tsx — listen for event
import { useEffect, useState } from "react";

function App() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSelected(detail.name);
    };
    window.addEventListener("product:select", handler);
    return () => window.removeEventListener("product:select", handler);
  }, []);

  return (
    <div>
      {selected && <p>Selected: {selected}</p>}
      <Suspense fallback={<p>Loading...</p>}>
        <ProductList />
      </Suspense>
    </div>
  );
}
```

**Pros:**
- Zero coupling — host and remote don't need to know each other
- Works for any direction: host ↔ remote, remote ↔ remote
- No extra dependencies

**Cons:**
- No type safety (must be managed manually)
- Harder to debug — no clear data flow in React DevTools
- Event naming conventions must be agreed upon

**Best for:** Loosely coupled communication, few events, cross-framework scenarios.

---

## 3. Shared Event Bus

A small event bus module shared via Module Federation's `shared` config as a singleton.

```ts
// packages/event-bus/index.ts
type Handler<T = any> = (data: T) => void;

const listeners = new Map<string, Set<Handler>>();

export const eventBus = {
  emit<T>(event: string, data: T) {
    listeners.get(event)?.forEach((fn) => fn(data));
  },

  on<T>(event: string, fn: Handler<T>): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(fn);
    // Returns unsubscribe function
    return () => listeners.get(event)!.delete(fn);
  },
};
```

Register it as a shared singleton in both configs:

```ts
// shell/vite.config.ts & products/vite.config.ts
shared: {
  react: { singleton: true },
  "react-dom": { singleton: true },
  "@myorg/event-bus": { singleton: true },  // same instance across apps
}
```

Usage in remote:

```tsx
// products/src/components/ProductList.tsx
import { eventBus } from "@myorg/event-bus";

function handleClick(product: Product) {
  eventBus.emit("product:select", product);
}
```

Usage in host:

```tsx
// shell/src/App.tsx
import { useEffect } from "react";
import { eventBus } from "@myorg/event-bus";

function App() {
  useEffect(() => {
    const unsubscribe = eventBus.on("product:select", (product) => {
      console.log("Selected:", product);
    });
    return unsubscribe;
  }, []);
}
```

**Pros:**
- Single shared instance — guaranteed message delivery
- Cleaner API than raw CustomEvents
- Can be typed with generics
- Works for any direction

**Cons:**
- Must be configured as shared singleton (version mismatch = two instances = silent failure)
- Extra package to maintain
- No built-in persistence or replay

**Best for:** Medium complexity, multiple events, typed communication across remotes.

---

## 4. Shared State (Zustand / Jotai)

Share a state management library as a singleton. Both apps read/write the same store — no events needed.

```ts
// packages/shared-store/index.ts
import { create } from "zustand";

interface AppState {
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  cartItems: Product[];
  addToCart: (product: Product) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedProduct: null,
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  cartItems: [],
  addToCart: (product) =>
    set((state) => ({ cartItems: [...state.cartItems, product] })),
}));
```

Register as shared singleton:

```ts
// shell/vite.config.ts & products/vite.config.ts
shared: {
  react: { singleton: true },
  "react-dom": { singleton: true },
  zustand: { singleton: true },
  "@myorg/shared-store": { singleton: true },
}
```

Usage in remote:

```tsx
// products/src/components/ProductList.tsx
import { useAppStore } from "@myorg/shared-store";

export default function ProductList() {
  const addToCart = useAppStore((s) => s.addToCart);

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {p.name}
          <button onClick={() => addToCart(p)}>Add to cart</button>
        </li>
      ))}
    </ul>
  );
}
```

Usage in host:

```tsx
// shell/src/App.tsx
import { useAppStore } from "@myorg/shared-store";

function Cart() {
  const cartItems = useAppStore((s) => s.cartItems);

  return (
    <div>
      <h2>Cart ({cartItems.length})</h2>
      {cartItems.map((item) => (
        <p key={item.id}>{item.name}</p>
      ))}
    </div>
  );
}
```

**Pros:**
- Reactive — UI updates automatically when state changes
- Familiar React pattern (hooks)
- Single source of truth across all micro apps
- Built-in selectors, middleware, devtools

**Cons:**
- Tighter coupling through shared store shape
- Both zustand AND store package must be singleton (more config)
- Store schema changes affect all consumers

**Best for:** Shared state that multiple apps need to read/write (cart, auth, theme, user preferences).

---

## Decision Guide

| Scenario | Approach |
|----------|----------|
| Simple parent → child callback | **Props** |
| Loosely coupled, few events | **Custom Events** |
| Many events, needs type safety | **Shared Event Bus** |
| Shared reactive state across apps | **Zustand / Jotai** |
| Cross-framework (React + Vue) | **Custom Events** |
| Complex app with auth, cart, theme | **Zustand + Event Bus** |

## Combining Approaches

In real-world projects, you'll often combine multiple approaches:

```
Props           → Parent-child data flow (host → remote)
Custom Events   → One-off notifications (toast, analytics)
Shared Store    → Global state (auth, cart, theme)
```

The key principle: **use the simplest approach that solves your problem.** Start with props, reach for events when you need decoupling, and add shared state only when reactive cross-app state is truly necessary.
