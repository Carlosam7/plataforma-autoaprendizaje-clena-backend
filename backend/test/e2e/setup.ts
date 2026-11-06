import { urlBaseDatosE2e } from './entorno.js';

// Se ejecuta antes de importar la aplicación, para que ConfigModule valide estos valores.
process.env.DATABASE_URL = urlBaseDatosE2e();
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??=
  'secreto-de-pruebas-e2e-con-mas-de-32-caracteres';
process.env.AVISO_PRIVACIDAD_VERSION = 'v-e2e';
