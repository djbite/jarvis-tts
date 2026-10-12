export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const text = req.query.text || "Привет, сэр. Джарвис готов к работе.";
  const voice = req.query.voice || "ru-RU-DmitryNeural";

  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    // Дожидаемся полного получения аудиопотока
    const audioBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      const stream = tts.toStream(text);
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", (err) => reject(err));
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(audioBuffer);
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
