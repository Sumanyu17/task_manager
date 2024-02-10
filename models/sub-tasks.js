const { Sequelize, Model, DataTypes } = require("sequelize");

let checkTaskStatus = async function (updatedSubTask, options) {
  if (updatedSubTask.taskId) {
    var pending = await global.databaseConnection.models.subTasks.findAll({ where: { taskId: updatedSubTask.taskId, status: 0 } })
    var complete = await global.databaseConnection.models.subTasks.findAll({ where: { taskId: updatedSubTask.taskId, status: 1 } })
  }
  let status = "DONE"
  if (pending.length) {
    status = "TODO";
    if (complete.length) {
      status = "IN_PROGRESS";
    }
  }
  await global.databaseConnection.models.tasks.update({ status }, { where: { id: updatedSubTask.taskId } })
  return;
}
const SubTasks = global.databaseConnection.define("subTasks", {
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
},
  {
    paranoid: true,
    hooks: { afterUpdate: checkTaskStatus }
  }
);

SubTasks.belongsTo(global.databaseConnection.models.tasks, {
  foreignKey: 'taskId', onDelete: 'cascade', hooks: true
});

module.exports = SubTasks;