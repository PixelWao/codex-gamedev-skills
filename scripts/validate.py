"""Validate metadata and the exact published skill snapshot without running helper code."""
import hashlib
import json
import re
from package_data import ROOT, read_skills, package_files

skills, files = read_skills(), package_files()
catalog = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
manifest = json.loads((ROOT / "MANIFEST.json").read_text(encoding="utf-8"))
if catalog != {"version": 1, "skills": skills}:
    raise SystemExit("Catalog is stale; regenerate after reviewing the skill changes.")
if manifest != {"version": 1, "files": files}:
    raise SystemExit("Package content differs from the reviewed manifest.")
for item in files:
    path = ROOT / item["path"]
    if path.name.startswith(".env") or path.suffix.lower() in {".pem", ".key", ".p12", ".pfx", ".pyc"}:
        raise SystemExit("Unexpected local/credential file in package: " + item["path"])
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    for pattern in [r"(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})", r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", r"\bsk-(?:proj-)?[A-Za-z0-9_-]{35,}"]:
        if re.search(pattern, text):
            raise SystemExit("Credential-shaped text requires review: " + item["path"])
    if re.search(r"[A-Za-z]:[/\\]Users[/\\]", text):
        raise SystemExit("Unexpected private absolute path: " + item["path"])
for required in ["LICENSE", "NOTICE", "README.md"]:
    if not (ROOT / required).is_file():
        raise SystemExit("Missing repository file: " + required)
print(json.dumps({"status": "PASS", "skills": len(skills), "files": len(files), "bytes": sum(f["bytes"] for f in files), "skillsWithUpstreamNotices": sum(s["upstreamNotices"] for s in skills), "manifestSha256": hashlib.sha256((ROOT / "MANIFEST.json").read_bytes()).hexdigest()}))
