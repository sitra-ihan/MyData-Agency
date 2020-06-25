const express = require('express');
const router = express.Router();
const authService = require('./auth.service');
const pool = require('../indy/src/pool');


router.post('/authenticate_user', authenticate_user);
router.post('/update_password', update_password);
router.get('/revoke_jwt', revoke);
router.get('/get_endpoint', getEndpoint);

module.exports = router;

function authenticate_user(req, res, next) {
    authService.authenticate_user(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({
            message: 'Username or password is incorrect'
        }))
        .catch(err => next(err));
}

function update_password(req, res, next) {
    authService.update_password(req.body)
        .then(user => user ? res.json(user).status === 'updated' : res.status(400).json({
            message: 'Invalid username!'
        }))
        .catch(err => next(err));
}

function revoke(req, res, next) {
    authService.revokeToken(req, res).then(response => response ? res.status(200).json({
            message: 'Token invalidated successfully!'
        }) : res.status(400).json({
            message: 'Error! token is still valid'
        }))
        .catch(err => next(err));
}

async function getEndpoint(req, res, next) {
    try {
    let did = await pool.getEndpointForDid(req.query.did);
        res.status(202).send({
            "endpoint": did
        });
    } catch (error) {
        res.status(400).send({
            "error": error
        });
    }
}