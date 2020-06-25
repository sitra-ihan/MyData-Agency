var fetch = require("node-fetch");
var slug = require("../const");

exports.fetch_entries = async function (url, dateFrom, dateTo, api_key, size) {
    let param = 'find[dateString][$gte]=' + dateFrom + '&find[dateString][$lte]=' + dateTo;
    let query = url + slug.ENTRIES_SLUG + '?' + param + '&token=' + api_key + '&count=' + size;
    return await fetch(query)
};

exports.fetch_treatments = async function (url, dateFrom, dateTo, api_key, size) {
    let param = 'find[created_at][$gte]=' + dateFrom + '&find[created_at][$lte]=' + dateTo;
    let query = url + slug.TREATMENT_SLUG + '?' + param + '&token=' + api_key + '&count=' + size;
    return await fetch(query)
};

exports.validate_api = async function (url, api_key) {
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