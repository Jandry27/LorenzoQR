import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.join(process.cwd(), 'public', 'photos', 'lorenzo-chamba');
const backupDir = path.join(process.cwd(), '.memorial-data', 'originales-portada');

async function main() {
  await fs.mkdir(backupDir, { recursive: true });
  const files = await fs.readdir(dir);

  let totalAntes = 0;
  let totalDespues = 0;

  for (const file of files) {
    if (!file.match(/\.(jpe?g|png|webp)$/i)) continue;
    const ruta = path.join(dir, file);
    const stat = await fs.stat(ruta);
    totalAntes += stat.size;

    // Guardar copia original en backup
    const backupRuta = path.join(backupDir, file);
    try {
      await fs.copyFile(ruta, backupRuta);
    } catch {}

    const bufferOriginal = await fs.readFile(ruta);
    let optimizado;

    if (file === 'portada.png') {
      // Optimizar PNG conservando nitidez pero reduciendo peso
      optimizado = await sharp(bufferOriginal)
        .rotate()
        .resize({ width: 800, height: 1000, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 85 })
        .toBuffer();
    } else {
      // Optimizar JPEGs
      optimizado = await sharp(bufferOriginal)
        .rotate()
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    }

    await fs.writeFile(ruta, optimizado);
    const nuevoStat = await fs.stat(ruta);
    totalDespues += nuevoStat.size;

    console.log(`✓ ${file}: ${Math.round(stat.size / 1024)} KB -> ${Math.round(nuevoStat.size / 1024)} KB`);
  }

  console.log(`\nTotal antes: ${(totalAntes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total después: ${(totalDespues / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Ahorro: ${(100 - (totalDespues / totalAntes) * 100).toFixed(1)}%`);
}

main().catch(console.error);
