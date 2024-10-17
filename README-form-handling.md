# PP2 DOM Todo App (Form Handling)

OK, so above the render call (although it doesn't really matter), we can try to find our page elements. If there's alist we can call the renderUI method on it; If there's an add form then we can bind the listeners for add; if there's an update form then we can bind listeners for updatiing

```js

const listElement = document.getElementById("todos-list");
const addForm = document.forms["add-todo-form"];
const updateForm = document.forms["update-todo-form"];

if(listElement) {
  // list listeners, etc.
}

if (addForm) {
  // add form listeners, etc.
}

if (updateForm) {
  // update form listeners, etc.
}

```

OK, so for in the addForm if-statement block, we're going to add listners (straight out of the portal) for reset:

```js
addForm.addEventListener("reset", (e) => {
    // reset (inc. hidden fields)
    resetAllFormFields(e.target);
  });
```

and submit:

```js

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


    // location.assign("/");
  });
```
IF you look we:

1. preventDefault
2. get the data
3. Now, here we have to adjust for that checkbox so there's a little if statement that corrects the value to `true` or `false`
4. Call `jamesTodosApp.createTodo(data);` with that data and then
5. Clear the form 

You can redirect with the commented out line, if you wish.

If you test it, yuo should get todos in your app (check localstorage)

We can add validation now; so you get:

```js
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

    // toadtBody.textContent = `${data.title} created`;
    // toast.show();

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
```

** BOOM! You have validation **

We could do with some visual feedback, so at the we're going to use Bootstraps [toasts](https://getbootstrap.com/docs/5.3/components/toasts/).

Paste this HTML in your pages (at the bottom of the main tag is easiest but it's absolutely positioned, so it doesn't matter)

```html
<!-- TOAST -->
    <div class="toast-container p-3 top-0 end-0">
      <div id="toast" class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive"
        aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">

          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
            aria-label="Close"></button>
        </div>
      </div>
    </div>
```

Now (from boostrap docs) we select it and instatiate it (which makes it disappear) and then we call it when we need.

So first, let's find the element and select:

```js
const listElement = document.getElementById("todos-list");
const addForm = document.forms["add-todo-form"];
const updateForm = document.forms["update-todo-form"];

const toastElement = document.getElementById("toast");
const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
const toadtBody = toastElement.querySelector(".toast-body"); // the bit you write in
```

and now in the submit handler for add you can add/uncomment the lines:

```js
    toadtBody.textContent = `${data.title} updated`;
    toast.show();
```

** CHECKPOINT **: Working visual feedback

For the update form it's nearly the same:

You'll need to add a hidden input to catch the ID, so add:

```html
<input type="hidden" name="_id">
```
inside your form. Then:

```js
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
```

As you can see towards the bottom we get the id out of the URL like so:

```js
const url = new URL(location);
const params = new URLSearchParams(url.search);
const id = params.get("id");
```
then if there's no id we show an error.
If we can't find a todo with that id we show an error;

if we do find the todo then we go to populate. Here we have to do the reverse of what we did before for saving the todo and change `true` and `false` into `'done'` and `undefined` before we call populate.

** CHECKPOINT ** : We now have working update form.