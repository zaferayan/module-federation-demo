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

## Kullanim

```bash
npm run dev
```

- Shell (host): http://localhost:3000
- Products (remote): http://localhost:3001

## Nasil Calisiyor?

### 1. Remote kendini tanimlar

Products uygulamasi `ProductList` componentini disariya acar:

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

### 2. Host remote'u tuketir

Shell uygulamasi Products'in `remoteEntry.js` dosyasini kesfeder:

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

### 3. Lazy loading ile kullanim

Remote component, normal bir modulmuscesine import edilir:

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

`main.tsx` dosyasinda dinamik import, shared dependency negotiation icin gereklidir:

```ts
// shell/src/main.tsx
import("./bootstrap");
```

Bu satir Module Federation'in React'in tek kopyasini (singleton) belirlemesi icin zaman kazandirir.

## Proje Yapisi

```
module-federation-demo/
├── package.json              # Root — concurrently ile iki uygulamayi calistirir
├── shell/                    # Host uygulama (port 3000)
│   ├── vite.config.ts        # MF host konfigurasyonu
│   ├── src/
│   │   ├── main.tsx          # Async boundary (import("./bootstrap"))
│   │   ├── bootstrap.tsx     # React root render
│   │   └── App.tsx           # Layout + remote ProductList tuketimi
│   └── index.html
└── products/                 # Remote uygulama (port 3001)
    ├── vite.config.ts        # MF remote konfigurasyonu
    ├── src/
    │   ├── main.tsx          # Async boundary
    │   ├── bootstrap.tsx     # Standalone render
    │   └── components/
    │       └── ProductList.tsx  # Expose edilen component
    └── index.html
```

## Temel Kavramlar

| Kavram | Aciklama |
|--------|----------|
| **Host** | Remote modullerden component tuketen uygulama |
| **Remote** | Modullerini disariya acan uygulama |
| **remoteEntry.js** | Remote'un manifest dosyasi — hangi modullerin mevcut oldugunu bildirir |
| **Shared singleton** | React gibi kutuphanelerin tek kopya olarak paylasimi |
| **Async boundary** | `import("./bootstrap")` — shared dependency negotiation icin gerekli |

## Onemli Noktalar

- Products bagimsiz deploy edildiginde Shell'in yeniden build edilmesine **gerek yoktur**
- `singleton: true` sayesinde React'in tek kopyasi kullanilir
- Remote erisilemezse ErrorBoundary devreye girer, uygulama patlamaz
- `.__mf__temp/` ve `@mf-types/` dizinleri otomatik olusturulur, git'e eklenmez

## Ilgili Yazi

Bu demo, [Module Federation vs. Single-SPA: Hangisi Ne Zaman Kullanilmali?](https://zaferayan.com) makalesinin destekleyici projesidir.
