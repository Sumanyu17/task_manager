const { Sequelize, Model, DataTypes } = require("sequelize");


let deleteSubTasks = function(task, options) {
  try {
    let time = new Date();
  global.databaseConnection.models.subTasks.update({deletedAt: time}, {where:{taskId: task.id}}).then((result)=>{
    if(result){
      console.log("associated subTasks Deleted");
    }
    else{
      console.log("failed to delete assocaiated subTasks");
    }
    return;
  });
  return;
  } catch (error) {
    console.log(error);
  }
  
}
const Tasks = global.databaseConnection.define("tasks", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV1,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    required: true
  },
  description: {
    type: DataTypes.STRING(255),
  },
  priority:{
    type: DataTypes.INTEGER,
    required: true
  },
  status: {
    type: DataTypes.STRING(255),
    required: true
  },
  dueDate: {
    type: DataTypes.DATE,
    required: true
  },
},
  {
    paranoid: true,
    hooks: {
      afterUpdate: deleteSubTasks,
      afterDestroy: deleteSubTasks,
  }
}
);
Tasks.belongsTo(global.databaseConnection.models.users, {
  foreignKey: 'userId'
});

module.exports = Tasks;