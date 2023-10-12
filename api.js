import http from 'k6/http';
import encoding from 'k6/encoding';
import { check } from 'k6';

export function login(id) {
    const url = 'http://test.addr/v2/account/authenticate/device';
    const payload = JSON.stringify({
      id: id
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + encoding.b64encode('defaultkey:'),
      },
    };
    const res = http.post(url, payload, params);
    check(res, {
        'is status 200': (r) => r.status === 200,
    });
    return res.json();
}

export function refresh(session) {
    if (session.time + 50 >= Date.now() / 1000) {
        return;
    }
    session.time = Date.now() / 1000;
    const url = 'http://test.addr/v2/account/session/refresh';
    const payload = JSON.stringify({
      token:session.refresh_token 
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + encoding.b64encode('defaultkey:'),
      },
    };
    const res = http.post(url, payload, params);
    check(res, {
        'is status 200': (r) => r.status === 200,
    });
    session.token = res.json().token;
}

export function account(session) {
    const url = 'http://test.addr/v2/account';
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.token,
      },
    };
    const res = http.get(url, params);
    check(res, {
        'is status 200': (r) => r.status === 200,
    });
    var data = res.json();
    session.user = data.user;
    session.wallet = JSON.parse(data.wallet);
    return data;
}

export function storage(session,collection) {
    var objects = {};
    var cursor = '';
    do {
        const url = `http://test.addr/v2/storage/${collection}/${session.user.id}?limit=100&cursor=${cursor}`;
        const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.token,
        },
        };
        const res = http.get(url, params);
        check(res, {
            'is status 200': (r) => r.status === 200,
        });
        var data = res.json();
        if (!data.objects){
            break;
        }
        for (var i = 0; i < data.objects.length; i++) {
            var object = data.objects[i];
            objects[object.key] = JSON.parse(object.value);
        }
        cursor = data.cursor || '';
    } while (cursor != '');
    return objects;
}