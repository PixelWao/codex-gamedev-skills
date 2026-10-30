"""Versioned example schema. Independently replace with actual game's schema.
SPDX-License-Identifier: MIT; Copyright (c) 2026 Waldemar Soroka.
"""
import copy
import json
import math

CURRENT_VERSION = 3
MAX_BYTES = 2_000_000
MAX_DEPTH = 32

class SaveValidationError(ValueError):
    pass

class FutureSaveError(SaveValidationError):
    pass


def _unique_pairs(pairs):
    result = {}
    for k, v in pairs:
        if k in result:
            raise SaveValidationError(f'duplicate JSON key: {k}')
        if k in ('__proto__', 'prototype', 'constructor'):
            raise SaveValidationError('forbidden field')
        result[k] = v
    return result


def _reject_constant(value):
    raise SaveValidationError(f'nonfinite JSON value: {value}')


def decode(raw):
    if not isinstance(raw, (bytes, str)):
        raise SaveValidationError('expect UTF-8 JSON bytes or string')
    if len(raw if isinstance(raw, bytes) else raw.encode('utf-8')) > MAX_BYTES:
        raise SaveValidationError('save too large')
    try:
        data = json.loads(raw, object_pairs_hook=_unique_pairs, parse_constant=_reject_constant)
    except (ValueError, UnicodeError, RecursionError) as exc:
        raise SaveValidationError(f'invalid JSON: {exc}') from exc
    _check_structure(data)
    return data


def _check_structure(value, depth=0, counter=None):
    if counter is None:
        counter = [0]
    counter[0] += 1
    if depth > MAX_DEPTH or counter[0] > 50_000:
        raise SaveValidationError('too much nesting or too many elements')
    if value is None or type(value) in (str, bool, int):
        return
    if type(value) is float:
        if not math.isfinite(value):
            raise SaveValidationError('nonfinite number')
        return
    if type(value) is list:
        for item in value:
            _check_structure(item, depth + 1, counter)
        return
    if type(value) is dict:
        for key, item in value.items():
            if type(key) is not str or key in ('__proto__', 'prototype', 'constructor'):
                raise SaveValidationError('invalid JSON key')
            _check_structure(item, depth + 1, counter)
        return
    raise SaveValidationError('non-JSON type')


def validate_v1(data):
    if type(data) is not dict or type(data.get('schemaVersion')) is not int or data['schemaVersion'] != 1:
        raise SaveValidationError('invalid v1 header')
    if type(data.get('health')) is not int or not 0 <= data['health'] <= 1000:
        raise SaveValidationError('invalid health')
    if type(data.get('worldSeed')) is not int or not 0 <= data['worldSeed'] <= 2**53-1:
        raise SaveValidationError('invalid seed')
    if type(data.get('unlocks')) is not list or not all(type(x) is str and 0 < len(x) <= 64 for x in data['unlocks']):
        raise SaveValidationError('invalid unlocks')


def validate_v2(data):
    if type(data) is not dict or type(data.get('schemaVersion')) is not int or data['schemaVersion'] != 2:
        raise SaveValidationError('invalid v2 header')
    if type(data.get('player')) is not dict or type(data['player'].get('hp')) is not int or not 0 <= data['player']['hp'] <= 1000:
        raise SaveValidationError('invalid hp')
    if type(data.get('worldSeed')) is not int or not 0 <= data['worldSeed'] <= 2**53-1:
        raise SaveValidationError('invalid seed')
    if type(data.get('flags')) is not dict or not all(type(k) is str and type(v) is bool for k,v in data['flags'].items()):
        raise SaveValidationError('invalid flags')


def validate_v3(data):
    if type(data) is not dict or type(data.get('schemaVersion')) is not int or data['schemaVersion'] != 3:
        raise SaveValidationError('invalid v3 header')
    player=data.get('player')
    world=data.get('world')
    if type(player) is not dict or type(player.get('hp')) is not int or not 0 <= player['hp'] <= 1000:
        raise SaveValidationError('invalid player')
    if type(world) is not dict or type(world.get('seed')) is not int or not 0 <= world['seed'] <= 2**53-1:
        raise SaveValidationError('invalid seed')
    if type(world.get('generatorVersion')) is not str or not 1 <= len(world['generatorVersion']) <= 64:
        raise SaveValidationError('generatorVersion required')
    edits=world.get('edits')
    if type(edits) is not list or len(edits)>20_000:
        raise SaveValidationError('invalid edits')
    for edit in edits:
        if type(edit) is not dict or type(edit.get('chunk')) is not str or len(edit['chunk'])>80 or type(edit.get('action')) is not str or edit['action'] not in ('place','remove','alter'):
            raise SaveValidationError('invalid world edit')
    flags=data.get('flags')
    if type(flags) is not dict or len(flags)>10_000 or not all(type(k) is str and 0 < len(k)<=64 and type(v) is bool for k,v in flags.items()):
        raise SaveValidationError('invalid flags')
    _check_structure(data)


def v1_to_v2(source):
    validate_v1(source)
    data=copy.deepcopy(source)
    data['player']={'hp':data.pop('health')}
    data['flags']={item:True for item in data.pop('unlocks')}
    data['schemaVersion']=2
    validate_v2(data)
    return data


def v2_to_v3(source):
    validate_v2(source)
    data=copy.deepcopy(source)
    data['world']={'seed':data.pop('worldSeed'),'generatorVersion':'legacy-worldgen-1','edits':[]}
    data['schemaVersion']=3
    validate_v3(data)
    return data

MIGRATIONS={1:v1_to_v2,2:v2_to_v3}
VALIDATORS={1:validate_v1,2:validate_v2,3:validate_v3}


def migrate(source):
    _check_structure(source)
    if type(source) is not dict:
        raise SaveValidationError('root must be object')
    v=source.get('schemaVersion')
    if type(v) is not int or v<1:
        raise SaveValidationError('invalid or missing schemaVersion')
    if v>CURRENT_VERSION:
        raise FutureSaveError(f'future schema {v}, runtime accepts {CURRENT_VERSION}')
    data=copy.deepcopy(source)
    while v<CURRENT_VERSION:
        VALIDATORS[v](data)
        data=MIGRATIONS[v](data)
        v+=1
        if data.get('schemaVersion')!=v:
            raise SaveValidationError('migration did not advance exactly one version')
    validate_v3(data)
    return data


def canonical_json(value):
    _check_structure(value)
    out=json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)
    if len(out.encode('utf-8'))>MAX_BYTES:
        raise SaveValidationError('save too large')
    return out
