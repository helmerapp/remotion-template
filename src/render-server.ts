import dotenv from "dotenv";
dotenv.config();

import { v4 as uuidv4 } from "uuid";
import express from "express";
import path from "path";
import fs from "fs";
import { addToRenderMediaQueue } from "./queues/workers/renderMedia";
import { createBullDashboardAndAttachRouter } from "./queues/dashboard";
import { state } from "./state";
import { RenderStatus } from "./types";

const app = express();
const outDirectory = `/tmp/out`;
const PORT = Number(process.env.PORT);
const remotionBundlePath = path.resolve("build");

if (!fs.existsSync(remotionBundlePath)) {
  throw new Error(
    "remotion bundle does not exist, run `npx remotion bundle` to create it",
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve("build")));

createBullDashboardAndAttachRouter(app);

app.post("/render", async (req, res) => {
  const { compositionId, inputProps } = req.body;

  if (!compositionId) {
    return res.status(400).json({ error: "missing compositionId" });
  }

  if (!inputProps) {
    return res.status(400).json({ error: "missing input props" });
  }

  const renderId = uuidv4();

  const fileName = `${renderId}.mp4`;

  const outPath = `${outDirectory}/${fileName}`;

  try {
    await addToRenderMediaQueue({
      renderId,
      inputProps,
      compositionId,
      outputLocation: outPath,
    });

    await state.prisma.renders.create({
      data: {
        uuid: renderId,
        status: RenderStatus.QUEUED,
        output_location: outPath,
      },
    });

    res.status(200).json({ message: "sent task for rendering", fileName });
  } catch (err) {
    console.error("❌ failed to send task for rendering:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.get("/download/:filename", (req, res) => {
  const file = `${outDirectory}/${req.params.filename}`;
  if (!fs.existsSync(file)) {
    return res.status(404).send("file not found");
  }
  res.download(file);
});

app.listen(PORT, () => {
  console.log(`🌐 Static bundle: http://localhost:${PORT}`);
  console.log(`🎬 Render endpoint: POST http://localhost:${PORT}/render`);
});
