// Vercel Serverless — Google Reviews proxy para Nova Beach Campinas
// GET /api/reviews
//
// Env vars obrigatorias (configurar em Vercel):
//   GOOGLE_PLACES_API_KEY  — chave de API com Places API (New) ou Places API habilitada
//                            Pegar em: https://console.cloud.google.com/apis/credentials
//                            Restringir por HTTP referrer: *.novabeachcampinas.com.br/*
//
// Place ID Nova Beach Campinas: ChIJNcyqtEfPyJQRiF2CuVLYqHg
// (achado via https://search.google.com/local/writereview?placeid=...)
//
// Cache: 6h via Cache-Control
// Fallback: se API falhar, retorna { reviews: [], rating: 4.5, total: 59 }

const PLACE_ID = 'ChIJNcyqtEfPyJQRiF2CuVLYqHg';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400'); // 6h cache + 24h SWR

  const KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!KEY) {
    return res.status(200).json({
      ok: false,
      error: 'no_api_key',
      fallback: { rating: 4.5, total: 59, reviews: [] }
    });
  }

  try {
    // Places API (legacy): fields=reviews,rating,user_ratings_total
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total,name&language=pt-BR&key=${KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('places_api_' + r.status);
    const data = await r.json();
    if (data.status !== 'OK') throw new Error(data.status);

    const result = data.result || {};
    const reviews = (result.reviews || []).map(rv => ({
      author: rv.author_name,
      avatar: rv.profile_photo_url,
      rating: rv.rating,
      time: rv.time,
      relative: rv.relative_time_description,
      text: rv.text || ''
    }));

    return res.status(200).json({
      ok: true,
      rating: result.rating || 4.5,
      total: result.user_ratings_total || 59,
      name: result.name || 'Nova Beach Campinas',
      reviews: reviews.sort((a, b) => (b.time || 0) - (a.time || 0))
    });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      error: String(err).slice(0, 100),
      fallback: { rating: 4.5, total: 59, reviews: [] }
    });
  }
};
