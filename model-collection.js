let User = require('./models/users');
let Task = require('./models/tasks');
let SubTasks = require('./models/sub-tasks');

const models = {
  User: User,
  Task: Task,
  SubTasks: SubTasks
}; Task

module.exports = models;