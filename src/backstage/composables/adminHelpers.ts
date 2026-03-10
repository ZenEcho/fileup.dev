import type { DownloadDetail, PluginEntity } from '@common/types';
import { validatePluginContent } from '@common/utils/plugin';

export interface RiskAnalysisResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  rules: string[];
  script: string;
}

export function parseNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function hash(text: string) {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) value = (value * 31 + text.charCodeAt(i)) % 100000;
  return Math.abs(value);
}

export function generateDownloadDetails(plugins: PluginEntity[]): DownloadDetail[] {
  const pool = ['103.31.45.22', '101.44.92.17', '120.87.42.10', '27.185.11.90', '36.112.208.33'];
  const rows: DownloadDetail[] = [];

  plugins.forEach((plugin) => {
    const total = parseNumber(plugin.downloads);
    if (total <= 0) return;

    const seed = hash(plugin.id);
    const parts = Math.min(22, Math.max(6, Math.floor(Math.sqrt(total))));
    let remain = total;

    for (let i = 0; i < parts; i += 1) {
      const reserve = parts - i - 1;
      const avg = remain / (parts - i);
      let count = i === parts - 1 ? remain : Math.max(1, Math.round(avg + ((seed + i * 13) % 5) - 2));
      count = Math.min(count, remain - reserve);
      remain -= count;

      const d = new Date();
      d.setDate(d.getDate() - ((seed + i * 3) % 30));
      d.setHours((seed + i * 11) % 24, (seed + i * 7) % 60, 0, 0);

      rows.push({
        id: `${plugin.id}:${i}`,
        pluginId: plugin.id,
        pluginName: plugin.name,
        ip: pool[(seed + i) % pool.length] || pool[0]!,
        downloadedAt: d.toISOString(),
        count,
      });
    }
  });

  return rows.sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());
}

export function analyzePluginRisk(content: unknown): RiskAnalysisResult {
  const validated = validatePluginContent(content);
  if (!validated.valid || !validated.content) {
    return { score: 0, level: 'LOW', rules: [], script: '' };
  }

  const scripts = [validated.content.script, ...validated.content.inputs.map((input) => input.dataSource?.script || '')]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  const rules: string[] = [];
  let score = 0;

  scripts.forEach((script) => {
    if (/eval\s*\(/i.test(script)) {
      rules.push('eval 执行');
      score += 25;
    }
    if (/new\s+Function\s*\(/i.test(script)) {
      rules.push('Function 构造器');
      score += 20;
    }
    if (/document\.cookie/i.test(script)) {
      rules.push('读取 Cookie');
      score += 16;
    }
    if (/fetch\s*\(\s*['"`]https?:\/\//i.test(script)) {
      rules.push('外链 fetch');
      score += 10;
    }
  });

  const level = score >= 65 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';
  return {
    score: Math.min(100, score),
    level,
    rules: Array.from(new Set(rules)),
    script: scripts[0] || '',
  };
}
