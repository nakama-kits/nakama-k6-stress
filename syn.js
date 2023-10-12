function notifications(session, notifications){
    for (var i = 0; i < notifications.length; i++) {
        var notification = notifications[i];
        var preLogs = "<=";
        switch (notification.subject) {
            case 'EquipUpdate':
                var equips = JSON.parse(notification.content);
                for (const key in equips) {
                    session.equips[key] = JSON.parse(equips[key]);
                }
                break;
            case 'WalletUpdate':
                var wallets = JSON.parse(notification.content);
                for (const key in wallets) {
                    session.wallet[key] = wallets[key];
                }
                break;
            default:
                preLogs = "==";
                break;
        }
        if(__ENV.LOG) {
            console.info('ntc'+preLogs, notification.subject, notification.content)
        }else{
            console.debug('ntc'+preLogs, notification.subject, notification.content)
        }

    }
}

export function receive(session,message){
    message = JSON.parse(message);
    if (message.notifications){
        notifications(session, message.notifications.notifications);
        return;
    }
    console.warn('msg**', message)
}