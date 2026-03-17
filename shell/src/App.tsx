import React, { Suspense } from "react";

const ProductList = React.lazy(() => import("products/ProductList"));

function ErrorFallback() {
  return (
    <div style={{ padding: 20, border: "1px solid #e53e3e", borderRadius: 4, background: "#fff5f5", color: "#c53030" }}>
      <strong>Remote unavailable.</strong> Make sure the Products app is running on port 3001.
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <header style={{ borderBottom: "2px solid #333", paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Shell (Host App)</h1>
        <p style={{ margin: "4px 0 0", color: "#666" }}>
          Module Federation with Vite -- consuming remote ProductList
        </p>
      </header>

      <main>
        <h2>Products from Remote</h2>
        <ErrorBoundary>
          <Suspense fallback={<p>Loading remote ProductList...</p>}>
            <ProductList />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
