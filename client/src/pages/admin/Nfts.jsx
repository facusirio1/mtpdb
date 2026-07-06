import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';
import { shortAddr } from '../../lib.js';

export default function Nfts() {
  const [nfts, setNfts] = useState([]);
  const [health, setHealth] = useState(null);
  useEffect(() => {
    api.get('/nft').then(setNfts).catch(() => {});
    api.get('/nft/health').then(setHealth).catch(() => {});
  }, []);

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>NFTs en ETTIOS</h1><p className="muted">Registro on-chain de certificados minteados.</p></div></div>
        {health && (
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="row between">
              <div>
                <strong>ETTIOS Blockchain</strong>
                <p className="dim mt" style={{ fontSize: '.85rem' }}>Chain ID {health.chainId} · {health.rpc}</p>
              </div>
              <span className={`badge ${health.ok ? 'badge-good' : 'badge-risk'}`}>{health.ok ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>
        )}
        <div className="card">
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Token</th><th>Documento</th><th>Propietario</th><th>Tx</th><th>Block</th><th>Minted</th></tr></thead>
              <tbody>
                {nfts.map(n => (
                  <tr key={n._id}>
                    <td><span className="nft-pill">#{n.token_id}</span></td>
                    <td><strong>{n.document_id?.title || '—'}</strong></td>
                    <td>{n.user_id?.full_name}</td>
                    <td><code className="tx-hash" style={{ display: 'inline-block', fontSize: '.7rem' }}>{shortAddr(n.tx_hash)}</code></td>
                    <td className="dim">{n.block_number}</td>
                    <td className="dim" style={{ fontSize: '.78rem' }}>{new Date(n.minted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
