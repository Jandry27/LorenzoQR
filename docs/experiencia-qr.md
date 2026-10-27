# Memorial de Lorenzo: experiencia y funcionamiento local

## Dirección visual

Interfaz blanca con superficies translúcidas, bordes de luz y sombras suaves. Retrato sepia centrado dentro de un marco fino con forma de arco, con el nombre y las fechas debajo, sin una tarjeta exterior que los encierre. El álbum aparece como un carrusel de fotografías con profundidad; las imágenes completas se pueden ampliar. Hay una alternativa opaca para navegadores sin filtros de fondo y se respeta la preferencia de reducir movimiento.

La foto principal es `public/photos/lorenzo-chamba/portada.png`, copiada sin editar desde el archivo aportado por el usuario. Las doce fotos seleccionadas siguen en el álbum; no se han inventado historias ni fechas para ellas.

## Recuerdos diferentes al visitar

Las páginas se renderizan en cada petición y reciben una fotografía inicial elegida al azar en el servidor. El teléfono conserva el historial en almacenamiento local. El botón de descubrimiento evita las ya vistas hasta completar la colección y después inicia otra vuelta sin repetir la última inmediatamente. Si el navegador bloquea el almacenamiento, conserva la elección aleatoria, pero no se puede garantizar un historial entre visitas.

Dos visitantes pueden coincidir por azar en una fotografía; no se promete exclusividad entre personas. La exploración manual del carrusel o del álbum permite volver intencionadamente a una imagen conocida.

## Aportaciones reales

`POST /api/recuerdos` recibe nombre, relación opcional, texto y fotografía opcional. Se necesita un nombre y al menos una fotografía o un texto. Acepta JPEG, PNG o WebP, con límite de 8 MB. Se comprueba que los bytes correspondan a una imagen admitida; se normaliza la orientación, se reduce a un máximo de 2000 px y se guarda como WebP sin metadatos EXIF/GPS.

Cada aportación queda pendiente en `.memorial-data/recuerdos`, fuera de `public`. Los registros tienen identificadores UUID y escrituras atómicas. Las imágenes pendientes solo se sirven en una sesión familiar; una persona sin sesión recibe 404. Un límite global de peticiones y un límite de 500 registros protegen este prototipo local de envíos excesivos.

Los textos se muestran mediante React, sin HTML suministrado por visitantes. La revisión puede aprobar o conservar sin publicar una aportación sin eliminarla. Las fotos aprobadas pasan al álbum; los mensajes aprobados sin fotografía aparecen como palabras de recuerdo. Retirar la aprobación también retira el archivo del endpoint público, con respuestas sin caché.

## Acceso familiar

`/admin` requiere clave. Para obtenerla en la Mac, desde la carpeta del proyecto:

```sh
npm run familia:clave
```

La clave se genera aleatoriamente y se guarda con permisos de usuario en `.memorial-data/clave-familiar`; no se incluye en el código ni en Git. La sesión usa una cookie HttpOnly, SameSite Strict y firma HMAC, con duración de ocho horas. En HTTPS la cookie usa también Secure. Las mutaciones comprueban el origen y limitan el cuerpo recibido. No hay una contraseña compartida incorporada al repositorio.

No hace falta abrir una cuenta externa para probar el flujo local. Esta clave permite revisar todo el memorial de Lorenzo; no es todavía un sistema de cuentas, roles y varias familias.

## QR y alcance de la prueba

El QR utiliza `/m/lorenzo-chamba`. Al abrir la aplicación en localhost, el generador busca la dirección privada de la Mac para que el teléfono pueda escanearlo dentro del mismo Wi-Fi. El diálogo identifica claramente que es un QR local. Si la aplicación ya se abre desde una dirección de red, conserva esa dirección.

Para una publicación futura se puede configurar `MEMORIAL_PUBLIC_URL` con el dominio estable. Este paso exige hosting con almacenamiento duradero, HTTPS y una estrategia de respaldo antes de grabar una placa definitiva. Un despliegue serverless con disco efímero no conserva este almacén local por sí solo.

Mientras se use la prueba actual, la Mac debe permanecer encendida y el teléfono debe estar en la misma red. No se ha publicado el memorial en Internet. La clave familiar debería utilizarse en la Mac o en una red de confianza mientras el acceso local sea HTTP.

## Conservación

Para trasladar el proyecto hay que conservar `.memorial-data` (incluidas imágenes y registros), además de `public/photos/lorenzo-chamba`. No borrar ni publicar la clave familiar. La carpeta de datos está excluida de Git y del trazado de archivos de Next.js. Cambiar el diseño o recompilar no elimina las aportaciones.

Se puede cambiar la ubicación mediante `MEMORIAL_DATA_DIR` a una carpeta duradera del servidor. Esto no sustituye una copia independiente ni una prueba de restauración.

## Comprobación

- `npm test`: seis pruebas de aleatoriedad, ciclos, separación de historiales y rutas.
- `npm run test:integration`: utiliza un servidor separado, una carpeta temporal y una imagen sintética. Comprueba envío de texto/foto, bloqueo del archivo pendiente, acceso familiar, aprobación, visibilidad pública, rechazo de formatos falsos, tamaño máximo, origen, persistencia tras reinicio y retirada reversible.
- `npm run lint`, `npx tsc --noEmit` y `npm run build` verifican el código y la compilación.

La integración no publica ni elimina recuerdos familiares: sus archivos de prueba se crean en una carpeta temporal propia y se retiran al finalizar.

## Lectura y contenido familiar

- Transiciones por capas: la imagen anterior permanece hasta cargar la nueva. Si esta falla, se retira la anterior para no asociarla a un título distinto y se informa del fallo.
- Ver en calma abre un diálogo a pantalla completa con la imagen completa, controles anterior/siguiente e historia opcional. Las flechas del teclado navegan y Escape cierra con recuperación del foco. No hay reproducción automática ni audio.
- Aa ofrece texto normal/grande/muy grande, mayor contraste y reducción de movimiento. Las preferencias se guardan en el dispositivo. La portada mantiene el retrato en arco.
- /admin/album requiere la sesión familiar. Allí se editan la dedicatoria y su firma, los títulos e historias de las fotos, personas, año aproximado, lugar y autor. Los campos desconocidos pueden quedar vacíos.
- Lo que nos dejó admite hasta doce textos escritos y confirmados por la familia. No se rellenó con datos inventados.
- Las ediciones se guardan atómicamente en .memorial-data/editorial con comprobación de revisiones, copia de versiones anteriores en historial y protección de formularios sin guardar.

Las diez pruebas unitarias cubren también validación editorial, campos vacíos, IDs, concurrencia y conservación de versiones. La integración comprueba acceso familiar, aparición de los cambios en la página y persistencia al reiniciar. Las escrituras de prueba usan datos sintéticos en carpetas temporales.
