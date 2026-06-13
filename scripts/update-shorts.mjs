import fs from "node:fs";

const outputPath = "shorts.json";
const browserOutputPath = "shorts-data.js";
const channelUrl = "https://www.youtube.com/@mindofAR/shorts";

let input = "";

for await (const chunk of process.stdin) {
  input += chunk;
}

const feed = JSON.parse(input);
const shorts = (feed.entries || [])
  .filter((entry) => entry && entry.id)
  .map((entry) => ({
    id: entry.id,
    title: entry.title || "YouTube Short",
    url: `https://www.youtube.com/shorts/${entry.id}`,
    thumbnail: `https://i.ytimg.com/vi/${entry.id}/frame0.jpg`,
  }));

const output = {
  channelUrl,
  updatedAt: new Date().toISOString(),
  shorts,
};
const existing = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : null;
const existingBrowserFeed = fs.existsSync(browserOutputPath)
  ? fs.readFileSync(browserOutputPath, "utf8")
  : "";
const browserFeed = `window.YOUTUBE_SHORTS_FEED = ${JSON.stringify(output, null, 2)};\n`;
const existingBrowserData = existingBrowserFeed
  ? JSON.parse(
      existingBrowserFeed
        .replace(/^window\.YOUTUBE_SHORTS_FEED\s*=\s*/, "")
        .replace(/;\s*$/, ""),
    )
  : null;
const shortsUnchanged =
  existing && JSON.stringify(existing.shorts) === JSON.stringify(shorts);
const browserShortsUnchanged =
  existingBrowserData &&
  JSON.stringify(existingBrowserData.shorts) === JSON.stringify(shorts);

if (shortsUnchanged && browserShortsUnchanged) {
  console.log(`Shorts feed is already current (${shorts.length} videos).`);
  process.exit(0);
}

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(browserOutputPath, browserFeed);
console.log(`Updated Shorts feed with ${shorts.length} videos.`);
