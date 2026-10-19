export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env vars');
    return res.status(500).json({ error: 'Backend not configured', ok: false });
  }

  const data = req.body || {};

  const record = {
    // Atleta
    nome: data.nome || null,
    idade: data.idade || null,
    cidade: data.cidade || null,
    estado: data.estado || null,
    // Responsável
    resp_nome: data.resp_nome || null,
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    // Trajetória
    tempo_bt: data.tempo_bt || null,
    frequencia: data.frequencia || null,
    nivel: data.nivel || null,
    professor: data.professor || null,
    competiu: data.competiu || null,
    ranking: data.ranking || null,
    // Compromisso
    objetivo: data.objetivo || null,
    disponibilidade: data.disponibilidade || null,
    deslocamento: data.deslocamento || null,
    // Origem
    origem: data.origem || null,
    obs: data.obs || null,
    // Tracking
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
    utm_content: data.utm_content || null,
    utm_term: data.utm_term || null,
    referrer: data.referrer || null,
    landing_url: data.landing_url || null,
    // Meta
    user_agent: req.headers['user-agent'] || null,
    ip: (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim() || null,
  };

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/nb360_juvenil_leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(record)
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Supabase insert error:', err);
      return res.status(500).json({ error: 'DB error', details: err, ok: false });
    }

    const inserted = await r.json();
    return res.status(200).json({ ok: true, id: inserted[0]?.id });
  } catch (e) {
    console.error('Handler error:', e);
    return res.status(500).json({ error: 'Internal error', ok: false });
  }
}
