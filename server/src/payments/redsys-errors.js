/**
 * MTP PLATFORM — Catálogo de códigos de error de Redsys / CaixaBank Cyberpac.
 *
 * Fuentes oficiales:
 *  - Guía de integración del Cyberpac (Comercia Global Payments / CaixaBank, 2024)
 *  - Documentación pública de Redsys https://pagosonline.redsys.es/codigos-respuesta.html
 *
 * Se usa para traducir códigos crípticos como "SIS0042" en mensajes
 * comprensibles para el usuario final, y como referencia para el comercio.
 */

// ─── Errores SIS00xx — fallas de integración / configuración ──────
export const SIS_ERRORS = {
  '0007': {
    title: 'Error al desmontar el XML/JSON de entrada',
    cause: 'El sistema no pudo decodificar los parámetros enviados al TPV.',
    fix:   'Revisá que el JSON no contenga caracteres especiales (%), y que esté correctamente codificado en Base64.',
    devNote: 'Suele pasar si el nombre del producto o del comercio incluye % o caracteres no-ASCII sin escapar.',
  },
  '0022': {
    title: 'Formato inválido en Ds_Merchant_TransactionType',
    cause: 'El campo TransactionType viene vacío o con valor no permitido.',
    fix:   'Debe enviarse "0" (autorización estándar) en formato string de 3 dígitos: "000" o "0".',
  },
  '0023': {
    title: 'Formato inválido en Ds_Merchant_TransactionType',
    cause: 'Mismo motivo que SIS0022.',
    fix:   'Verificá el campo TransactionType.',
  },
  '0026': {
    title: 'Comercio o terminal no encontrado',
    cause: 'El n.º de terminal no existe para ese FUC en el entorno indicado (test o producción).',
    fix:   'Revisá MERCHANT_CODE + TERMINAL + ENVIRONMENT en el .env. Si nunca solicitaste el pase a producción, las operaciones van al entorno test.',
    contact: 'Para activar producción: virtualtpv@comerciaglobalpay.com',
  },
  '0027': {
    title: 'La moneda enviada no es la moneda configurada',
    cause: 'El campo Ds_Merchant_Currency no coincide con la divisa del terminal.',
    fix:   'Verificá que REDSYS_CURRENCY=978 (euros) coincida con el alta del terminal.',
  },
  '0028': {
    title: 'Comercio / terminal dado de baja',
    cause: 'El terminal indicado está desactivado en Redsys.',
    fix:   'Consultá el estado del terminal en https://canales.redsys.es. Si está de baja, contactá CaixaBank.',
  },
  '0034': {
    title: 'Error en la base de datos',
    cause: 'Fallo interno en los servidores de Redsys.',
    fix:   'Reintentá en unos minutos. Si persiste, contactá soporte de Comercia Global Payments.',
  },
  '0042': {
    title: 'La firma enviada no es correcta',
    cause: 'La firma HMAC-SHA256 no coincide con la esperada por Redsys.',
    fix:   'Verificá: (1) que REDSYS_SECRET_KEY corresponda al entorno (test vs producción), (2) que el orderId usado para firmar sea EXACTAMENTE el mismo del payload.',
    devNote: 'Error #1 más común. Siempre revisar la clave del entorno.',
  },
  '0043': {
    title: 'No se ha podido realizar la operación porque se ha detectado una situación de fraude',
    cause: 'Sistema antifraude de Redsys rechazó la tx.',
    fix:   'Reintentá con otra tarjeta o contactá tu emisor.',
  },
  '0044': {
    title: 'Tipo de moneda no soportada',
    cause: 'La moneda no está habilitada para el comercio.',
    fix:   'Habilitar la moneda en el alta del terminal o usar 978 (EUR).',
  },
  '0051': {
    title: 'Número de pedido repetido',
    cause: 'Ya existe una operación procesada con ese Ds_Merchant_Order.',
    fix:   'Generá un orderId único en cada pago. Por defecto el sistema usa timestamp + random hex.',
  },
  '0052': {
    title: 'N.º de pedido duplicado',
    cause: 'Mismo motivo que SIS0051.',
    fix:   'Por seguridad, Redsys rechaza pedidos repetidos. Si tu negocio necesita aceptarlos, solicitalo a Comercia Global Payments por mail.',
  },
  '0054': {
    title: 'No existe operación sobre la que realizar la devolución',
    cause: 'Intento de devolución sobre una operación inexistente o no autorizada.',
    fix:   'Verificá el orderId original antes de pedir devolución.',
  },
  '0056': {
    title: 'La operación sobre la que se desea devolver no está autorizada',
    cause: 'La operación original está pendiente, denegada o cancelada.',
    fix:   'Solo se puede devolver operaciones con resultado "aprobado".',
  },
  '0057': {
    title: 'El importe de la devolución supera al importe de la operación original',
    cause: 'Se está intentando reembolsar más de lo cobrado.',
    fix:   'El monto de devolución debe ser ≤ al importe original (puede ser parcial).',
  },
  '0058': {
    title: 'El comercio no es válido (no autorizado para devoluciones)',
    cause: 'El terminal no tiene habilitada la operativa de devolución.',
    fix:   'Solicitá habilitar devoluciones a Comercia Global Payments.',
  },
  '0075': {
    title: 'Ds_Merchant_Order con menos de 4 caracteres',
    cause: 'El orderId enviado no cumple el mínimo de 4 dígitos.',
    fix:   'Generá orderId entre 4 y 12 caracteres, los primeros 4 numéricos.',
  },
  '0076': {
    title: 'Ds_Merchant_Order con más de 12 caracteres',
    cause: 'El orderId excede el máximo permitido.',
    fix:   'Generá orderId entre 4 y 12 caracteres. Para algunas operativas el límite es 10.',
  },
  '0077': {
    title: 'Caracteres inválidos en Ds_Merchant_Order',
    cause: 'El orderId contiene caracteres no permitidos.',
    fix:   'Solo se permite [A-Z], [a-z] y [0-9]. Sin espacios ni guiones.',
  },
  '0093': {
    title: 'Denegación general (sin más información)',
    cause: 'El banco emisor rechazó la operación.',
    fix:   'El cliente debe intentar con otra tarjeta o contactar su banco.',
  },
  '0184': {
    title: 'Error en la autenticación del titular',
    cause: 'Falló el 3D Secure (no se completó el SMS o el challenge).',
    fix:   'Reintentá. Si persiste, otra tarjeta.',
  },
  '0190': {
    title: 'Denegación sin especificar motivo',
    cause: 'Decisión del emisor de la tarjeta.',
    fix:   'Intentá con otra tarjeta o contactá tu banco.',
  },
  '0191': {
    title: 'Fecha de caducidad errónea',
    cause: 'La fecha vence/caducidad de la tarjeta no es válida.',
    fix:   'Revisá los datos ingresados.',
  },
  '0202': {
    title: 'Tarjeta bloqueada o retenida',
    cause: 'El emisor bloqueó la tarjeta.',
    fix:   'El cliente debe contactar su banco.',
  },
  '0431': {
    title: 'Error en el objeto JSON enviado en Ds_MerchantParameters',
    cause: 'El JSON contiene caracteres especiales (%) que rompen el Base64.',
    fix:   'Sanear el % y otros caracteres especiales antes de codificar. El sistema MTP lo hace automáticamente.',
  },
  '9001': {
    title: 'Error genérico de validación',
    cause: 'Alguno de los campos enviados no cumple el formato esperado.',
    fix:   'Revisá la guía de integración. Suele ser FUC, terminal, importe o currency mal formateados.',
  },
  '9915': {
    title: 'El usuario canceló la operación',
    cause: 'El cliente cerró la ventana del TPV antes de pagar.',
    fix:   'Comportamiento normal — la orden queda en estado "Sin finalizar".',
  },
  '9928': {
    title: 'Sesión expirada (más de 30 minutos sin completar)',
    cause: 'El cliente tardó demasiado en la pasarela.',
    fix:   'Comportamiento normal — generar nuevo orderId si quiere reintentar.',
  },
  '9929': {
    title: 'Anulación realizada por el cliente',
    cause: 'El cliente eligió cancelar.',
    fix:   'Comportamiento normal.',
  },
};

