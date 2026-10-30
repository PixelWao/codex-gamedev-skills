"""Audit synthetic or anonymized shipped fixtures according to a manifest."""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from schema_pipeline import decode,migrate,canonical_json,SaveValidationError


def audit(root,manifest_path):
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    if type(manifest.get('cases')) is not list or not manifest['cases']:
        raise ValueError('manifest needs nonempty cases')
    results=[]
    for case in manifest['cases']:
        name=case['file']
        if not isinstance(name,str) or name.startswith('/') or '/' in name or '\\' in name or name.startswith('.'):
            raise ValueError('fixture path must be a simple filename')
        raw=(root/name).read_bytes()
        source_hash=hashlib.sha256(raw).hexdigest()
        try:
            migrated=migrate(decode(raw))
            migrated2=migrate(decode(raw))
            if canonical_json(migrated)!=canonical_json(migrated2):
                raise ValueError('nondeterministic migration')
            passed=True
            reason='ok'
            normalized_hash=hashlib.sha256(canonical_json(migrated).encode('utf-8')).hexdigest()
        except (ValueError,TypeError,RecursionError) as exc:
            passed=False;reason=f'{type(exc).__name__}: {exc}';normalized_hash=None
        expected=case['expected']=='accept'
        results.append({'file':name,'expected':case['expected'],'accepted':passed,'pass':passed==expected,'reason':reason,'sourceSha256':source_hash,'normalizedSha256':normalized_hash})
    return {'tool':'save-schema-migrations-qa','cases':len(results),'passed':sum(r['pass'] for r in results),'results':results}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--manifest',required=True,type=Path)
    parser.add_argument('--root',required=True,type=Path)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    report=audit(args.root,args.manifest)
    output=json.dumps(report,indent=2,ensure_ascii=False)+'\n'
    if args.output: args.output.write_text(output,encoding='utf-8')
    else: print(output,end='')
    sys.exit(0 if report['cases']==report['passed'] else 1)

if __name__=='__main__':main()
