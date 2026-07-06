// MTP PLATFORM — Constantes compartidas (mismas en frontend y backend)
export const MEMBERSHIPS = {
  basica:       { label: 'Básica',       price: 0,    color: 'neutral' },
  profesional:  { label: 'Profesional',  price: 2900, color: 'info'    },
  premium:      { label: 'Premium',      price: 7900, color: 'gold'    },
};

export const ROLES = {
  admin:        { label: 'Administrador', home: '/admin' },
  usuario:      { label: 'Usuario',       home: '/u' },
  verificador:  { label: 'Verificador',   home: '/verificador' },
};

export const CERT_TYPES = {
  cte:  { label: 'CTE — Trazabilidad Económica',  color: 'cyan' },
  ctpi: { label: 'CTPI — Procesos Inteligentes',  color: 'violet' },
  cen:  { label: 'CEN — Escritural Notarial',     color: 'cyan' },
  ctk:  { label: 'CTK — Tokenización',            color: 'gold' },
  contrato: { label: 'Contrato',  color: 'cyan' },
  balance:  { label: 'Balance',   color: 'cyan' },
  otro:     { label: 'Otro',      color: 'neutral' },
};

export function fmt(amountCents) {
  return `${(amountCents / 100).toFixed(2)} €`;
}

export function shortAddr(addr) {
  if (!addr) return '—';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}
