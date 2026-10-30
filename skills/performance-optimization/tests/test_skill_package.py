# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Waldemar Soroka
"""Basic repository-level integrity checks for the portable skill."""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class PackageChecks(unittest.TestCase):
    def test_frontmatter_and_single_manifest(self):
        manifests = list(ROOT.rglob('SKILL.md'))
        self.assertEqual(manifests, [ROOT / 'SKILL.md'])
        data = manifests[0].read_text(encoding='utf-8')
        self.assertTrue(data.startswith('---\n'))
        header = data.split('---', 2)[1]
        self.assertRegex(header, r'(?m)^name: performance-optimization$')
        self.assertRegex(header, r'(?m)^description: >-$')
        for key in ('Three.js', 'Canvas 2D', 'Godot', 'Unity', 'Unreal'):
            self.assertIn(key, data)

    def test_local_markdown_links_exist(self):
        for path in ROOT.rglob('*.md'):
            contents = path.read_text(encoding='utf-8')
            for match in re.findall(r'(?<![\w/])(?:references|assets|scripts)/[\w./-]+', contents):
                candidate = ROOT / match
                self.assertTrue(candidate.exists(), f'{path}: bad link {match}')

    def test_license_and_notice_present(self):
        self.assertTrue((ROOT / 'LICENSE').is_file())
        self.assertIn('MIT License', (ROOT / 'LICENSE').read_text())
        self.assertIn('Waldemar Soroka', (ROOT / 'LICENSE').read_text())
        self.assertTrue((ROOT / 'NOTICE').is_file())
        self.assertTrue((ROOT / 'THIRD_PARTY_NOTICES.md').is_file())
        self.assertIn('Apache License', (ROOT / 'LICENSES' / 'APACHE-2.0.txt').read_text())


if __name__ == '__main__':
    unittest.main()
