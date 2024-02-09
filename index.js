const express = require('express');
const jwt = require('jsonwebtoken');
const dbStart = require("./dbstart");
const config = require('./env-variables');
const app = express();
const bodyParser = require('body-parser');
const PORT = config.port;
const SECRET_KEY = config.jwtSecret;
const cronJob = require('./cron');
cronJob();
app.use(bodyParser.json());


// Middleware for JWT authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user.userId;
    next();
  });
}

/*Routes Start*/

app.post('/register', async (req, res) => {
  try {
    await validateUserCredentials(req.body);
    const user = await createUser(req.body.phoneNumber, req.body.priority);
    if (user) {
      console.log("User created:", user); // Log the created user
      const token = jwt.sign({ userId: user.id }, SECRET_KEY);
      // res.json({ token });
      res.status(200).json({ token, message: `user with phone ${user.phoneNumber} created successfully` });
    } else {
      console.log("User not created"); // Log if user creation failed
      res.status(400).json({ error: "user not created" });
    }
  } catch (error) {
    console.error("Error registering user:", error); // Log any errors
    res.status(500).json({ error: error.message });
  }
})

app.post('/task', authenticateToken, async (req, res) => {
  try {
    await validateTaskParams(req.body);
    const task = await createTask(req.user, req.body.title, req.body.description, req.body.status, req.body.priority, req.body.dueDate);
    if (task) {
      console.log("task created:", task); // Log the created task
      res.status(200).json({ message: `Task ${task.title} created successfully with id ${task.id}` });
    } else {
      console.log("task not created"); // Log if task creation failed
      res.status(400).json({ error: "task not created" });
    }
  } catch (error) {
    console.error("Error creating task:", error); // Log any errors
    res.status(500).json({ error: error.message });
  }
});

app.put('/task/:id', authenticateToken, async (req, res) => {
  try {
    const task = await updateTask(req.params.id, req.body?.status, req.body?.dueDate);
    if (task) {
      console.log("task updated:", task); // Log the updated task
      res.status(200).json({ message: `Task updated successfully` });
    } else {
      console.log("task not updated"); // Log if task updation failed
      res.status(400).json({ error: "task not updated" });
    }
  } catch (error) {
    console.error("Error updating task:", error); // Log any errors
    res.status(500).json({ error: error.message });
  }
});

app.delete('/task/:id', authenticateToken, async (req, res) => {
  try {
    const task = await deleteTask(req.params.id);
    if (task) {
      console.log("task deleted:", task); // Log the deleted task
      res.status(200).json({ message: `Task deleted successfully` });
    } else {
      console.log("task not deleted"); // Log if task deletion failed
      res.status(400).json({ error: "task not deleted" });
    }
  } catch (error) {
    console.error("Error deleting task:", error); // Log any errors
    res.status(500).json({ error: error });
  }
});

app.post('/sub-task/:id', authenticateToken, async (req, res) => {
  try {
    await validateSubTaskParams(req.params.id, req.body.status)
    const subTask = await createSubTask(req.params.id, req.body.status);
    if (subTask) {
      console.log("subTask created:", subTask); // Log the created subTask
      res.status(200).json({ message: `subTask for taskId- ${subTask.taskId} created successfully with id ${subTask.id}` });
    } else {
      console.log("subTask not created"); // Log if subTask creation failed
      res.status(400).json({ error: "subTask not created" });
    }
  } catch (error) {
    console.error("Error creating subTask:", error); // Log any errors
    res.status(500).json({ error: error.message });
  }
})

app.put('/sub-task/:id', authenticateToken, async (req, res) => {
  try {
    let subTask;
    if (req.params?.id) {
      subTask = await updateSubTask(req.params.id);
    }
    if (subTask) {
      console.log("subTask status update to:", subTask.status); // Log the created subTask
      res.status(200).json({ message: `subTask for taskId- ${subTask.taskId} status updated to ${subTask.status} successfully` });
    } else {
      console.log("subTask not created"); // Log if subTask creation failed
      res.status(400).json({ error: "subTask not created" });
    }
  } catch (error) {
    console.error("Error creating subTask:", error); // Log any errors
    res.status(500).json({ error: error.message });
  }
})

app.delete('/sub-task/:id', authenticateToken, async (req, res) => {
  try {
    let subTask;
    if (req.params?.id) {
      subTask = await deleteSubTask(req.params.id);
    }
    if (subTask) {
      console.log("subTask status delete to:", subTask.status); // Log the created subTask
      res.status(200).json({ message: `subTask with- ${subTask.id} status deleted successfully` });
    } else {
      console.log("subTask not deleted"); // Log if subTask deletion failed
      res.status(400).json({ error: "subTask not deleted" });
    }
  } catch (error) {
    console.error("Error deleting subTask:", error); // Log any errors
    res.status(500).json({ error: error.message });
  }
})

