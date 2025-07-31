const webpush = require('web-push');
const fetch = require('node-fetch');

const SUPABASE_URL = "https://lamjkztvgxuivnsrpvnr.supabase.co";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbWprenR2Z3h1aXZuc3Jwdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MDI4MjcsImV4cCI6MjA2OTA3ODgyN30.2g1OX3rrUtA_KWrUqjI0ZFV3a8IhF-ydESnU5YBCY24";

// ✅ Chaves VAPID (versão base64 segura - já gerada corretamente)
const VAPID_PUBLIC_KEY = "BPuUL18Elquwb28c1OE8eukdH-SsRYVa11ybbjz-5a8Ce-amPPvhZZnKN6wQ6CS9xeFQy_mefnChvP0rm7CGSLM";
const VAPID_PRIVATE_KEY = "6FJUJlaJd0EVdHsY8B0wHRXWj3dbc41F5_I8Gj9-pjA";

webpush.setVapidDetails(
  "mailto:yuri_granado@live.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Só aceita POST' });
  }

  const { entregador_id, title, body } = req.body;

  if (!entregador_id || !title || !body) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  try {
    const tokenRes = await fetch(`${SUPABASE_URL}/rest/v1/notificacoes_tokens?entregador_id=eq.${entregador_id}&limit=1`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const tokens = await tokenRes.json();
    if (!tokens.length) {
      return res.status(404).json({ message: 'Token não encontrado' });
    }

    await webpush.sendNotification(
      JSON.parse(tokens[0].token),
      JSON.stringify({ title, body })
    );

    return res.status(200).json({ message: 'Notificação enviada com sucesso!' });
  } catch (err) {
    console.error("Erro ao enviar notificação:", err);
    return res.status(500).json({ message: 'Erro ao enviar notificação', error: err.message });
  }
};
