import {
  serialize,
  populate,
  resetAllFormFields,
  validate,
  renderUI,
  noTodosMessage,
  createTodoListItem
} from './utils.js'

import TodoApp from "./classes/todo-app.js";

const jamesTodosApp = new TodoApp({ owner: "James" });

const listElement = document.getElementById("todos-list");
const addForm = document.forms["add-todo-form"];
const updateForm = document.forms["update-todo-form"];

const toastElement = document.getElementById("toast");
const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
const toadtBody = toastElement.querySelector(".toast-body"); // to write in

const renderOptions = {
  fn: function ({todos, owner}) {
    return renderUI({ 
      todos, 
      owner,
      listElement,
    });
  },
};

if (listElement) {
  // Render List
  jamesTodosApp.render(renderOptions);


  // Bind Buttons
  listElement.addEventListener("click", (e) => {
    // See what was clicked
    const { target: clickedElement } = e;
    // console.log(clickedElement);

    // Bail if not a button we know how to handle
    if (!clickedElement?.matches?.("button.update, button.remove, button.done"))
      return;

    const { id, done } = clickedElement.dataset;

    const oldLi = clickedElement.closest("li.todo-listing");

    if (clickedElement?.matches?.(".remove")) {
      // Call memory manager
      jamesTodosApp.removeTodo(id);

      // Remove item from list
      const list = oldLi.closest("ol,ul");
      oldLi.remove();


      console.log(list);
      console.log(list.children.length);
      const todoItemElements = list.children.length;

      // DOM Micro-management to show noTodosMessage (which you imported above from utils, right?!)
      if (!todoItemElements) {
        list.after(noTodosMessage);
      } else {
        noTodosMessage.remove();
      }
    } else if (clickedElement?.matches?.(".done")) {
      console.log("done in delegated ", done);
      if (JSON.parse(done)) {
        // turns "true" (string) into true (boolean)
        jamesTodosApp.markAsUndone(id);
      } else {
        jamesTodosApp.markAsDone(id);
      }
      const todoData = jamesTodosApp.getTodoById(id); // id
      const updatedLi = createTodoListItem({ todo: todoData });
      console.log(todoData);
      oldLi.replaceWith(updatedLi);
    }
  });
}


if (addForm) {
  addForm.addEventListener("reset", (e) => {
    // reset (inc. hidden fields)
    resetAllFormFields(e.target);
  });

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { target: form } = e;

    // Get the data
    const data = serialize(form);

     // correct the done value
    if (!("done" in data) || !data.done) {
      data.done = false;
    } else if (data.done === "done") {
      // Checked (gives name if name, or 'on' if not)
      data.done = true;
    }

    console.log("data", data);

    jamesTodosApp.createTodo(data);

    // reset form fields
    resetAllFormFields(form);

    toadtBody.textContent = `${data.title} created`;
    toast.show();

    // location.assign("/");
  });


  const submitBtn = addForm.querySelector('[type="submit"]');
  submitBtn.setAttribute("disabled", "disabled");

  const constrolSubmitButton = (e) => {
    console.log("form input");
    if (addForm.matches(":valid")) {
      console.log("valid");
      submitBtn.removeAttribute("disabled");
    } else {
      console.log("invalid");
      submitBtn.setAttribute("disabled", "disabled");
    }
  };

  addForm.addEventListener("input", constrolSubmitButton);

  addForm.addEventListener("change", constrolSubmitButton);

  const titleField = addForm["title"];
  const durationField = addForm["duration"];

  titleField.addEventListener("input", (e) => {
    validate(titleField);
  });
  titleField.addEventListener("change", (e) => {
    validate(titleField);
  });

  durationField.addEventListener("input", (e) => {
    validate(durationField);
  });
  durationField.addEventListener("change", (e) => {
    validate(durationField);
  });
}

if (updateForm) {
  updateForm.addEventListener("reset", (e) => {
    // reset (inc. hidden fields)
    resetAllFormFields(e.target);
  });

  updateForm.addEventListener("submit", (e) => {
    // Stop the submit
    e.preventDefault();

    // Extract refernce to form (to avoid repeated lookup with e.target)
    const { target: form } = e;

    // Get the data
    const todoData = serialize(form);

    // Get _id and rest of data separately
    const { _id, ...data } = todoData;

    console.log("_id", _id);
    console.log("pre data", data);

    // Deal with the done checkbox

    // Indeterminate or cleared
    if (!("done" in data) || !data.done) {
      data.done = false;
    } else if (data.done === "done") {
      // Checked (gives name if name, or 'on' if not)
      data.done = true;
    }

    console.log("post data", data);
    jamesTodosApp.updateTodo(_id, data);

    // reset form fields
    // resetAllFormFields(form);

    toadtBody.textContent = `${data.title} updated`;
    toast.show();

    // location.assign("/");
  });

  const submitBtn = updateForm.querySelector('[type="submit"]');
  submitBtn.setAttribute("disabled", "disabled");

  const constrolSubmitButton = (e) => {
    console.log("form input");
    if (updateForm.matches(":valid")) {
      console.log("valid");
      submitBtn.removeAttribute("disabled");
    } else {
      console.log("invalid");
      submitBtn.setAttribute("disabled", "disabled");
    }
  };

  updateForm.addEventListener("input", constrolSubmitButton);

  updateForm.addEventListener("change", constrolSubmitButton);

  const titleField = updateForm["title"];
  const durationField = updateForm["duration"];

  titleField.addEventListener("input", (e) => {
    validate(titleField);
  });
  titleField.addEventListener("change", (e) => {
    validate(titleField);
  });

  durationField.addEventListener("input", (e) => {
    validate(durationField);
  });
  durationField.addEventListener("change", (e) => {
    validate(durationField);
  });

  /* Page Load (Historically the server would have done this part) */

  const url = new URL(location);
  const params = new URLSearchParams(url.search);
  const id = params.get("id");

  let errorAlert = document.createElement("div");
  errorAlert.classList.add("alert", "alert-danger");
  errorAlert.setAttribute("role", "alert");

  const main = document.querySelector("main > .container");

  if (!id) {
    errorAlert.textContent = "Error: No id set (in query string)";
    main.replaceChildren(errorAlert);
  } else {
    const todo = jamesTodosApp.getTodoById(id);
    if (!todo) {
      errorAlert.textContent = `Error: Todo with id ${id} not found`;
      main.replaceChildren(errorAlert);
    } else {
      const data = {
        ...todo,
        done: todo.done ? "done" : undefined,
      };
      populate(updateForm, data);
    }
  }
}






