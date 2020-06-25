const CronJobManager = require('cron-job-manager');
var cronJobManager = new CronJobManager(); // Make it singleton

// exports.getManager = () => {
//     if (manager == null) {
//         return new CronJobManager();
//     } else {
//         return manager;
//     }
// };

exports.manager = () => {
    return cronJobManager;
};

exports.startJob = (id) => {
    cronJobManager.start(id);
};

exports.stopJob = (key) => {
    cronJobManager.stop(key);
};

exports.stopAllJobs = () => {
    cronJobManager.stopAll();
};

exports.deleteJob = (key) => {
    cronJobManager.deleteJob(key);
}

exports.listJobs = () => {
    return cronJobManager.listCrons();
}

exports.jobExists = (key) => {
    if (cronJobManager.exists(key)) {
        return true;
    } else {
        return false;
    }
}