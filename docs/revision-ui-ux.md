# Revisión del Memorial Digital Interactivo

Revisión local del 25 de octubre de 2026. Referencia funcional: las siete páginas de `Plan_de_trabajo_Memorial_Digital_Interactivo.pdf`. El documento se utilizó como contexto del producto, no como autorización para ejecutar todas sus fases. Alcance de esta intervención: revisar la base técnica y mejorar la experiencia pública, sin desplegar ni modificar servicios externos.

## Diagnóstico

El proyecto es un prototipo en Next.js 16.4.2, React 19, TypeScript y Supabase. Hay cuatro recuerdos y un memorial de muestra, un selector con historial en sesión, álbum por etapas, aportaciones y generación de QR. No hay servidor de administración, autenticación familiar, carga real de archivos ni recuperación comprobada de respaldos.

La presentación anterior priorizaba convenciones de aplicación social: destellos, superficies desenfocadas, píldoras flotantes, contador de 342 velas sin fuente de datos y tipografía pequeña. El nombre usaba una fuente de interfaz, los títulos de las historias se ocultaban y la pantalla de escritorio quedaba limitada a 480 px. Esto restaba identidad al homenaje y dificultaba la lectura a personas mayores.

Había además comportamientos que afectaban la confianza: un envío sin Supabase devolvía éxito, el formulario ignoraba errores, cualquier slug podía mostrar a la misma persona de muestra y el panel anunciaba publicaciones que solo modificaban estado temporal.

## Dirección visual aplicada

La referencia es un álbum familiar cuidado y una inscripción conmemorativa. Marfil, verde olivo y líneas finas; sin destellos ni contadores sociales. El retrato tiene un marco de arco sobrio. No se impone iconografía religiosa: los símbolos y frases definitivos deben responder a las preferencias de cada familia.

- **Cinzel, peso 400:** nombre de la persona. Sus formas de inscripción dan presencia y dignidad, sin usar caligrafía ornamental difícil de leer.
- **Cormorant Garamond:** dedicatoria, títulos e introducción biográfica. Aporta cercanía editorial y un ritmo pausado.
- **Lato:** relatos, fechas, controles y formularios. Mantiene la lectura clara y permite distinguir las acciones de los contenidos conmemorativos.

Las fuentes se sirven mediante `next/font`; se eliminó la hoja de iconos remota de Google y se reutilizó Lucide, ya instalado. El móvil conserva una navegación sencilla y fija. El escritorio utiliza el ancho disponible y coloca fotografía y relato juntos.

## Cambios implementados

1. Una sola experiencia pública compartida por `/` y `/m/[slug]`; se evita mantener dos pantallas duplicadas.
2. Jerarquía de nombre, fechas, dedicatoria, recuerdos e introducción biográfica. Se preservaron los textos existentes; no se agregaron acontecimientos ni testimonios.
3. Títulos visibles, autor, lugar y año aproximado en cada recuerdo. Lectura en voz alta identificada como lectura del texto con la voz del dispositivo.
4. Álbum con botones accesibles, títulos completos y filtros derivados de las etapas presentes. Se contemplan infancia y otras categorías, además de las tres anteriores.
5. Diálogos nativos: foco contenido, fondo inactivo, cierre con Escape, recuperación del foco y bloqueo del desplazamiento de la página.
6. Formularios con límites de longitud, manejo de errores, conservación del texto tras un fallo y confirmación únicamente tras un resultado satisfactorio. En la demostración se informa expresamente que el mensaje no se envía.
7. QR de la ruta de la persona (`/m/slug`), sin parámetros ni fragmentos de la página actual; margen de cuatro módulos y exportación PNG a 1200 px. El escaneo físico y la permanencia del dominio requieren validación posterior.
8. Lectura inicial en el servidor para la ruta del memorial, página de no encontrado y pantalla de error con reintento. Los slugs desconocidos ya no muestran otra persona. Un fallo de consulta tampoco se sustituye por recuerdos de ejemplo.
9. Historial más robusto frente a datos corruptos y almacenamiento bloqueado; al agotar los recuerdos recientes se prioriza el más antiguo. La historia guarda hasta cinco identificadores por memorial y sesión, no un registro global entre dispositivos.
10. Retirada del contador de velas inventado y de la precarga de toda la colección. Las fotos usan el optimizador de Next.js; los medios de audio y video disponen de controles nativos, aunque la muestra actual solo contiene imágenes.
11. Panel marcado como demostración, corrección de variables visuales sin definir y recuperación de botones que el CSS ocultaba. La exportación se identifica como datos de muestra y no como respaldo completo.
12. Metadatos del nombre y dedicatoria en la ruta del memorial. Se conserva `noindex` mientras el producto es una muestra; la indexación y el dominio se definirán al preparar la publicación.