/* Routes END */

/* Utility functions for routes BEGIN*/


/**Validation functions */
function validateUserCredentials(body) {
  return new Promise(function (resolve, reject) {
    try {
      if (!body?.phoneNumber) {
        throw new Error("Please enter username")
      }
      if (body?.priority == undefined) {
        throw new Error("Please enter password")
      }
      resolve(body);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}



function validateTaskParams(body) {
  return new Promise(function (resolve, reject) {
    try {
      if (!body?.title) {
        throw new Error("Please enter title")
      }
      if (!body?.description) {
        throw new Error("Please enter description")
      }
      if (!body?.status) {
        throw new Error("Please enter status")
      }
      if (body?.priority === undefined) {
        throw new Error("Please enter priority")
      }
      if (!body?.dueDate) {
        throw new Error("Please enter dueDate")
      }
      resolve();
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

function validateSubTaskParams(id, status) {
  return new Promise(function (resolve, reject) {
    try {
      if (!id) {
        throw new Error("Please provide parent taskId")
      }
      if (status === undefined) {
        throw new Error("Please enter subtask status")
      }
      resolve();
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

/**Crud functions */
function createUser(phoneNumber, priority) {
  return new Promise(function (resolve, reject) {
    global.databaseConnection.models.users.create({
      phoneNumber,
      priority
    }).then(function (result) {
      if (result) {
        let user = result.dataValues;
        resolve(user);
        return;
      }
      else {
        reject();
        return;
      }
    }).catch(function (err) {
      reject(err);
      return;
    })
  })
}

function createTask(currentUser, title, description, status, priority, dueDate) {
  return new Promise(function (resolve, reject) {
    global.databaseConnection.models.tasks.create({
      userId: currentUser, title,
      description, status, priority, dueDate
    }).then(function (result) {
      if (result) {
        let task = result.dataValues;
        resolve(task);
        return;
      }
      else {
        reject();
        return;
      }
    }).catch(function (err) {
      reject(err);
      return;
    })
  })
}

function createSubTask(taskId, status) {
  return new Promise(function (resolve, reject) {
    global.databaseConnection.models.subTasks.create({ taskId, status }).then(function (result) {
      if (result) {
        let subTask = result.dataValues;
        resolve(subTask);
        return;
      }
      else {
        reject();
        return;
      }
    }).catch(function (err) {
      reject(err);
      return;
    })
  })
}


function updateTask(id, status, dueDate) {
  return new Promise(function (resolve, reject) {
    let updateObject = {};
    if (status) {
      updateObject.status = status;
    }
    if (dueDate) {
      updateObject.dueDate = dueDate;
    }
    global.databaseConnection.models.tasks.update(updateObject, { where: { id: id } })
      .then(function (result) {
        if (result) {
          let task = result[0];
          resolve(task);
          return;
        }
        else {
          reject();
          return;
        }
      }).catch(function (err) {
        reject(err);
        return;
      })
  })
}

function deleteTask(id) {
  return new Promise(function (resolve, reject) {
    global.databaseConnection.models.tasks.destroy({ where: { id: id } })
      .then(function (result) {
        if (result) {
          let task = result[0];
          resolve(task);
          return;
        }
        else {
          reject();
          return;
        }
      }).catch(function (err) {
        reject(err);
        return;
      })
  })
}
function updateSubTask(subTaskId) {
  return new Promise(function (resolve, reject) {
    global.databaseConnection.models.subTasks.findByPk(subTaskId).then(function (subTask) {
      if (subTask) {
        return subTask.update({ status: !subTask.status });
      }
      else reject(new Error("subTask to be updated not found"));
      return;
    }).then(function (updateResult) {
      resolve(updateResult);
      return;
    }).catch(function (err) {
      reject(err);
      return;
    })
  })
}

function deleteSubTask(subTaskId) {
  return new Promise(function (resolve, reject) {
    global.databaseConnection.models.subTasks.findByPk(subTaskId).then(function (subTask) {
      if (subTask) {
        return subTask.destroy();
      }
      else reject(new Error("subTask to be deleted not found"));
      return;
    }).then(function (deleteResult) {
      resolve(deleteResult);
      return;
    }).catch(function (err) {
      reject(err);
      return;
    })
  })
}

/* Utility functions for routes END*/

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});