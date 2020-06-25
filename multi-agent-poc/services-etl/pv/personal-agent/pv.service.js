var fetch = require("node-fetch");
var slug = require("../const");

exports.fetch_workouts = async function (url, sinceTime, accessToken) {
  try {
    let param = 'since=' + sinceTime.getTime();
    let query = url + slug.WORKOUTS_SLUG + '?' + param;
    var headers = { 
        method: 'GET', 
        headers: {
          'Authorization': 'Bearer ' + accessToken, 
          'Accept': 'application/json',
          'Ocp-Apim-Subscription-Key': slug.OCP_APIM_SUBSCRIPTION_KEY
        }
      }
    return await fetch(query, headers)
  } catch (error) {
    console.log(error);
  }
};

exports.fetch_daily_activities = async function (url, startTime, endTime, accessToken) {
    let params = 'startdate=' + startTime.toISOString() + '&enddate=' + endTime.toISOString();
    let query = url + slug.DAILY_ACTIVITY_SLUG + '?' + params;
    var headers = { 
        method: 'GET', 
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Accept': 'application/json',
          'Ocp-Apim-Subscription-Key': slug.OCP_APIM_SUBSCRIPTION_KEY
        }
      }
    return await fetch(query, headers)
};

exports.refresh_token = async function (refreshToken) {
    let param = 'grant_type=refresh_token&client_secret=' + escape(slug.CLIENT_SECRET) + '&client_id=' + slug.CLIENT_ID + '&refresh_token=' + refreshToken;
    let query = slug.OAuthURL + slug.TOKEN_SLUG + '?' + param;
    var headers = { 
        method: 'POST', 
        headers: {
          'Accept': 'application/json'
        }
      }
    let resp = await fetch(query, headers)
    return resp
};