const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
intializeDbAndServer();

// check Query Parameters Middleware function
const checkRequestQueries = async (request, response, next) => {
  const { priority, status, category, search_q, date } = request.query;
  if (priority !== undefined) {
    const priorityValues = ["HIGH", "MEDIUM", "LOW"];
    if (priorityValues.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
    if (statusValues.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    const categoryValues = ["WORK", "HOME", "LEARNING"];
    if (categoryValues.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const dueDate = new Date(date);
      const formateDate = format(dueDate, "yyyy-MM-dd");
      const result = toDate(new Date(formateDate));
      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formateDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.search_q = search_q;
  next();
};

// Check requestBody middleWare function
const checkRequestBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  if (priority !== undefined) {
    const priorityValues = ["HIGH", "MEDIUM", "LOW"];
    if (priorityValues.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
    if (statusValues.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (category !== undefined) {
    const categoryValues = ["WORK", "HOME", "LEARNING"];
    if (categoryValues.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formateDate = format(myDate, "yyyy-MM-dd");
      const result = toDate(new Date(formateDate));
      const isValidDate = isValid(result);
      if (isValidDate === true) {
        request.date = formateDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;
  next();
};

// GET Todos API
app.get("/todos/", checkRequestQueries, async (request, response) => {
  const { status = "", search_q = "", priority = "", category = "" } = request;
  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
        FROM 
            todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const todosArray = await db.all(getTodosQuery);
  response.send(todosArray);
});

// GET todo of specific todo_id API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM todo WHERE id = ${todoId}`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

// GET Agenda API
app.get("/agenda/", checkRequestQueries, async (request, response) => {
  const { date } = request;
  const getAgendaQuery = `SELECT id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate FROM todo
        WHERE due_date LIKE '${date}';`;
  const agenda = await db.all(getAgendaQuery);
  response.send(agenda);
});

// POST (CREATE) todo API
app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, date } = request;
  const createUserQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date)
  VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${date}');`;
  await db.run(createUserQuery);
  response.send("Todo Successfully Added");
});

// PUT todo of specific todo_id API
app.put("/todos/:todoId/", checkRequestBody, async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, date } = request;
  let updateTodoQuery = "";
  switch (true) {
    case todo !== undefined:
      updateTodoQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case status !== undefined:
      updateTodoQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case category !== undefined:
      updateTodoQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
      break;
    case date !== undefined:
      updateTodoQuery = `UPDATE todo SET due_date = '${date}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
      break;
  }
});

//Delete Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
