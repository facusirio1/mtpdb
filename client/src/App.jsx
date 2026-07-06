import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import Verify from './pages/Verify.jsx';
import Checkout from './pages/Checkout.jsx';
import { PaymentSuccess, PaymentFailure } from './pages/PaymentReturn.jsx';

import UDashboard      from './pages/usuario/Dashboard.jsx';
import UDocuments      from './pages/usuario/Documents.jsx';
import UUpload         from './pages/usuario/Upload.jsx';
import UDocumentDetail from './pages/usuario/DocumentDetail.jsx';
import UReputation     from './pages/usuario/Reputation.jsx';
import UKYC            from './pages/usuario/KYC.jsx';

import VDashboard from './pages/verificador/Dashboard.jsx';
import VQueue     from './pages/verificador/Queue.jsx';
import VHistory   from './pages/verificador/History.jsx';

import ADashboard    from './pages/admin/Dashboard.jsx';
import AUsers        from './pages/admin/Users.jsx';
import ADocuments    from './pages/admin/Documents.jsx';
import AScoring      from './pages/admin/Scoring.jsx';
import ATraceability from './pages/admin/Traceability.jsx';
import ANfts         from './pages/admin/Nfts.jsx';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-wrap"><p className="muted">Cargando…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role === 'admin' ? 'admin' : user.role === 'verificador' ? 'verificador' : 'u'}`} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* públicas */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/verify/:id" element={<Verify />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/payments/success" element={<PaymentSuccess />} />
      <Route path="/payments/failure" element={<PaymentFailure />} />

      {/* usuario */}
      <Route path="/u" element={<Protected roles={['usuario','admin']}><UDashboard /></Protected>} />
      <Route path="/u/documents" element={<Protected roles={['usuario','admin']}><UDocuments /></Protected>} />
      <Route path="/u/upload" element={<Protected roles={['usuario','admin']}><UUpload /></Protected>} />
      <Route path="/u/documents/:id" element={<Protected roles={['usuario','admin']}><UDocumentDetail /></Protected>} />
      <Route path="/u/reputation" element={<Protected roles={['usuario','admin']}><UReputation /></Protected>} />
      <Route path="/u/kyc" element={<Protected roles={['usuario','admin']}><UKYC /></Protected>} />

      {/* verificador */}
      <Route path="/verificador" element={<Protected roles={['verificador','admin']}><VDashboard /></Protected>} />
      <Route path="/verificador/queue" element={<Protected roles={['verificador','admin']}><VQueue /></Protected>} />
      <Route path="/verificador/history" element={<Protected roles={['verificador','admin']}><VHistory /></Protected>} />

      {/* admin */}
      <Route path="/admin" element={<Protected roles={['admin']}><ADashboard /></Protected>} />
      <Route path="/admin/users" element={<Protected roles={['admin']}><AUsers /></Protected>} />
      <Route path="/admin/documents" element={<Protected roles={['admin']}><ADocuments /></Protected>} />
      <Route path="/admin/scoring" element={<Protected roles={['admin']}><AScoring /></Protected>} />
      <Route path="/admin/traceability" element={<Protected roles={['admin']}><ATraceability /></Protected>} />
      <Route path="/admin/nfts" element={<Protected roles={['admin']}><ANfts /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
