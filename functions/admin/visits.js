import { decryptText } from '../../src/backend/secure-data.js';

const PAGE_SIZE = 100;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeEqual(left, right) {
  if (!left || !right) return false;

  let mismatch = left.length === right.length ? 0 : 1;
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

function getProvidedToken(request) {
  const url = new URL(request.url);
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return bearer ?? url.searchParams.get('token') ?? '';
}

function isAuthorized(request, env) {
  return safeEqual(getProvidedToken(request), env.VISIT_ADMIN_TOKEN);
}

function buildRows(rows) {
  if (!rows.length) {
    return '<tr><td colspan="9" class="empty">还没有访问记录</td></tr>';
  }

  return rows
    .map((row) => {
      const location = [row.country, row.region, row.city].filter(Boolean).join(' / ') || '-';
      const device = [row.device_type, row.browser_family, row.os_family].filter(Boolean).join(' / ') || '-';

      return `
        <tr>
          <td>${escapeHtml(row.visited_at)}</td>
          <td>${escapeHtml(row.path)}${row.query_present ? ' ?' : ''}</td>
          <td>${escapeHtml(row.ip)}</td>
          <td>${escapeHtml(location)}</td>
          <td>${escapeHtml(device)}</td>
          <td>${escapeHtml(row.as_organization || '-')}</td>
          <td>${escapeHtml(row.referer || '-')}</td>
          <td>${escapeHtml(row.status ?? '-')}</td>
          <td>${escapeHtml(row.user_agent || '-')}</td>
        </tr>
      `;
    })
    .join('');
}

async function decryptVisitorRow(env, row) {
  const decrypted = await decryptText(env, row.visitor_cipher, '{}');
  let visitor = {};
  try {
    visitor = JSON.parse(decrypted || '{}');
  } catch {
    visitor = {};
  }

  return {
    ...row,
    ip: visitor.ip || (row.ip === '[encrypted]' ? '' : row.ip),
    country: visitor.country || row.country,
    region: visitor.region || row.region,
    city: visitor.city || row.city,
    as_organization: visitor.asOrganization || row.as_organization,
    user_agent: visitor.userAgent || (row.user_agent === '[encrypted]' ? '' : row.user_agent),
    referer: visitor.referer || row.referer,
  };
}

function renderDashboard(rows, totalCount) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>OfferMate 访问记录</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #14201c;
        --muted: #64736e;
        --line: #d8e2de;
        --surface: #f7faf8;
        --accent: #16836a;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        background: var(--surface);
        color: var(--ink);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        width: min(1180px, calc(100vw - 32px));
        margin: 32px auto;
      }

      header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 22px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(26px, 4vw, 42px);
        line-height: 1.1;
      }

      p {
        margin: 0;
        color: var(--muted);
      }

      .stat {
        border: 1px solid var(--line);
        border-radius: 12px;
        background: #fff;
        padding: 14px 18px;
        min-width: 150px;
      }

      .stat strong {
        display: block;
        color: var(--accent);
        font-size: 30px;
      }

      .table-wrap {
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: #fff;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 1100px;
      }

      th, td {
        padding: 13px 14px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
        font-size: 14px;
      }

      th {
        position: sticky;
        top: 0;
        background: #f0f6f3;
        color: #0f5f50;
        font-size: 13px;
      }

      td:last-child {
        max-width: 340px;
        color: var(--muted);
      }

      .empty {
        color: var(--muted);
        text-align: center;
      }

      @media (max-width: 720px) {
        header { align-items: flex-start; flex-direction: column; }
        main { width: min(100vw - 20px, 1180px); margin-top: 20px; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>OfferMate 访问记录</h1>
          <p>最近 ${PAGE_SIZE} 条页面访问记录，静态资源和后台查看页不会写入这里。</p>
        </div>
        <div class="stat">
          <p>总记录</p>
          <strong>${escapeHtml(totalCount)}</strong>
        </div>
      </header>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>访问时间</th>
              <th>页面</th>
              <th>IP</th>
              <th>地区</th>
              <th>设备 / 浏览器 / 系统</th>
              <th>网络</th>
              <th>来源</th>
              <th>状态</th>
              <th>User-Agent</th>
            </tr>
          </thead>
          <tbody>${buildRows(rows)}</tbody>
        </table>
      </div>
    </main>
  </body>
</html>`;
}

function unauthorizedResponse() {
  return new Response('需要管理员 token。请使用 /admin/visits?token=你的token', {
    status: 401,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'WWW-Authenticate': 'Bearer',
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.VISITS_DB) {
    return new Response('VISITS_DB binding 未配置。', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  const list = await env.VISITS_DB.prepare(`
    SELECT
      visited_at,
      path,
      query_present,
      ip,
      visitor_cipher,
      country,
      region,
      city,
      as_organization,
      device_type,
      browser_family,
      os_family,
      user_agent,
      referer,
      status
    FROM visit_logs
    ORDER BY visited_at DESC
    LIMIT ?
  `)
    .bind(PAGE_SIZE)
    .all();

  const count = await env.VISITS_DB.prepare('SELECT COUNT(*) AS value FROM visit_logs').first();
  const rows = await Promise.all((list.results ?? []).map((row) => decryptVisitorRow(env, row)));

  if (new URL(request.url).searchParams.get('format') === 'json') {
    return Response.json({ total: count?.value ?? rows.length, rows });
  }

  return new Response(renderDashboard(rows, count?.value ?? rows.length), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
