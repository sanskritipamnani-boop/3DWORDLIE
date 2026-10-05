async function fetchDir(repo, path = '') {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!res.ok) return [];
  const items = await res.json();
  let glbFiles = [];
  for (const item of items) {
    if (item.type === 'file' && item.name.endsWith('.glb')) {
      glbFiles.push({ name: item.name, download_url: item.download_url });
    } else if (item.type === 'dir') {
      const subFiles = await fetchDir(repo, item.path);
      glbFiles = glbFiles.concat(subFiles);
    }
  }
  return glbFiles;
}

async function main() {
  try {
    const glbs = await fetchDir('forhow134/games', '01-island-treasure');
    console.log(JSON.stringify(glbs, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
