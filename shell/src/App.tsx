import React, { Suspense } from "react";

const ProductList = React.lazy(() => import("products/ProductList"));

function ErrorFallback() {
  return (
    <div style={{ padding: 20, border: "1px solid #e53e3e", borderRadius: 8, background: "#2d1215", color: "#fc8181" }}>
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
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ borderBottom: "1px solid #2a2a2a", paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#f0f0f0" }}>Shell (Host App)</h1>
        <p style={{ margin: "4px 0 0", color: "#888" }}>
          Module Federation with Vite -- consuming remote ProductList
        </p>
      </header>

      <main>
        <h2 style={{ color: "#f0f0f0" }}>Products from Remote</h2>
        <ErrorBoundary>
          <Suspense fallback={<p>Loading remote ProductList...</p>}>
            <ProductList />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
