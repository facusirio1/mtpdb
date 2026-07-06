import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function Upload() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [doc_type, setType] = useState('cte');
  const [description, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('doc_type', doc_type);
      fd.append('description', description);
      fd.append('file', file);
      const doc = await api.upload('/documents', fd);
      nav(`/u/documents/${doc._id}`);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Subir nuevo documento</h1><p className="muted">El motor IA va a clasificarlo y un verificador lo va a revisar.</p></div></div>
        <div className="card" style={{ maxWidth: 720 }}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>Título *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Contrato de fideicomiso Torre Norte" />
            </div>
            <div className="field">
              <label>Tipo de documento *</label>
              <select value={doc_type} onChange={e => setType(e.target.value)}>
                <option value="cte">CTE — Trazabilidad Económica</option>
                <option value="ctpi">CTPI — Procesos Inteligentes</option>
                <option value="cen">CEN — Escritural Notarial</option>
                <option value="ctk">CTK — Tokenización</option>
                <option value="contrato">Contrato</option>
                <option value="balance">Balance contable</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="field">
              <label>Descripción</label>
              <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Contexto y objetivos del documento…" />
            </div>
            <div className="field">
              <label>Archivo * (PDF, Word, Excel, imagen — máx 8 MB)</label>
              <input type="file" required onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.json" />
            </div>
            <button className="btn btn-primary" disabled={loading || !file}>
              {loading ? 'Subiendo…' : 'Subir y analizar con IA →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
