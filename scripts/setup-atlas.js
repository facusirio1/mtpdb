#!/usr/bin/env node
/**
 * MTP PLATFORM — Setup de MongoDB Atlas
 *
 * Pide la contraseña de Atlas por consola (sin echo en pantalla),
 * valida la conexión, y escribe server/.env con la connection string completa.
 *
 * El password NUNCA se loguea ni se guarda en ningún archivo trackeado por Git.
 * Solo va en server/.env, que está en .gitignore.
 *
 * Uso:
 *   node scripts/setup-atlas.js
 *
 * Opcional — saltar el prompt pasando la clave por env var:
 *   MONGO_ATLAS_PASSWORD=... node scripts/setup-atlas.js
 */

import { createInterface } from 'node:readline';
import { stdin, stdout, exit } from 'node:process';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_PATH = resolve(ROOT, 'server', '.env');
const ENV_EXAMPLE = resolve(ROOT, 'server', '.env.example');

// ─── Configuración de Atlas (host del cluster, usuario) ─────────
const ATLAS_USER = 'pablorutigliano1973_db_user';
const ATLAS_HOST = 'cluster1.tesodf.mongodb.net';
const ATLAS_DB   = 'pablorutigliano1973_db_user';
const APP_NAME = 'Cluster1';

// ─── Helpers ────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m',
};

function log(msg) { console.log(msg); }
function ok(msg)   { console.log(`${c.green}✓${c.reset} ${msg}`); }
function warn(msg) { console.log(`${c.yellow}⚠${c.reset} ${msg}`); }
function fail(msg) { console.error(`${c.red}✗${c.reset} ${msg}`); }
function header(msg) { console.log(`\n${c.bold}${c.cyan}${msg}${c.reset}`); }

/**
 * Pide input por consola SIN mostrar lo que el usuario escribe.
 * Usa el truco de poner stdin en raw mode y reemplazar la salida con *.
 */
function promptPassword(question) {
  return new Promise((resolveP) => {
    const rl = createInterface({ input: stdin, output: stdout });
    stdout.write(question);

    // Modo invisible: intercepta cada tecla y muestra '*' en su lugar
    const origWrite = stdout.write.bind(stdout);
    rl._writeToOutput = (str) => {
      if (str === question) return origWrite(str);
      origWrite('*'.repeat(str.length));
    };

    rl.question('', (answer) => {
      rl.close();
      stdout.write('\n');
      resolveP(answer.trim());
    });
  });
}

