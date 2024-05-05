const express = require("express");
const fs = require("fs");
const { pipeline } = require("node:stream/promises");
const zlib = require("node:zlib");

const app = express();

app.get("/", (req, res) => {
  return res.send("Working");
});

app.get("/video", (req, res) => {
  const file = fs.readFileSync("./public/video2.mkv");

  res.send(file);
});

app.get("/video/stream", (req, res) => {
  const filepath = "./public/video2.mkv";
  const range = req.headers.range;
  const stat = fs.statSync(filepath);
  console.log(range);
  if (!range) {
    return res.send("Range required");
  }
  const chunkSize = 10*10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize - 1, stat.size - 1);
  console.log(stat.size);
  console.log(start, end);
  const readStream = fs.createReadStream(filepath, { start, end });

  res.writeHead(206, {
    "content-range": `bytes ${start} - ${end}/${stat.size}`,
    "accept-ranges": "bytes",
    "content-length": end - start + 1,
    "content-type": "video/x-matroska",
  });

  readStream.on("open", () => {
    readStream.pipe(res);
  });

  readStream.on("error", function (err) {
    res.status(500).send("Error while reading the video stream");
  });
});

const run = async () => {
  const filepath = "./public/video.mp4";
  await pipeline(
    fs.createReadStream(filepath),
    zlib.createGzip(),
    fs.createWriteStream("./public/example.tar.gz")
  );
};

// run().catch(console.error)

app.listen(8000, () => {
  console.log("Server is running at port 8000");
});
