import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

import {login,account,storage} from './api.js'
import {loop} from './rpc.js'
import {receive} from './syn.js'

 //30s 人数从0到100，60s保持100人，30s人数从100到0
export const options = {
    // hosts: { 'test.addr': '129.146.89.155:7350' },
    // hosts: { 'test.addr': '192.168.0.45:7350' },
    hosts: { 'test.addr': '127.0.0.1:7350' },
};

function websocket(session){
    const url = `ws://test.addr/ws?lang=en&status=${encodeURIComponent('false')}&token=${encodeURIComponent(session.token)}`;
    const res = ws.connect(url, function (socket) {
        socket.on('open', () => {
            console.log(session.user.id,'connected');
            session.count = 0;
            session.cache = {}
            socket.setInterval(function timeout() {
                if (!loop(session)){
                    socket.close();
                }
            }, 1000);
        });
        socket.on('message', (data) => receive(session,data));
        socket.on('close', () => console.log(session.user.id,'disconnected'));
    });
  
    check(res, { 'is status 101': (r) => r && r.status === 101 });
}

export default function () {
    const randomUUID = uuidv4();
    //登录验证
    const session = login(randomUUID);
    //获取用户信息
    sleep(1);
    account(session);
    //获取用户背包
    sleep(1);
    session.equips = storage(session,'InventoryEquip');
    //获取用户各个功能数据
    sleep(1);
    session.data = storage(session,'user');
    console.debug('session=>',session);
    websocket(session);
}