// ─── Códigos HTTP que Redsys puede devolver al webhook de notificación ──────
export const HTTP_NOTIFY_ERRORS = {
  403: {
    title: 'URL de notificación con acceso prohibido',
    cause: 'La URL del webhook (REDSYS_NOTIFICATION_URL) tiene restricciones de acceso (firewall, modo mantenimiento, etc.)',
    fix:   'Permitir las IPs oficiales de Redsys en tu firewall: 193.16.243.33, 193.16.243.13, 193.16.243.173, 194.224.159.47, 194.224.159.57, 195.76.9.187, 195.76.9.222, 195.76.9.117, 195.76.9.149',
  },
  404: {
    title: 'URL de notificación no encontrada',
    cause: 'La URL del webhook no existe.',
    fix:   'Verificá que REDSYS_NOTIFICATION_URL apunte a /api/payments/notify de tu backend en producción.',
  },
  500: {
    title: 'Error interno en el servidor del comercio',
    cause: 'El webhook tiró excepción al procesar la notificación.',
    fix:   'Revisá los logs del backend en Render/Railway. Suele ser un error de DB o de validación de firma.',
  },
};

/**
 * Devuelve info estructurada sobre un código SIS o HTTP.
 * @param {string|number} code  ej "SIS0042", "0042", "42", 403
 * @returns {Object|null} { code, title, cause, fix } o null si no se reconoce
 */
export function lookupRedsysError(code) {
  if (code === null || code === undefined) return null;

  // HTTP error
  const httpNum = Number(code);
  if (HTTP_NOTIFY_ERRORS[httpNum]) {
    return { code: `HTTP ${httpNum}`, ...HTTP_NOTIFY_ERRORS[httpNum] };
  }

  // SIS error
  const sisMatch = String(code).match(/^(?:SIS)?0*(\d+)$/i);
  if (sisMatch) {
    const padded = sisMatch[1].padStart(4, '0');
    if (SIS_ERRORS[padded]) {
      return { code: `SIS${padded}`, ...SIS_ERRORS[padded] };
    }
  }

  return null;
}

/**
 * Para mostrar el motivo de una operación denegada al usuario final.
 * Si el código no está catalogado, devuelve un mensaje genérico.
 */
export function friendlyDeniedReason(responseCode) {
  const num = Number(responseCode);
  if (num < 100) return 'Operación aprobada';
  if (num === 900) return 'Devolución/preautorización confirmada';

  const info = lookupRedsysError(num);
  if (info) return info.title;

  if (num >= 100 && num < 200) return 'Denegada por el banco emisor';
  if (num >= 9000) return 'Error de configuración del comercio';
  return `Operación denegada (código ${responseCode})`;
}
