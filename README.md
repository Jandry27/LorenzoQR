# En memoria de Lorenzo Chamba

Memorial de Lorenzo Chamba (28 de abril de 1933 — 20 de octubre de 2026), con retrato de portada, álbum aleatorio, aportaciones con fotografías y revisión familiar. Next.js 16, React 19 y TypeScript.

## Desarrollo y prueba en red

```sh
npm install
npm run dev -- --hostname 0.0.0.0
```

Desde un teléfono en el mismo Wi-Fi, utilizar la dirección privada de la Mac y el puerto 3000. Para una compilación de producción local:

```sh
npm run build
npm run start -- --hostname 0.0.0.0
```

- `/` y `/m/lorenzo-chamba`: memorial y fotografías.
- `/admin`: acceso con clave para revisar aportaciones.
- `/admin/album`: editor de la dedicatoria, las historias y el legado.
- `npm run familia:clave`: muestra la clave local al responsable de la familia.

Las aportaciones se conservan en `.memorial-data`, fuera de la carpeta pública y de Git. No se publican hasta su aprobación. Es necesario conservar esa carpeta para trasladar el proyecto. Se trata de almacenamiento en la Mac, no de un servicio ya publicado o un respaldo en la nube.

La selección de doce fotos familiares está documentada en `docs/seleccion-lorenzo.json`. Los originales permanecen sin cambios. Las historias, autores y fechas de las fotos esperan confirmación familiar.

## Verificación

```sh
npm run lint
npm test
npx tsc --noEmit
npm run build
npm run test:integration
```

Las pruebas de integración levantan su propio servidor y solo utilizan archivos sintéticos en una carpeta temporal.

## Publicación pendiente

Se mantiene `noindex` durante la preparación. El QR local requiere el mismo Wi-Fi y que la Mac esté encendida. Para una placa definitiva se necesita dominio estable, HTTPS, almacenamiento duradero y copias independientes. `MEMORIAL_PUBLIC_URL` permite indicar el enlace público cuando exista; `MEMORIAL_DATA_DIR` permite cambiar la carpeta de almacenamiento.

Consultar [el funcionamiento de la experiencia QR](docs/experiencia-qr.md). La revisión anterior en `docs/revision-ui-ux.md` es un diagnóstico histórico; la autenticación local, el guardado y la revisión de aportaciones ya están implementados como se describe en el documento nuevo. La integración Supabase inicial no se usa para guardar las aportaciones de Lorenzo.

## Lectura y recuerdos

El botón Aa permite elegir el tamaño del texto, más contraste y reducción de movimiento. Las preferencias se conservan en el dispositivo. Ver en calma abre un visor a pantalla completa con navegación por fotos e historia opcional; admite las flechas del teclado y Escape.

Desde el editor familiar se guardan dedicatoria y firma, historias, personas, año aproximado, lugar y autor, y hasta doce textos de legado. Los datos desconocidos pueden dejarse vacíos. No se generaron recuerdos o citas de Lorenzo. La frase existente se conserva hasta que la familia la cambie.

Las ediciones se guardan en .memorial-data/editorial con comprobación de revisiones y copia de la versión anterior en historial. Las fotos originales no se alteran. Si dos sesiones editan lo mismo, el editor avisa en vez de sobrescribir silenciosamente.
