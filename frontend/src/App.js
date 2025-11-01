// src/App.js
import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import "./App.css";
import TaglineSection from "./TaglineSection";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function setQueryParam(name, value) {
  const params = new URLSearchParams(window.location.search);
  if (!value) params.delete(name);
  else params.set(name, value);
  const newSearch = params.toString();
  const newUrl = `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`;
  // pushState so page doesn't reload
  window.history.pushState({}, "", newUrl);
}

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(""); // controlled input value
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  // keep a ref to the debounce timer so we can clear it
  const debounceRef = useRef(null);

  // Auto-dismiss messages
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // run on mount: if ?q= exists use search, else fetch all
  useEffect(() => {
    const q = getQueryParam("q");
    if (q) {
      setFilter(q);
      handleSearch(q);
    } else {
      fetchProducts();
    }

    // handle browser back/forward: respond to popstate and re-run search/load
    const onPop = () => {
      const q2 = getQueryParam("q");
      setFilter(q2 || "");
      if (q2) handleSearch(q2);
      else fetchProducts();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line
  }, []);

  // sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (["id", "price", "quantity"].includes(sortField)) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, sortField, sortDirection]);

  // form handlers
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ id: "", name: "", description: "", price: "", quantity: "" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (editId) {
        await api.put(`/products/edit/${editId}`, {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("Product updated successfully");
      } else {
        await api.post("/products/add", {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("Product created successfully");
      }
      resetForm();
      await fetchProducts();
    } catch (err) {
      setError(err?.response?.data?.detail || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      quantity: p.quantity,
    });
    setEditId(p.id);
    setMessage("");
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      // ensure backend delete route matches: either /products/delete/:id or /products/:id
      await api.delete(`/products/delete/${id}`);
      setMessage("Product deleted successfully");
      await fetchProducts();
    } catch (err) {
      setError("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // search: called directly by debounce timer or on mount
  const handleSearch = async (value) => {
    if (!String(value || "").trim()) {
      await fetchProducts();
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/products/search?q=${encodeURIComponent(value)}`);
      setProducts(res.data);
      setError("");
    } catch (err) {
      if (err?.response?.status === 404) {
        setProducts([]); // no match
      } else {
        setError("Search failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounce input typing. Update URL with pushState.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const v = filter.trim();
      if (v) {
        setQueryParam("q", v); // updates URL
        handleSearch(v);
      } else {
        setQueryParam("q", ""); // removes q
        fetchProducts();
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line
  }, [filter]);

  const currency = (n) => (typeof n === "number" ? n.toFixed(2) : Number(n || 0).toFixed(2));

  return (
    <div className="app-bg">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">📦</span>
          <h1>Products List</h1>
        </div>
        <div className="top-actions">
          <button className="btn btn-light" onClick={fetchProducts} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      <div className="container">
        <div className="stats">
          <div className="chip">Total: {products.length}</div>
          <div className="search">
            <span role="img" aria-label="search">🔍</span>
            <input
              type="text"
              placeholder="Search by id, name or description..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="content-grid">
          <div className="card form-card">
            <h2>{editId ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit} className="product-form">
              <input
                type="number"
                name="id"
                placeholder="ID"
                value={form.id}
                onChange={handleChange}
                required
                disabled={!!editId}
              />
              <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
              <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
              <input type="number" name="price" placeholder="Price" step="0.01" value={form.price} onChange={handleChange} required />
              <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} required />
              <div className="form-actions">
                <button className="btn" type="submit" disabled={loading}>{editId ? "Update" : "Add"}</button>
                {editId && <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button>}
              </div>
            </form>
            {message && <div className="success-msg">{message}</div>}
            {error && <div className="error-msg">{error}</div>}
          </div>

          <TaglineSection />

          <div className="card list-card">
            <h2>Products</h2>
            {loading ? (
              <div className="loader">Loading...</div>
            ) : (
              <div className="scroll-x">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th className={`sortable ${sortField === "id" ? `sort-${sortDirection}` : ""}`} onClick={() => handleSort("id")}>ID</th>
                      <th className={`sortable ${sortField === "name" ? `sort-${sortDirection}` : ""}`} onClick={() => handleSort("name")}>Name</th>
                      <th>Description</th>
                      <th className={`sortable ${sortField === "price" ? `sort-${sortDirection}` : ""}`} onClick={() => handleSort("price")}>Price</th>
                      <th className={`sortable ${sortField === "quantity" ? `sort-${sortDirection}` : ""}`} onClick={() => handleSort("quantity")}>Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.name}</td>
                          <td title={p.description}>{p.description}</td>
                          <td className="price-cell">${currency(p.price)}</td>
                          <td><span className="qty-badge">{p.quantity}</span></td>
                          <td>
                            <div className="row-actions">
                              <button className="btn btn-edit" onClick={() => handleEdit(p)}>Edit</button>
                              <button className="btn btn-delete" onClick={() => handleDelete(p.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="empty">No products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