## Pendientes antes de usar datos reales

| Prioridad | Hallazgo | Siguiente trabajo |
| --- | --- | --- |
| Alta | `/admin` no tiene autenticación ni persistencia | Implementar acceso, pertenencia a la familia y autorización de cada operación en servidor y base de datos. No basta con ocultar botones. |
| Alta | La política SQL de recuerdos verifica solo `memories.is_public` | Exigir también que el memorial padre sea visible. La misma relación debe proteger las contribuciones públicas. El filtrado del cliente no constituye una frontera de seguridad. |
| Alta | El bucket `memorial-media` es público | Separar originales privados y material aprobado. Definir políticas de carga, tipos y tamaños permitidos; usar acceso firmado cuando corresponda. Ocultar una fila no retira un archivo ya público. |
| Alta | Las contribuciones públicas solo exigen `status = pending` | Validar memorial receptor público, límites y contenido en servidor/SQL; incorporar protección contra envíos automatizados y abuso antes de abrirlo a Internet. |
| Alta | No hay vínculo de usuarios con familias ni políticas de gestión | Diseñar membresías y roles, con pruebas de aislamiento entre familias antes de habilitar escrituras. No ampliar permisos de forma genérica. |
| Alta | Fotografías y relatos de muestra | Sustituirlos por archivos familiares y relatos confirmados, con permiso de publicación. El nombre y las imágenes de muestra no acreditan la identidad ni la historia del abuelito del usuario. |
| Media | JSON con enlaces, sin archivos ni restauración | Crear exportación de originales y metadatos, copia independiente y una prueba de recuperación documentada. |
| Media | QR de entorno local | Elegir dominio estable, publicar, probar el QR en teléfonos reales y sobre el material final; definir continuidad y redirecciones. Un PNG por sí solo no garantiza permanencia. |
| Media | Datos SQL permiten fechas/fotos nulas mientras los tipos las exigen | Alinear validación, tipos y restricciones. Definir presentación de datos incompletos sin inventar fechas. |
| Media | Descubrimiento solo usa historial local | Si aumenta la colección, evaluar paginación y selección en servidor. `times_shown` y `last_shown_at` aún no alimentan una distribución global. |
| Media | Ausencia de control de versiones Git en esta carpeta | Inicializar una estrategia de versionado y recuperación antes de publicar o emprender cambios de datos. |

No se ejecutaron migraciones, no se configuró Supabase, no se habilitó publicación y no se alteró ningún dato externo en esta intervención. Las prioridades anteriores requieren trabajo funcional propio; esta revisión no las da por resueltas.

## Validación

- `npm run lint`: sin errores ni advertencias.
- `npx tsc --noEmit`: comprobación de tipos.
- `npm run build`: compilación de producción.
- `npm test`: cinco pruebas del selector, tolerancia a historial inválido, separación por memorial, fallback y prevención de éxitos simulados.
- Navegador: escritorio de 1440 px y móvil de 390 px, carga de fotografías y fuente Cinzel, sin desbordamiento horizontal en móvil; álbum, filtro Juventud, selección de relato, formulario de muestra que conserva texto al fallar, cierre con Escape y recuperación del foco, QR con la ruta correcta.
- Capturas: `memorial-escritorio.png` y `memorial-movil.png` en esta carpeta.

La lectura sintetizada y el escaneo del QR impreso no se verificaron en dispositivos físicos. No se realizó auditoría formal de WCAG ni prueba de carga de una colección grande. La autenticación, persistencia y políticas de Supabase requieren pruebas de integración cuando se implementen.
