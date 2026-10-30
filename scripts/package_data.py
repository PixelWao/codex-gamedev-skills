"""Read the actual package metadata; no project-specific dependency imports."""
from pathlib import Path
import hashlib
import re
import yaml

ROOT = Path(__file__).resolve().parents[1]

def read_skills():
    result = []
    for entry in sorted((ROOT / "skills").glob("*/SKILL.md")):
        text = entry.read_text(encoding="utf-8")
        match = re.match(r"^---\r?\n(.*?)\r?\n---(?:\r?\n|$)", text, re.S)
        if not match:
            raise ValueError(f"Missing YAML frontmatter: {entry.relative_to(ROOT)}")
        data = yaml.safe_load(match.group(1))
        if not isinstance(data, dict):
            raise ValueError(f"Invalid frontmatter: {entry.relative_to(ROOT)}")
        name, description = data.get("name"), data.get("description")
        if not isinstance(name, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name) or len(name) > 64:
            raise ValueError(f"Invalid skill name: {entry.relative_to(ROOT)}")
        if name != entry.parent.name or not isinstance(description, str) or not description.strip():
            raise ValueError(f"Name/description mismatch: {entry.relative_to(ROOT)}")
        if len(description) > 1024 or "<" in description or ">" in description:
            raise ValueError(f"Invalid description: {name}")
        if not (entry.parent / "LICENSE").is_file():
            raise ValueError(f"Missing skill license: {name}")
        upstream = entry.parent / "attribution/upstream"
        if upstream.exists() and not all((upstream / n).is_file() for n in ["LICENSE", "NOTICE"]):
            raise ValueError(f"Incomplete upstream notices: {name}")
        result.append({"name": name, "description": description.strip(), "path": entry.parent.relative_to(ROOT).as_posix(), "upstreamNotices": upstream.exists()})
    if not result:
        raise ValueError("No skills found")
    return result

def package_files():
    result = []
    for path in sorted((ROOT / "skills").rglob("*")):
        if not path.is_file() or "__pycache__" in path.parts or path.suffix == ".pyc":
            continue
        if path.is_symlink():
            raise ValueError("Symlinks are not part of this snapshot")
        path.resolve().relative_to(ROOT / "skills")
        data = path.read_bytes()
        result.append({"path": path.relative_to(ROOT).as_posix(), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    return result
