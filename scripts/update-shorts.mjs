import fs from "node:fs";

const outputPath = "shorts.json";
const browserOutputPath = "shorts-data.js";
const channelUrl = "https://www.youtube.com/@mindofAR/shorts";

function readBrowserFeed(path) {
  if (!fs.existsSync(path)) {
    return null;
  }

  return JSON.parse(
    fs
      .readFileSync(path, "utf8")
      .replace(/^window\.YOUTUBE_SHORTS_FEED\s*=\s*/, "")
      .replace(/;\s*$/, ""),
  );
}

let flatFeed;
let detailedFeed = { entries: [] };

if (process.argv[2]) {
  flatFeed = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

  if (process.argv[3] && fs.existsSync(process.argv[3])) {
    detailedFeed = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
  }
} else {
  let input = "";

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  flatFeed = JSON.parse(input);
}

const existing = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : null;
const existingBrowserData = readBrowserFeed(browserOutputPath);
const existingById = new Map(
  (existing?.shorts || existingBrowserData?.shorts || []).map((short) => [
    short.id,
    short,
  ]),
);
const detailedById = new Map(
  (detailedFeed.entries || [])
    .filter((entry) => entry && entry.id)
    .map((entry) => [entry.id, entry]),
);

const shorts = (flatFeed.entries || [])
  .filter((entry) => entry && entry.id)
  .map((entry) => {
    const detailedEntry = detailedById.get(entry.id);
    const existingShort = existingById.get(entry.id);
    const description =
      detailedEntry?.description?.trim() || existingShort?.description || "";

    return {
      id: entry.id,
      title: entry.title || "YouTube Short",
      description,
      url: `https://www.youtube.com/shorts/${entry.id}`,
      thumbnail: `https://i.ytimg.com/vi/${entry.id}/frame0.jpg`,
    };
  });

const output = {
  channelUrl,
  updatedAt: new Date().toISOString(),
  shorts,
};
const existingBrowserFeed = fs.existsSync(browserOutputPath)
  ? fs.readFileSync(browserOutputPath, "utf8")
  : "";
const browserFeed = `window.YOUTUBE_SHORTS_FEED = ${JSON.stringify(output, null, 2)};\n`;
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
