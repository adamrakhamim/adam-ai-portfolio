import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


ATOM = "http://www.w3.org/2005/Atom"
MEDIA = "http://search.yahoo.com/mrss/"
YT = "http://www.youtube.com/xml/schemas/2015"


def text(element, path):
    child = element.find(path)
    return child.text.strip() if child is not None and child.text else ""


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: parse-youtube-rss.py INPUT_XML OUTPUT_JSON")

    root = ET.parse(sys.argv[1]).getroot()
    entries = []

    for entry in root.findall(f"{{{ATOM}}}entry"):
        video_id = text(entry, f"{{{YT}}}videoId")

        if not video_id:
            continue

        entries.append(
            {
                "id": video_id,
                "title": text(entry, f"{{{ATOM}}}title"),
                "description": text(
                    entry,
                    f"{{{MEDIA}}}group/{{{MEDIA}}}description",
                ),
            }
        )

    Path(sys.argv[2]).write_text(
        json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Parsed RSS metadata for {len(entries)} recent uploads.")


if __name__ == "__main__":
    main()
