export default async function handler(req, res) {
  try {
    const body = await req.json(); // testando se req.json() funciona
    console.log("🔍 BODY RECEBIDO:", body);
    return res.status(200).json({ recebido: body });
  } catch (erro) {
    console.error("❌ ERRO DEBUG:", erro);
    return res.status(500).json({ erro: "Falha ao ler o body", detalhes: erro.message });
  }
}
