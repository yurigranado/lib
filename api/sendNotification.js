import webpush from 'web-push';

const SUPABASE_URL = "https://lamjkztvgxuivnsrpvnr.supabase.co";
const API_KEY = "SUA_API_KEY_DO_SUPABASE_AQUI";

const VAPID_PUBLIC_KEY = "BEBcJggWpBXqMcGIPdIxrPV_GEjuLD0zFEnFKbZ1m5cOwsJdjJ7w6j95BGDWvEP5TmUUCKGZPauG6jkipw6ZjEs";
const VAPID_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgKqH3AM2V1WNfwSRUYJAgZx4Nt/qiop3SKH0JbZ2SlI+hR
ANCAAQAXCYIFqQVejHBiD3SMaz1fxhI7iw9MxRJxSm2dZuXDsLCXYye8Oo/eQRg1rxD+U5lFAihmT2rhuo5IKnDpmMSw==
-----END PRIVATE KEY-----`;

webpush.setVapidDetails(
  "mailto:seu@email.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Só aceita POST' });
  }

  const { entregador_id, title, body } = req.body;

  if (!entregador_id || !title || !body) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  // Busca o token no Supabase
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

  try {
    await webpush.sendNotification(
      JSON.parse(tokens[0].token),
      JSON.stringify({ title, body })
    );
    return res.status(200).json({ message: 'Notificação enviada!' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao enviar', error: err });
  }
}
