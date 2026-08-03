/*
  firebase-init.js
  ------------------------------------------------------------------
  Conecta el Portal de Sistemas a una base de datos en la nube (Firebase
  Firestore) para que los 3 tableros muestren la MISMA información a
  todas las personas, desde cualquier dispositivo, en tiempo real.

  ESTE ARCHIVO DEBE ESTAR EN LA MISMA CARPETA que index.html,
  dashboard_tickets_ti.html, sistemas-report.html y
  dashboard_capacitaciones.html.

  ÚNICO PASO QUE TIENES QUE HACER: reemplazar los valores de
  "firebaseConfig" (abajo) con los de TU proyecto de Firebase.
  Los obtienes en: Firebase Console > (ícono engranaje) Configuración
  del proyecto > General > "Tus apps" > tu app web > "SDK setup and
  configuration".

  No es información secreta: es normal y seguro que esté visible en
  el código de una página web. La seguridad real la dan las reglas de
  Firestore (ver README_FIREBASE.md).
------------------------------------------------------------------- */

(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyC5hKnkEdnGZDl0_uDnnsidQMySW4US4OA",
    authDomain: "portal-sistemas-3496c.firebaseapp.com",
    projectId: "portal-sistemas-3496c",
    storageBucket: "portal-sistemas-3496c.firebasestorage.app",
    messagingSenderId: "587986415339",
    appId: "1:587986415339:web:654fdc21e852c38e2d18ae"
  };

  if (firebaseConfig.apiKey.indexOf("PEGA_AQUI") === 0) {
    console.warn(
      "Portal de Sistemas: todavía no configuraste firebase-init.js. " +
      "Los tableros van a funcionar solo en este navegador (sin compartir " +
      "datos) hasta que pegues tu firebaseConfig real."
    );
  }

  var firestoreDb = null;
  var authInstance = null;
  var authReady = Promise.resolve(null);

  try {
    firebase.initializeApp(firebaseConfig);
    firestoreDb = firebase.firestore();
    authInstance = firebase.auth();

    authReady = new Promise(function (resolve) {
      authInstance.onAuthStateChanged(function (user) {
        if (user) resolve(user);
      });
      authInstance.signInAnonymously().catch(function (err) {
        console.error("Portal de Sistemas: no se pudo iniciar sesión anónima en Firebase.", err);
        resolve(null);
      });
    });
  } catch (err) {
    console.error("Portal de Sistemas: no se pudo inicializar Firebase. Revisa firebaseConfig.", err);
  }

  // Todas las claves de este portal se guardan en una sola colección
  // compartida por todo el equipo: "portal_sistemas_shared".
  function docRef(key) {
    var safeKey = String(key).replace(/[\/\s'"]/g, "_");
    return firestoreDb.collection("portal_sistemas_shared").doc(safeKey);
  }

  // API compatible con window.storage (get/set/delete/list) + una
  // extensión propia "watch" para sincronización en tiempo real.
  window.storage = {
    ready: authReady,

    get: function (key /*, shared */) {
      if (!firestoreDb) return Promise.resolve(null);
      return authReady.then(function () {
        return docRef(key).get();
      }).then(function (snap) {
        if (!snap.exists) return null;
        var data = snap.data();
        return { key: key, value: data.value, shared: true };
      }).catch(function (err) {
        console.error("Portal de Sistemas: error al leer '" + key + "' de la nube.", err);
        return null;
      });
    },

    set: function (key, value /*, shared */) {
      if (!firestoreDb) return Promise.resolve(null);
      return authReady.then(function () {
        return docRef(key).set({
          value: value,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).then(function () {
        return { key: key, value: value, shared: true };
      }).catch(function (err) {
        console.error("Portal de Sistemas: error al guardar '" + key + "' en la nube.", err);
        return null;
      });
    },

    delete: function (key /*, shared */) {
      if (!firestoreDb) return Promise.resolve(null);
      return authReady.then(function () {
        return docRef(key).delete();
      }).then(function () {
        return { key: key, deleted: true, shared: true };
      }).catch(function (err) {
        console.error("Portal de Sistemas: error al borrar '" + key + "' en la nube.", err);
        return null;
      });
    },

    list: function (prefix /*, shared */) {
      if (!firestoreDb) return Promise.resolve(null);
      return authReady.then(function () {
        return firestoreDb.collection("portal_sistemas_shared").get();
      }).then(function (querySnap) {
        var keys = [];
        querySnap.forEach(function (doc) {
          if (!prefix || doc.id.indexOf(prefix) === 0) keys.push(doc.id);
        });
        return { keys: keys, prefix: prefix, shared: true };
      }).catch(function (err) {
        console.error("Portal de Sistemas: error al listar claves.", err);
        return null;
      });
    },

    // Extensión propia: avisa a cada tablero abierto cuando alguien
    // más (en otro dispositivo) actualiza el mismo dato, para que se
    // refresque solo, sin recargar la página.
    watch: function (key, callback) {
      if (!firestoreDb) return function () {};
      return docRef(key).onSnapshot(function (snap) {
        if (!snap.exists) { callback(null); return; }
        var data = snap.data();
        callback({ key: key, value: data.value, shared: true });
      }, function (err) {
        console.error("Portal de Sistemas: error de sincronización en vivo para '" + key + "'.", err);
      });
    }
  };

  window.dispatchEvent(new Event("storage-ready"));
})();
