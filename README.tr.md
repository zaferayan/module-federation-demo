# Module Federation Demo

Minimal bir Module Federation demo projesi. **Shell** (host) uygulaması, **Products** (remote) uygulamasından `ProductList` componentini runtime'da yükler.

## Mimari

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│  Shell (Host) :3000         │        │  Products (Remote) :3001    │
│                             │  HTTP  │                             │
│  App.tsx                    │◄───────│  remoteEntry.js             │
│    └─ React.lazy ───────────┼────────┼──► ProductList.tsx          │
│       import("products/     │        │                             │
│              ProductList")  │        │  exposes:                   │
│                             │        │    ./ProductList             │
│  shared: react, react-dom   │◄──────►│  shared: react, react-dom   │
│          (singleton)        │  aynı  │          (singleton)        │
│                             │  kopya │                             │
└─────────────────────────────┘        └─────────────────────────────┘
```

## Teknolojiler

- **Vite** + **React 18** + **TypeScript**
- **@module-federation/vite** — runtime modül paylaşımı
- **concurrently** — iki dev server'ı paralel çalıştırma

## Kurulum

```bash
npm run setup
```

## Kullanım

```bash
npm run dev
```

- Shell (host): http://localhost:3000
- Products (remote): http://localhost:3001

## Nasıl Çalışıyor?

### 1. Remote kendini tanımlar

Products uygulaması `ProductList` componentini dışarıya açar:

```ts
// products/vite.config.ts
federation({
  name: "products",
  filename: "remoteEntry.js",
  exposes: {
    "./ProductList": "./src/components/ProductList.tsx",
  },
  shared: {
    react: { singleton: true },
    "react-dom": { singleton: true },
  },
});
```

### 2. Host remote'u tüketir

Shell uygulaması Products'ın `remoteEntry.js` dosyasını keşfeder:

```ts
// shell/vite.config.ts
federation({
  name: "shell",
  remotes: {
    products: {
      type: "module",
      name: "products",
      entry: "http://localhost:3001/remoteEntry.js",
    },
  },
  shared: {
    react: { singleton: true },
    "react-dom": { singleton: true },
  },
});
```

### 3. Lazy loading ile kullanım

Remote component, normal bir modülmüşçesine import edilir:

```tsx
// shell/src/App.tsx
const ProductList = React.lazy(() => import("products/ProductList"));

<ErrorBoundary>
  <Suspense fallback={<p>Loading remote ProductList...</p>}>
    <ProductList />
  </Suspense>
</ErrorBoundary>
```

### 4. Async boundary

`main.tsx` dosyasında dinamik import, shared dependency negotiation için gereklidir:

```ts
// shell/src/main.tsx
import("./bootstrap");
```

Bu satır Module Federation'ın React'in tek kopyasını (singleton) belirlemesi için zaman kazandırır.

## Proje Yapısı

```
module-federation-demo/
├── package.json              # Root — concurrently ile iki uygulamayı çalıştırır
├── shell/                    # Host uygulama (port 3000)
│   ├── vite.config.ts        # MF host konfigürasyonu
│   ├── src/
│   │   ├── main.tsx          # Async boundary (import("./bootstrap"))
│   │   ├── bootstrap.tsx     # React root render
│   │   └── App.tsx           # Layout + remote ProductList tüketimi
│   └── index.html
└── products/                 # Remote uygulama (port 3001)
    ├── vite.config.ts        # MF remote konfigürasyonu
    ├── src/
    │   ├── main.tsx          # Async boundary
    │   ├── bootstrap.tsx     # Standalone render
    │   └── components/
    │       └── ProductList.tsx  # Expose edilen component
    └── index.html
```

## Temel Kavramlar

| Kavram | Açıklama |
|--------|----------|
| **Host** | Remote modüllerden component tüketen uygulama |
| **Remote** | Modüllerini dışarıya açan uygulama |
| **remoteEntry.js** | Remote'un manifest dosyası — hangi modüllerin mevcut olduğunu bildirir |
| **Shared singleton** | React gibi kütüphanelerin tek kopya olarak paylaşımı |
| **Async boundary** | `import("./bootstrap")` — shared dependency negotiation için gerekli |

## Önemli Noktalar

- Products bağımsız deploy edildiğinde Shell'in yeniden build edilmesine **gerek yoktur**
- `singleton: true` sayesinde React'in tek kopyası kullanılır
- Remote erişilemezse ErrorBoundary devreye girer, uygulama patlamaz
- `.__mf__temp/` ve `@mf-types/` dizinleri otomatik oluşturulur, git'e eklenmez

## İlgili Yazı

Bu demo, [Module Federation vs. Single-SPA: Hangisi Ne Zaman Kullanılmalı?](https://zaferayan.com) makalesinin destekleyici projesidir.
