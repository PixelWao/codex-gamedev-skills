"""Single-process native save example. SPDX-License-Identifier: MIT.
Copyright (c) 2026 Waldemar Soroka.

No built-in cross-process mutex. Add platform locks/service for multiple writers.
"""
import hashlib
import json
import math
import os
import re
import tempfile
from pathlib import Path

SLOT_PATTERN=re.compile(r'^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$')
MAX_BYTES=4_000_000

class SaveError(ValueError):
    pass
class SaveConflictError(SaveError):
    pass
class SaveCorruptError(SaveError):
    pass
class FutureSaveError(SaveError):
    pass


def _bounded_tree(value,depth=0,counter=None):
    if counter is None: counter=[0]
    counter[0]+=1
    if depth>32 or counter[0]>50_000:raise SaveError('save nesting/element count exceeded')
    if value is None or type(value) in (str,bool,int):return
    if type(value) is float:
        if not math.isfinite(value):raise SaveError('nonfinite number')
        return
    if type(value) is list:
        for x in value:_bounded_tree(x,depth+1,counter)
        return
    if type(value) is dict:
        for k,v in value.items():
            if type(k) is not str or k in ('__proto__','constructor','prototype'):raise SaveError('invalid object key')
            _bounded_tree(v,depth+1,counter)
        return
    raise SaveError('state contains non-JSON value')


def _canonical(data):
    _bounded_tree(data)
    return json.dumps(data,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode('utf-8')


def _no_duplicates(pairs):
    d={}
    for k,v in pairs:
        if k in d:raise SaveCorruptError('duplicate JSON key')
        if k in ('__proto__','constructor','prototype'):raise SaveCorruptError('unsafe JSON key')
        d[k]=v
    return d


def _invalid_constant(value):raise SaveCorruptError('nonfinite JSON constant')


def _decode(raw):
    if len(raw)>MAX_BYTES:raise SaveCorruptError('too many bytes')
    try:return json.loads(raw,object_pairs_hook=_no_duplicates,parse_constant=_invalid_constant)
    except (ValueError,UnicodeError,RecursionError) as exc:raise SaveCorruptError(f'invalid JSON: {exc}') from exc


def _check_slot(slot):
    if not isinstance(slot,str) or not SLOT_PATTERN.fullmatch(slot):raise SaveError('unsafe slot name')


def _fsync_directory(path):
    if os.name!='posix':return False
    try:
        fd=os.open(str(path),os.O_RDONLY | getattr(os,'O_DIRECTORY',0))
        try:os.fsync(fd)
        finally:os.close(fd)
        return True
    except OSError:return False


def _atomic_replace_bytes(destination,raw):
    """Write adjacent temp, fsync, replace. Directory fsync best effort."""
    fd=None;temporary=None
    try:
        fd,temporary=tempfile.mkstemp(prefix=f'.{destination.name}.tmp-',dir=destination.parent)
        with os.fdopen(fd,'wb') as stream:
            fd=None;stream.write(raw);stream.flush();os.fsync(stream.fileno())
        os.replace(temporary,destination)
        temporary=None
        _fsync_directory(destination.parent)
    finally:
        if fd is not None:os.close(fd)
        if temporary is not None:
            try:os.unlink(temporary)
            except FileNotFoundError:pass


class NativeSaveStore:
    def __init__(self,base_dir,supported_schema_version=3):
        self.root=Path(base_dir)
        self.supported=supported_schema_version
        self.root.mkdir(parents=True,exist_ok=True)
        if not self.root.is_dir():raise SaveError('save directory is not a directory')
        if type(supported_schema_version) is not int or supported_schema_version<1:raise SaveError('invalid schema')

    def _path(self,slot,backup=False):
        _check_slot(slot)
        return self.root/f'save_{slot}{".bak" if backup else ""}.json'

    def _read_one(self,path):
        raw=path.read_bytes()
        record=_decode(raw)
        if type(record) is not dict or record.get('format')!='native-game-save-v1':raise SaveCorruptError('unknown file format')
        revision=record.get('revision')
        state=record.get('state')
        if type(revision) is not int or revision<1 or type(state) is not dict:raise SaveCorruptError('invalid revision/state')
        try:state_json=_canonical(state)
        except (SaveError,RecursionError) as exc:raise SaveCorruptError(str(exc)) from exc
        if record.get('sha256')!=hashlib.sha256(state_json).hexdigest():raise SaveCorruptError('checksum mismatch')
        version=state.get('schemaVersion')
        if type(version) is not int or version<1:raise SaveCorruptError('invalid schema version')
        if version>self.supported:raise FutureSaveError(f'save schema {version} > supported {self.supported}')
        return {'state':state,'revision':revision,'path':str(path),'source':'backup' if '.bak.json' in path.name else 'primary'}

    def load(self,slot,allow_backup=True):
        primary=self._path(slot)
        backup=self._path(slot,True)
        if not primary.exists() and not backup.exists():return None
        if primary.exists():
            try:return self._read_one(primary)
            except FutureSaveError:raise
            except (SaveCorruptError,OSError):
                if not allow_backup or not backup.exists():raise
        if not allow_backup or not backup.exists():raise SaveCorruptError('primary unavailable')
        return self._read_one(backup)

    def write(self,slot,state,expected_revision=0,fault_hook=None):
        """Single writer only; fault_hook is for deterministic exception injection in tests."""
        primary=self._path(slot)
        backup=self._path(slot,True)
        if type(expected_revision) is not int or expected_revision<0:raise SaveError('invalid expected revision')
        if type(state) is not dict or type(state.get('schemaVersion')) is not int or state['schemaVersion']<1:raise SaveError('schemaVersion required')
        if state['schemaVersion']>self.supported:raise FutureSaveError('unsupported future schema')
        raw_state=_canonical(state)
        old=None
        if primary.exists():
            old=self._read_one(primary)  # fail closed if corrupt or future save; don't rotate bad data
        current=old['revision'] if old is not None else 0
        if current!=expected_revision:raise SaveConflictError(f'expected {expected_revision}, on disk {current}')
        revision=current+1
        record={'format':'native-game-save-v1','revision':revision,'state':state,'sha256':hashlib.sha256(raw_state).hexdigest()}
        raw=_canonical(record)
        if len(raw)>MAX_BYTES:raise SaveError('save too large')
        if old is not None:
            _atomic_replace_bytes(backup,primary.read_bytes())
        if fault_hook:fault_hook('after_backup')
        # No target modification is performed until replacement of the primary.
        fd=None;temp=None
        try:
            fd,temp=tempfile.mkstemp(prefix=f'.{primary.name}.tmp-',dir=self.root)
            with os.fdopen(fd,'wb') as stream:
                fd=None;stream.write(raw);stream.flush();os.fsync(stream.fileno())
            if fault_hook:fault_hook('before_replace')
            os.replace(temp,primary)
            temp=None
            _fsync_directory(self.root)
        finally:
            if fd is not None:os.close(fd)
            if temp is not None:
                try:os.unlink(temp)
                except FileNotFoundError:pass
        return {'slot':slot,'revision':revision,'bytes':len(raw)}

    def list_slots(self):
        result=[]
        for file in self.root.glob('save_*.json'):
            if file.name.endswith('.bak.json'):continue
            slot=file.name[5:-5]
            if SLOT_PATTERN.fullmatch(slot):result.append(slot)
        return sorted(result)
