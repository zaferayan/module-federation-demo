const products = [
  { id: 1, name: "Wireless Headphones", price: 79.99 },
  { id: 2, name: "Mechanical Keyboard", price: 129.99 },
  { id: 3, name: "USB-C Hub", price: 49.99 },
  { id: 4, name: "Webcam HD", price: 69.99 },
];

export default function ProductList() {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {products.map((p) => (
        <li
          key={p.id}
          style={{
            padding: "12px 16px",
            marginBottom: 8,
            border: "1px solid #ddd",
            borderRadius: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{p.name}</span>
          <strong>${p.price.toFixed(2)}</strong>
        </li>
      ))}
    </ul>
  );
}
