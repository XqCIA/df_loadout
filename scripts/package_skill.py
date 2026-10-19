from pathlib import Path
import hashlib
import zipfile

root = Path(__file__).resolve().parents[1]
skill = root / '.agents' / 'skills' / 'delta-loadout'
dist = root / 'dist'
dist.mkdir(exist_ok=True)


def files_under(folder):
    return sorted(p for p in folder.rglob('*') if p.is_file()
                  and '__pycache__' not in p.parts and p.suffix != '.pyc')


def write_zip(name, entries):
    target = dist / name
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as out:
        for file, archive_path in sorted(entries, key=lambda x: x[1]):
            if file.is_symlink():
                raise ValueError(f'Symlink not allowed: {file}')
            info = zipfile.ZipInfo(archive_path, (2026, 10, 18, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            out.writestr(info, file.read_bytes())
    print(target)
    return hashlib.sha256(target.read_bytes()).hexdigest() + '  ' + name + chr(10)


skill_entries = [(p, p.relative_to(skill).as_posix()) for p in files_under(skill)]
skill_entries.append((root / 'DATA-NOTICE.txt', 'DATA-NOTICE.txt'))
sources = [root / name for name in ['README.md', 'package.json', '.gitignore', 'DATA-NOTICE.txt']]
for folder in [skill, root / 'scripts', root / 'tests', root / 'examples', root / 'docs', root / 'web']:
    sources.extend(files_under(folder))
source_entries = [(p, 'delta-loadout-skill/' + p.relative_to(root).as_posix()) for p in sources]
sums = write_zip('delta-loadout-github.zip', source_entries)
sums += write_zip('delta-loadout-skill.zip', skill_entries)
(dist / 'SHA256SUMS').write_text(sums, encoding='utf-8')
