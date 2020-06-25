var fetch = require("node-fetch");

exports.propogate_consent_meta_webhoook = async function (url, body) {
    let query = url;
    try {
        let authResponse = await fetch(query, {
            method: 'post',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        });
    
        let resp = await authResponse.json();
        return resp.data;
    } catch (ex) {
        console.error(ex.message);
        return {
            "status": 400,
            "message": ex
        };
    }
}