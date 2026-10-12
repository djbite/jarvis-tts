export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const text = req.query.text || "Привет, сэр. Все системы функционируют в штатном режиме.";
  const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam: глубокий мужской баритон
  const apiKey = "sk_6d019394a354bb335787a50362b13453166fc833deccb20d";

  try {
    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return res.status(upstream.status).send("ElevenLabs error: " + err);
    }

    const audioBuffer = await upstream.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    return res.status(500).send("Error: " + err.message);
  }
}
