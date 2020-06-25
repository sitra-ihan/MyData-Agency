var store = require("./store");

// Collections
var user_db = store.user_db;
// var users = user_db.addCollection('users');
const rsa = require("../keys/rsa");

module.exports = {
  add_user: async function add_user(
    user_id,
    first_name,
    last_name,
    email,
    username,
    password
  ) {
    try {
      var users = user_db.getCollection("users");
      await users.insert({
        user_id: user_id,
        first_name: first_name,
        last_name: last_name,
        email: email,
        username: username,
        password: password
      });
      await user_db.saveDatabase();
      return true;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  update_password: function update_password(username, newPassword) {
    try {
      var users = user_db.getCollection("users");
      let result = users.where(function(obj) {
        return obj.username === username;
      });
      result[0].password = newPassword;
      users.update(result[0]);
      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  },

  validate_user: async function validate_user(username, password) {
    try {
      var users = await user_db.getCollection("users");
      let results = await users.where(function(obj) {
        return (
          obj.username === username &&
          rsa.decryptMessage(obj.password) === password
        );
      });
      var output = {
        user_id: results[0].user_id,
        first_name: results[0].first_name,
        last_name: results[0].last_name,
        email: results[0].email
      };
      return output;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
};
