import fs from 'fs';
import path from 'path';

const assets = [
  { url: 'https://raw.githubusercontent.com/jungdu/webgl-aquarium/main/static/glb/fish/BlueGoldfish.glb', name: 'fish1.glb' },
  { url: 'https://raw.githubusercontent.com/jungdu/webgl-aquarium/main/static/glb/fish/CoralGrouper.glb', name: 'fish2.glb' },
  { url: 'https://raw.githubusercontent.com/jungdu/webgl-aquarium/main/static/glb/fish/Piranha.glb', name: 'fish3.glb' },
  { url: 'https://raw.githubusercontent.com/jungdu/webgl-aquarium/main/static/glb/fish/Sunfish.glb', name: 'fish4.glb' },
  { url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb', name: 'fish5.glb' },
  { url: 'https://raw.githubusercontent.com/forhow134/games/main/01-island-treasure/dist/models/rock.glb', name: 'rock1.glb' },
  { url: 'https://raw.githubusercontent.com/forhow134/games/main/05-forest-quest/public/models/rock-boulder.glb', name: 'rock2.glb' },
  { url: 'https://raw.githubusercontent.com/forhow134/games/main/05-forest-quest/public/models/stalagmite.glb', name: 'rock3.glb' },
  { url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb', name: 'plant1.glb' },
  { url: 'https://raw.githubusercontent.com/forhow134/games/main/01-island-treasure/dist/models/tree.glb', name: 'plant2.glb' }
];

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(dest, buffer);
  console.log(`Successfully downloaded ${url} to ${dest}`);
}

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const asset of assets) {
    const dest = path.join(publicDir, asset.name);
    try {
      await downloadFile(asset.url, dest);
    } catch (err) {
      console.error(`Error downloading ${asset.name}:`, err.message);
    }
  }
}

main();
