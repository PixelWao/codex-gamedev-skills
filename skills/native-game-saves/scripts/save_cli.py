"""Explicit demo CLI. Never silently overwrite an existing save."""
import argparse
import json
import sys
from pathlib import Path
from native_save_store import NativeSaveStore,SaveError


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--dir',required=True,type=Path)
    p.add_argument('--supported-schema',type=int,default=3)
    sub=p.add_subparsers(dest='command',required=True)
    write=sub.add_parser('write');write.add_argument('slot');write.add_argument('--file',required=True,type=Path);write.add_argument('--expected-revision',type=int,required=True)
    read=sub.add_parser('read');read.add_argument('slot');read.add_argument('--no-backup',action='store_true')
    sub.add_parser('list')
    verify=sub.add_parser('verify');verify.add_argument('slot')
    a=p.parse_args()
    try:
        s=NativeSaveStore(a.dir,a.supported_schema)
        if a.command=='list':result={'slots':s.list_slots()}
        elif a.command=='write':result=s.write(a.slot,json.loads(a.file.read_text(encoding='utf-8')),expected_revision=a.expected_revision)
        else:
            loaded=s.load(a.slot,allow_backup=not getattr(a,'no_backup',False))
            if loaded is None:raise SaveError('save does not exist')
            result={'state':loaded['state'],'revision':loaded['revision'],'source':loaded['source']} if a.command=='read' else {'verified':True,'revision':loaded['revision'],'source':loaded['source']}
        print(json.dumps(result,ensure_ascii=False,indent=2))
    except (OSError,ValueError,TypeError) as exc:
        print(json.dumps({'error':str(exc),'type':type(exc).__name__}),file=sys.stderr)
        sys.exit(2)

if __name__=='__main__':main()
