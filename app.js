const path = require("path");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestBody) => {
  return requestBody.status !== undefined && requestBody.priority !== undefined;
};
const hasPriorityProperties = (requestBody) => {
  return requestBody.priority !== undefined;
};
const hasStatusProperties = (requestBody) => {
  return requestBody.status !== undefined;
};
const hasPriorityAndCategoryProperties = (requestBody) => {
  return (
    requestBody.category !== undefined && requestBody.priority !== undefined
  );
};
const hasCategoryAndStatusProperties = (requestBody) => {
  return requestBody.status !== undefined && requestBody.category !== undefined;
};
const hasCategoryProperties = (requestBody) => {
  return requestBody.category !== undefined;
};
const hasSearch_qProperties = (requestBody) => {
  return requestBody.search_q !== undefined;
};

const hasDueDateProperties = (requestBody) => {
  return requestBody.dueDate !== undefined;
};

const outputResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let searchQuery = "";
  let requestQuery = request.query;
  const { status, priority, search_q, category } = request.query;
  switch (true) {
    //SCENARIO 3
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          searchQuery = `SELECT *  FROM todo 
                WHERE status='${status}' AND priority='${priority}';`;
          data = await db.all(searchQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //SCENARIO 1
    case hasStatusProperties(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        searchQuery = `SELECT *  FROM todo 
                WHERE status='${status}';`;
        data = await db.all(searchQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //SCENARIO 2
    case hasPriorityProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        searchQuery = `SELECT *  FROM todo 
                WHERE priority='${priority}';`;
        data = await db.all(searchQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //SCENARIO 4
    case hasSearch_qProperties(request.query):
      searchQuery = `SELECT *  FROM todo 
                WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(searchQuery);
      response.send(data.map((each) => outputResult(each)));
      break;

    //SCENARIO 5
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          searchQuery = `SELECT *  FROM todo 
                WHERE category='${category}' AND status='${status}';`;
          data = await db.all(searchQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //SCENARIO 6
    case hasCategoryProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        searchQuery = `SELECT *  FROM todo 
                WHERE category='${category}';`;
        data = await db.all(searchQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //SCENARIO 7
    case hasPriorityAndCategoryProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          searchQuery = `SELECT *  FROM todo 
                WHERE category='${category}' and priority='${priority}';`;
          data = await db.all(searchQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todoResult = await db.get(getTodoQuery);
  response.send(outputResult(todoResult));
});

//API3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const searchDateQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`;
    const todoDateResult = await db.all(searchDateQuery);
    response.send(todoDateResult.map((each) => outputResult(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  //console.log(request.body);
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          console.log(newDueDate);
          const insertTodoQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date)
            VALUES
            (${id},'${todo}','${priority}','${status}','${category}','${newDueDate}');`;
          await db.run(insertTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let putQuery = "";
  const requestBody = request.body;
  const { status, priority, category, todo, dueDate } = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  switch (true) {
    //Scenario 1
    case requestBody.status !== undefined:
      if (status === "DONE" || status === "IN PROGRESS" || status === "TO DO") {
        putQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',
        status='${status}',category='${category}',due_date='${dueDate}'
            WHERE id=${todoId};`;
        await db.run(putQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //Scenario 2
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        putQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',
        status='${status}',category='${category}',due_date='${dueDate}'
            WHERE id=${todoId};`;
        await db.run(putQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //Scenario 3
    case requestBody.todo !== undefined:
      putQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',
        status='${status}',category='${category}',due_date='${dueDate}'
            WHERE id=${todoId};`;
      await db.run(putQuery);
      response.send("Todo Updated");
      break;
    //Scenario 4
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        putQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',
        status='${status}',category='${category}',due_date='${dueDate}'
            WHERE id=${todoId};`;
        await db.run(putQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Scenario 5
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        putQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',
        status='${status}',category='${category}',due_date='${dueDate}'
            WHERE id=${todoId};`;
        await db.run(putQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);

        response.send("Invalid Due Date");
      }
  }
});

//API 6
app.delete("todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
