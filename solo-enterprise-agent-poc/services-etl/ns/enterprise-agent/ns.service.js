var fetch = require("node-fetch");
var slug = require("../const");

exports.validate_api = function (url, api_key) {
    let query = url + slug.PROFILE_SLUG + '?token=' + api_key;
    try {
        return fetch(query)
            .then(response => response.json())
            .then(data => {
                if (data['status'] == '401') {
                    return false;
                } else if (data[0]['_id'] != '') {
                    return true;
                } else {
                    return false;
                }
            })
            .catch(error => {
                console.log(error);
                return false;
            })
    } catch (ex) {
        return false;
    }
}