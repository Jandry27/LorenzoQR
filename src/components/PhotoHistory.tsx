import { Memory } from '../lib/types';

export function PhotoHistory({ memory }: { memory: Memory }) {
  return <div className="photo-history"><p className="eyebrow">DETRÁS DE LA FOTOGRAFÍA</p><h3>{memory.title}</h3>
    {memory.story ? <p className="history-body">{memory.story}</p> : <p className="history-empty">La familia está reuniendo la historia de esta fotografía. Por ahora, conservamos la imagen tal como llegó a nuestro álbum.</p>}
    <dl className="photo-context">
      {memory.people && <div><dt>Quiénes aparecen</dt><dd>{memory.people}</dd></div>}
      {memory.approximate_year && <div><dt>Año aproximado</dt><dd>{memory.approximate_year}</dd></div>}
      {memory.location && <div><dt>Lugar</dt><dd>{memory.location}</dd></div>}
      {memory.author_name && <div><dt>Compartido por</dt><dd>{memory.author_name}</dd></div>}
    </dl>
  </div>;
}