function prompt(question) {
  return new Promise((resolveP) => {
    const rl = createInterface({ input: stdin, output: stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolveP(answer.trim());
    });
  });
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  header('🍃  MTP Platform — Setup de MongoDB Atlas');
  log(`${c.dim}Cluster: ${ATLAS_HOST}${c.reset}`);
  log(`${c.dim}Usuario: ${ATLAS_USER}${c.reset}`);
  log(`${c.dim}DB:      ${ATLAS_DB}${c.reset}`);
  log('');

  // ─── 1. Verificar pre-requisitos ──────────────────────────────
  if (!existsSync(ENV_EXAMPLE)) {
    fail(`No encuentro ${ENV_EXAMPLE}`);
    fail('Asegurate de correr este script desde la raíz del proyecto.');
    exit(1);
  }

  // ─── 2. Si ya existe .env, preguntar antes de sobrescribir ───
  if (existsSync(ENV_PATH)) {
    warn(`Ya existe ${ENV_PATH}`);
    const answer = await prompt(`${c.yellow}¿Sobrescribir? (s/N): ${c.reset}`);
    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
      log('Cancelado.');
      exit(0);
    }
  }

  // ─── 3. Obtener password — env var o prompt ──────────────────
  let password = process.env.MONGO_ATLAS_PASSWORD;
  if (!password) {
    log(`${c.dim}La contraseña no se mostrará al escribirla.${c.reset}`);
    password = await promptPassword(`${c.bold}Password de Atlas: ${c.reset}`);
  } else {
    log(`${c.dim}Password tomada de MONGO_ATLAS_PASSWORD${c.reset}`);
  }

  if (!password) {
    fail('Password vacía. Abortando.');
    exit(1);
  }

  // Validación básica del formato
  if (password.length < 8) {
    warn('La password parece corta (<8 chars). Verificá que sea la correcta.');
    const cont = await prompt(`${c.yellow}¿Continuar igual? (s/N): ${c.reset}`);
    if (cont.toLowerCase() !== 's') exit(0);
  }

  // ─── 4. URL-encode la password (Atlas lo requiere si tiene chars especiales) ─
  const encodedPassword = encodeURIComponent(password);
  const mongoUri = `mongodb+srv://${ATLAS_USER}:${encodedPassword}@${ATLAS_HOST}/${ATLAS_DB}?retryWrites=true&w=majority&appName=${APP_NAME}`;

  // ─── 5. Test de conexión ──────────────────────────────────────
  header('▶ Testing conexión a Atlas…');
  let mongoose;
  try {
    mongoose = (await import('mongoose')).default;
  } catch {
    fail('No encuentro `mongoose`. Corré primero: cd server && npm install');
    exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    ok(`Conectado a ${ATLAS_HOST}`);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    log(`${c.dim}  Base de datos: ${db.databaseName}${c.reset}`);
    log(`${c.dim}  Colecciones existentes: ${collections.length}${c.reset}`);
    if (collections.length > 0) {
      collections.forEach(col => log(`${c.dim}    • ${col.name}${c.reset}`));
    } else {
      log(`${c.dim}  (DB vacía — vas a poder cargar el seed después)${c.reset}`);
    }
    await mongoose.disconnect();
  } catch (e) {
    fail(`Falló la conexión: ${e.message}`);
    log('');
    log(`${c.yellow}Posibles causas:${c.reset}`);
    log(`  • Password incorrecta`);
    log(`  • Tu IP no está en la whitelist de Atlas`);
    log(`    → ir a Atlas → Network Access → Add IP Address`);
    log(`    → "Add Current IP Address" o "0.0.0.0/0" (cualquier IP)`);
    log(`  • El usuario "${ATLAS_USER}" no existe o no tiene permisos`);
    log(`    → ir a Atlas → Database Access → verificar el usuario`);
    exit(1);
  }

  // ─── 6. Escribir .env ────────────────────────────────────────
  header('▶ Generando server/.env…');

  // Tomamos como base .env.example y reemplazamos la línea de MONGO_URI
  let envContent = readFileSync(ENV_EXAMPLE, 'utf8');

  // Comentamos el MONGO_URI local
  envContent = envContent.replace(
    /^MONGO_URI=mongodb:\/\/127\.0\.0\.1.*$/m,
    '# MONGO_URI=mongodb://127.0.0.1:27017/pablorutigliano1973_db_user   # ← local (desactivado)'
  );

  // Activamos el MONGO_URI de Atlas con la password real
  const atlasLine = `MONGO_URI=${mongoUri}`;
  if (envContent.match(/^# MONGO_URI=mongodb\+srv:\/\/pablorutigliano1973_db_user.*$/m)) {
    envContent = envContent.replace(
      /^# MONGO_URI=mongodb\+srv:\/\/pablorutigliano1973_db_user.*$/m,
      atlasLine
    );
  } else {
    // Fallback — agregar al final si no encontramos el placeholder
    envContent += `\n${atlasLine}\n`;
  }

  // Generar JWT_SECRET aleatorio si está con el default
  if (envContent.includes('JWT_SECRET=cambiar_este_secret_en_produccion')) {
    const randomSecret = (await import('node:crypto'))
      .randomBytes(32).toString('hex');
    envContent = envContent.replace(
      'JWT_SECRET=cambiar_este_secret_en_produccion',
      `JWT_SECRET=${randomSecret}`
    );
    ok('JWT_SECRET random generado (32 bytes hex)');
  }

  writeFileSync(ENV_PATH, envContent, { mode: 0o600 });   // solo el dueño puede leerlo
  ok(`Escrito ${ENV_PATH}`);
  ok(`Permisos: 600 (solo tu usuario puede leerlo)`);

  // ─── 7. Recordatorios finales ────────────────────────────────
  header('✅  Setup completo');
  log('');
  log(`${c.green}Próximos pasos:${c.reset}`);
  log(`  1. Cargar el seed de datos demo:`);
  log(`     ${c.cyan}cd server && npm run init-db${c.reset}`);
  log('');
  log(`  2. Arrancar el backend:`);
  log(`     ${c.cyan}cd server && npm run dev${c.reset}`);
  log('');
  log(`  3. En otra terminal, arrancar el frontend:`);
  log(`     ${c.cyan}cd client && npm run dev${c.reset}`);
  log('');
  log(`  4. Abrir ${c.cyan}http://localhost:5173${c.reset}`);
  log('');
  log(`${c.dim}─────────────────────────────────────────────────────${c.reset}`);
  log(`${c.yellow}Importante:${c.reset}`);
  log(`  • El archivo ${c.cyan}server/.env${c.reset} contiene tu password real`);
  log(`  • Ya está en ${c.cyan}.gitignore${c.reset} — nunca se sube a GitHub`);
  log(`  • Para producción (Render/Vercel), poné MONGO_URI como variable de entorno`);
  log(`    en el dashboard del provider, NO en el código`);
}

main().catch((e) => {
  fail(`Error inesperado: ${e.message}`);
  console.error(e);
  exit(1);
});
