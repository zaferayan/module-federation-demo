import ProductList from "./components/ProductList";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ borderBottom: "1px solid #2a2a2a", paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#f0f0f0" }}>Products (Remote App)</h1>
        <p style={{ margin: "4px 0 0", color: "#888" }}>
          This app runs standalone and also exposes ProductList via Module Federation
        </p>
      </header>
      <ProductList />
    </div>
  );
}
