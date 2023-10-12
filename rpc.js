import http from 'k6/http';
import { check } from 'k6';

import cmds from './cmds.js'
import {refresh} from './api.js'


function rpc(session,id,payload){
    refresh(session);

    const url = 'http://test.addr/v2/rpc/'+id;
    const params = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.token,
        },
      };
    if (payload == undefined){
        payload = {};
    }
    if (typeof(payload) != 'string') {
        payload = JSON.stringify(payload);
    }
    const res = http.post(url, JSON.stringify(payload), params);
    var sets = {};
    sets[`${id} < 200ms`] = (r) => r.timings.waiting < 200;
    sets[`is status 200`] = (r) => r.status === 200;
    check(res, sets);
    var waite = ("00" + parseInt( res.timings.waiting)).slice(-3)+"ms";
    if (res.status != 200) {
        console.error('rpc=>',waite,id,payload,res.error,res.body);
    }else if(__ENV.LOG) {
        console.info('rpc=>',waite,id,payload,res.error,res.body);
    }else{
        console.debug('rpc=>',waite,id,payload,res.error,res.body);
    }
    var data = res.json();
    if (res.json().payload){
        return JSON.parse(res.json().payload);
    }
    return data;
}


function uid(session,data){
    var equips = session.equips;
    for (const key in equips) {
        if (equips[key].cid != data.cid) {
            continue
        }
        if (data.lvl && equips[key].lvl != data.lvl) {
            continue
        }
        return equips[key].uid;
    }
    return undefined;
}

function uids(session,data){
    var ids = [];
    var equips = session.equips;
    for (const key in equips) {
        if (equips[key].cid == data.cid) {
            ids.push(equips[key].uid);
            if (data.len && ids.length >= data.len){
                break;
            }
        }
    }
    return ids;
}

function map_uids(session,data){
    var ids = {};
    var equips = session.equips;
    for (const key in data.map) {
        var val = data.map[key];
        for (const uid in equips) {
            if (equips[uid].cid == key) {
                ids[uid] = val;
                break;
            }
        }
    }

    return ids;
}

function convert(session,data){
    if (data instanceof Array) {
        var payload = [];
        for (var i = 0; i < data.length; i++) {
            payload.push(convert(session,data[i]));
        }
        return payload;
    }
    if (typeof(data) != 'object') {
        return data;
    }
    if (data.$fun) {
        switch (data.$fun) {
            case 'uid': 
                return uid(session,data);
            case 'uids':
                return uids(session,data);
            case 'map_uids':
                return map_uids(session,data);
            case 'cache':
                return session.cache[data.id][data.key];
            default:
                console.log('unknown fun',data.$fun);
        }
    }
    var payload = {};
    for (const key in data) {
        payload[key] = convert(session,data[key]);
    }
    return payload;
}

export function loop(session){
    if (cmds.length <= session.count){
        return false;
    }
    var cmd = cmds[session.count];
    var payload;
    if (cmd.convert) {
        payload = convert(session,cmd.convert);
    }else{
        payload = cmd.payload;
    }
    session.cache[cmd.id] = rpc(session,cmd.id,payload);
    session.count += 1;
    return true;
}