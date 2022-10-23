const express = require("express");
const app = express();
const fs = require("fs");

// First we return the landingpage to the client
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

// When client has received and loaded landingpage, it calls for the video
// Range tells server what part it's to send, based on what the client has received prior
app.get("/video", function (req, res) {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Missing range header");
    }

    // What video are we sending
    const videoPath = "flames.mp4";

    // Get the size so we can calculate the chunks of it
    const videoSize = fs.statSync(videoPath).size;

    // How large chunks do we want to send
    const chunkSize = 10 ** 6; // 1MB

    // Parse starting byte from the range headers from string to a number
    const start = Number(range.replace(/\D/g, ""));

    // Determine how big a chunk we want to send. If we're close to the end, we don't want to surpass the videos size. And last byte is empty, since we start at 0 so we do -1
    const end = Math.min(start + chunkSize, videoSize - 1);

    // Get the size of the current chunk, since it could be less than a full chunk.
    const contentLength = end - start + 1;

    // Set headers, first we state how far into the video we are
    // Then we set that the partial range we accept is to be in bytes
    // Content-Length contains the chunk size and 
    // Content-Type is just what type of data we're sending
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    // This means we're sending partial content
    res.writeHead(206, headers);

    // Use the file system library to create a stream based on the start and end positions
    const videoStream = fs.createReadStream(videoPath, { start, end });

    // And for the final sending-action, we use pipe() to start streaming to the writeable res-object
    videoStream.pipe(res);
});

app.listen(8080, function () {
    console.log("Listening on port 8080");
});