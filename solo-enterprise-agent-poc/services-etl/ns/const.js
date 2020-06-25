const PROFILE_SLUG = '/api/v1/profile.json';
const NS_DATA_REQUEST_SLUG = '/api/data_request/ns';

const DAILY = '59 23 * * *'; //to run 11:59 PM everynight;
const HOURLY = '*/60 * * * *'; //to run every 60 Minutes;
const PER_MINUTE = '* * * * *'; //to run every Minute;
// https://crontab.guru/

module.exports = {
    PROFILE_SLUG,
    NS_DATA_REQUEST_SLUG,
    DAILY,
    HOURLY,
    PER_MINUTE
}