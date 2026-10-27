# Correccion del fundido de fotografias

El fundido conservaba la imagen anterior despues de cargar la nueva. Al usar object-fit: contain, los espacios libres dejaban ver esa imagen anterior y parecia que las fotos se mezclaban.

La correccion usa una superficie opaca del color del visor para cada imagen y retira la capa anterior al terminar la transicion. Un temporizador de respaldo realiza la misma limpieza si el navegador omite transitionend, incluida la lectura sin movimiento. Los eventos de cargas antiguas no pueden limpiar una fotografia posterior. Un error de carga retira tambien la capa anterior para no mostrarla asociada al titulo de otra foto.

Comprobacion en navegador con viewport movil de 390 px:

- Ocho cambios consecutivos en el carrusel: una imagen por tarjeta al terminar cada transicion.
- Ocho cambios rapidos en el modo de contemplacion: una imagen en el visor y ninguna capa anterior residual.
- Ocho cambios adicionales con prefers-reduced-motion: reduce: limpieza correcta aun con duracion de transicion de cero segundos.
- Regreso al carrusel: una imagen por cada una de sus tres tarjetas.
- Comparacion visual de la fotografia 2/12 del reporte, sin restos de la fotografia horizontal anterior.
- Lint y compilacion aprobados.

Las comprobaciones se hicieron en el navegador de escritorio con emulacion de pantalla movil, no en un iPhone fisico. No se modificaron las fotografias originales ni los textos familiares.
