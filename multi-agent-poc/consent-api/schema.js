'use strict';

exports.access = function(request) {
    let service_id = request.data.service_id
    let data = request.data
    delete data['service_id'];
    return {
        "service_id": service_id, 
        "agent_endpoint": request.agent_endpoint,
        "data_endpoint": "(none)",
        "port": request.port,
        "data": JSON.stringify(data),
        "type": "access"
    };
};

