/**
 * Lightweight extraction of stage names from YAML-like pipeline definitions.
 * Falls back to default stages if none found.
 */
function parsePipelineStages(yamlSource) {
  if (!yamlSource || typeof yamlSource !== 'string') {
    return ['build', 'test', 'deploy'];
  }
  const stages = [];
  const lines = yamlSource.split(/\r?\n/);
  let inStages = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('#')) continue;
    if (/^stages\s*:/i.test(line)) {
      inStages = true;
      continue;
    }
    if (inStages) {
      const m = line.match(/^-\s*(.+)$/);
      if (m) {
        const name = m[1].replace(/['"]/g, '').split(/\s+/)[0];
        if (name) stages.push(name);
        continue;
      }
      if (line && !line.startsWith(' ') && !line.startsWith('\t') && line.includes(':')) {
        break;
      }
    }
  }
  return stages.length ? stages : ['build', 'test', 'deploy'];
}

module.exports = { parsePipelineStages };
