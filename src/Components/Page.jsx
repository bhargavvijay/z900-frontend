// src/AccessoriesManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://z900-backend.onrender.com",
  headers: { "Content-Type": "application/json" },
});

export default function AccessoriesManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", link: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ---- Load all
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/accessories");            // GET /accessories
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Failed to load accessories");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Helpers
  const currency = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })
      .format(Number.isFinite(+n) ? +n : 0);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.price || 0), 0),
    [items]
  );

  const s = {
    wrap: { maxWidth: 820, margin: "24px auto", padding: 16, border: "1px solid #ddd", borderRadius: 8 },
    row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
    input: { padding: 8, border: "1px solid #bbb", borderRadius: 6, minWidth: 140, flex: "1 1 160px" },
    btn: { padding: "8px 14px", border: "1px solid #333", borderRadius: 6, background: "#fff", cursor: "pointer" },
    btnPrimary: { padding: "8px 14px", border: "1px solid #0a7", borderRadius: 6, background: "#0a7", color: "#fff", cursor: "pointer" },
    table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
    thtd: { borderBottom: "1px solid #eee", padding: "10px 8px", textAlign: "left" },
    small: { fontSize: 12, color: "#666" },
    link: { color: "#06c", textDecoration: "underline" },
    danger: { color: "crimson", fontSize: 12 },
  };

  // ---- Form helpers
  function resetForm() {
    setForm({ name: "", price: "", link: "" });
    setEditingId(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate({ name, price, link }) {
    if (!name.trim()) return "Accessory name is required.";
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return "Price must be a positive number.";
    if (link.trim() && !/^https?:\/\/.+/.test(link.trim()))
      return "Link must start with http:// or https://";
    return null;
  }

  // ---- Create / Update
  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    if (v) return alert(v);

    const body = {
      name: form.name.trim(),
      price: Number(form.price),
      link: form.link.trim(),
    };

    try {
      setSaving(true);
      if (editingId) {
        // PUT /accessories  (id in body)
        const { data: updated } = await api.put("/accessories", { id: editingId, ...body });
        setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
      } else {
        // POST /accessories
        const { data: created } = await api.post("/accessories", body);
        setItems((prev) => [...prev, created]);
      }
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ---- Editing
  function startEdit(it) {
    setEditingId(it.id);
    setForm({ name: it.name ?? "", price: String(it.price ?? ""), link: it.link ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---- Delete
  async function removeItem(id) {
    if (!confirm("Delete this accessory?")) return;
    try {
      await api.delete(`/accessories/${id}`); // DELETE /accessories/{id}
      setItems((prev) => prev.filter((it) => it.id !== id));
      if (editingId === id) resetForm();
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  }

  return (
    <div style={s.wrap}>
      <h2>Bike Accessories</h2>

      <form onSubmit={handleSubmit} style={{ ...s.row, marginBottom: 12 }}>
        <input
          style={s.input}
          name="name"
          placeholder="Accessory"
          value={form.name}
          onChange={handleChange}
          disabled={saving}
        />
        <input
          style={s.input}
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price (₹)"
          value={form.price}
          onChange={handleChange}
          disabled={saving}
        />
        <input
          style={s.input}
          name="link"
          placeholder="Link (optional)"
          value={form.link}
          onChange={handleChange}
          disabled={saving}
        />
        <button type="submit" style={s.btnPrimary} disabled={saving}>
          {editingId ? (saving ? "Updating…" : "Update") : (saving ? "Adding…" : "Add")}
        </button>
        {editingId && (
          <button type="button" style={s.btn} onClick={resetForm} disabled={saving}>
            Cancel
          </button>
        )}
      </form>

      {loading && <p style={s.small}>Loading…</p>}
      {err && <p style={s.danger}>{err}</p>}

      {!loading && items.length === 0 ? (
        <p style={s.small}>No accessories added yet.</p>
      ) : (
        <>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.thtd}>Accessory</th>
                <th style={s.thtd}>Price</th>
                <th style={s.thtd}>Link</th>
                <th style={s.thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={s.thtd}>{it.name}</td>
                  <td style={s.thtd}>{currency(it.price)}</td>
                  <td style={s.thtd}>
                    {it.link ? (
                      <a href={it.link} target="_blank" rel="noopener noreferrer" style={s.link}>
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={s.thtd}>
                    <button style={s.btn} onClick={() => startEdit(it)} disabled={saving}>Edit</button>{" "}
                    <button style={s.btn} onClick={() => removeItem(it.id)} disabled={saving}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <div> Total: <strong>{currency(subtotal)}</strong> </div>
          </div>
        </>
      )}
    </div>
  );
}
