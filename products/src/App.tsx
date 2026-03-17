import ProductList from "./components/ProductList";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <header style={{ borderBottom: "2px solid #333", paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Products (Remote App)</h1>
        <p style={{ margin: "4px 0 0", color: "#666" }}>
          This app runs standalone and also exposes ProductList via Module Federation
        </p>
      </header>
      <ProductList />
    </div>
  );
}
