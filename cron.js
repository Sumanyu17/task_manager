const moment = require('moment');
const cron = require('node-cron');
async function startCronJob() {
    console.log('cron job deployed');
    try {
        cron.schedule('*/2 * * * *', async () => {
            console.log('Running cron job...');

            // Find tasks with due dates in the past
            const tasks = await global.databaseConnection.models.tasks.findAll();
            for (task of tasks) {
                let today = moment(new Date())
                let dueDate = moment(task.dueDate)
                let diff = today.diff(dueDate, 'days');
                if (diff !== task.priority) {
                    await global.databaseConnection.models.tasks.update({ priority: diff }, { where: { id: task.id } })
                }
            }
            console.log('Cron job run completed.');
        });
    } catch (error) {
        console.error(error);
    }
}

module.exports = startCronJob;