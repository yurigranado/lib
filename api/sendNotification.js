const webpush = require('web-push');
const fetch = require('node-fetch');

// 🔐 Protegido via variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const API_KEY = process.env.SUPABASE_API_KEY;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

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
