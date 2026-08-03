# Portal de Sistemas — Conexión a la nube (Firebase)

Estos archivos ya están preparados para compartir datos entre todos los
dispositivos que abran el portal. Te faltan **2 pasos** para que quede
funcionando en línea.

## 1. Pega tu configuración de Firebase

Abre `firebase-init.js` y reemplaza estas líneas con los valores reales
de tu proyecto (los obtienes en Firebase Console → ⚙️ Configuración del
proyecto → General → "Tus apps" → tu app web):

```js
var firebaseConfig = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "PEGA_AQUI_TU_AUTH_DOMAIN",
  projectId: "PEGA_AQUI_TU_PROJECT_ID",
  storageBucket: "PEGA_AQUI_TU_STORAGE_BUCKET",
  messagingSenderId: "PEGA_AQUI_TU_MESSAGING_SENDER_ID",
  appId: "PEGA_AQUI_TU_APP_ID"
};
```

No es información secreta — es normal que esté visible en el código de
una página web. La seguridad real la dan las reglas de Firestore (paso 2).

## 2. Configura las reglas de seguridad de Firestore

Si creaste la base de datos en "modo de prueba", esas reglas **dejan de
funcionar a los 30 días** y el portal se quedaría sin poder leer ni
guardar datos. Reemplázalas ahora:

Firebase Console → Compilación → Firestore Database → pestaña **Reglas** →
pega esto → **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /portal_sistemas_shared/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Esto permite leer/escribir solo a quien abra el portal (se autentica
solo, de forma anónima, gracias a `firebase-init.js`) — no a cualquiera
que encuentre la dirección de tu base de datos por internet.

> 🔒 ¿Quieres pedir una contraseña compartida antes de entrar al portal?
> Es una mejora aparte (Firebase Authentication con usuario/contraseña).
> Avísame si la quieres y la agregamos.

## 3. Sube TODO junto a tu repositorio de GitHub

La carpeta debe tener estos 6 archivos juntos (mismo nivel, sin
subcarpetas):

```
index.html
dashboard_tickets_ti.html
sistemas-report.html
dashboard_capacitaciones.html
firebase-init.js
README_FIREBASE.md   (este archivo es solo para ti, es opcional subirlo)
```

Sube estos archivos a tu repositorio (por la web de GitHub con
"Add file → Upload files", o con git si lo usas) y activa GitHub Pages
en **Settings → Pages → Branch: main → / (root)**.

Tu portal quedará en:
`https://TU-USUARIO.github.io/TU-REPOSITORIO/`

## Cómo saber si ya está conectado

Abre cualquiera de los 3 tableros en línea, haz un cambio pequeño
(marca una capacitación como completada, por ejemplo), y abre el mismo
link desde otro dispositivo o navegador. Si el cambio aparece ahí
también (a veces toma 1-2 segundos), ¡está funcionando! Si no, revisa
la consola del navegador (F12 → pestaña "Console") por mensajes que
empiecen con "Portal de Sistemas:".

## Qué se comparte y qué no

- **Capacitaciones**: fechas y estado (completada/pendiente) de cada sesión.
- **Reporte de Sistemas**: checklist diario/mensual/anual de actividades.
- **Tickets de TI**: los tickets cargados desde Excel y el historial de cargas.

Cada tablero también guarda una copia en el navegador local (por si se
pierde la conexión a internet), pero la nube es la fuente principal:
si dos personas editan casi al mismo tiempo, gana el último guardado.
