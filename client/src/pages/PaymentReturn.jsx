import { Link } from 'react-router-dom';

export function PaymentSuccess() {
  return (
    <div className="auth-wrap">
      <div className="auth-box" style={{ maxWidth: 460, textAlign: 'center' }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12, color: 'var(--green-500)' }}>✓</div>
        <h2 style={{ fontSize: '1.8rem' }}>¡Pago exitoso!</h2>
        <p className="muted mt">Tu pago se procesó correctamente. En unos segundos el sistema actualizará tu cuenta.</p>
        <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 24 }}>
          <Link to="/u" className="btn btn-primary">Mi panel</Link>
          <Link to="/u/documents" className="btn btn-ghost">Mis documentos</Link>
        </div>
      </div>
    </div>
  );
}

export function PaymentFailure() {
  return (
    <div className="auth-wrap">
      <div className="auth-box" style={{ maxWidth: 460, textAlign: 'center' }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12, color: 'var(--red-500)' }}>✕</div>
        <h2 style={{ fontSize: '1.8rem' }}>El pago no se completó</h2>
        <p className="muted mt">El banco rechazó la operación o la cancelaste. No se realizó ningún cobro.</p>
        <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 24 }}>
          <Link to="/checkout" className="btn btn-primary">Reintentar</Link>
          <Link to="/" className="btn btn-ghost">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
