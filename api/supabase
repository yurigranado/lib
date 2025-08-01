// api/supabase.js

export default async function handler(req, res) {
  const { endpoint, method = 'GET', body = null } = req.body;

  const resposta = await fetch(`https://lamjkztvgxuivnsrpvnr.supabase.co/rest/v1/${endpoint}`, {
    method,
    headers: {
      apikey: process.env.SUPABASE_API_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });

  const dados = await resposta.json();
  res.status(200).json(dados);
}
