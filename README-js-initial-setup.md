# PP2 DOM Todo App (JS Setup)




OK, so we're going to use the class that we used for the console app with some adjustments:

So, we have the type class:

```js
import { nanoid } from "https://esm.sh/nanoid";

export default class Todo {
  constructor({ title='', duration='not given', done=false, _id= nanoid()}={}) {

    // check
    if (typeof title !== "string") throw new Error(
        `A todo requires an 'title' (of type 'string'); instead received ${title} (of type ${typeof title})`
      );
    
    if (!title.length) throw new Error(
      `'title' cannot be an empty string`
    );

    if (typeof duration !== "string") throw new Error(
      `A todo requires an 'duration' (of type 'string'); instead received ${duration} (of type ${typeof duration})`
    );

    if (typeof done !== "boolean") throw new Error(
      `A todo requires an 'done' value (of type 'boolean'); instead received ${done} (of type ${typeof done})`
    );
    
    this._id = _id;

    this.title = title;
    this.duration = duration;
    this.done = done;

    // Freeze to protect
    Object.freeze(this);
  }
}
```
that stays the same!

Then we have the manager class:

```js
import { nanoid } from "https://esm.sh/nanoid";
import rfdc from "https://esm.sh/rfdc"; // <-- note this addition
import deepmerge from "https://esm.sh/deepmerge";

const clone = rfdc({ proto: true });

export default class Manager {
  #items = [];

  constructor({ startingData = [], itemClass } = {}) {

    if (!Array.isArray(startingData))
      throw new Error(
        `'startingData' must be an array; instead received ${startingData} (of type ${typeof startingData})`
      );

    if (typeof itemClass !== 'function')
      throw new Error(
        `'itemClass' must be a constructor function or class; instead received ${itemClass} (of type ${typeof itemClass})`
      );


    Object.defineProperty(this, "_id", { value: nanoid(), enumerable: true });

    Object.defineProperty(this, "itemClass", { value: itemClass });

    this.createItems(startingData);
  }

  // * Create
  createItem(data) {
    const newItem = new this.itemClass(data); // {}
    // this.#items.push(newItem); // <-- old way
    // this.#items = [...this.#items, newItem]; // <-- abother old way
    this.#items = this.#items.toSpliced(this.#items.length, 0, newItem);
    return newItem._id;
  }

  // ADDED!!!!!
  createItems(data = []) {
    for (const item of data) {
      this.createItem(item);
    }
  }

  // clear(){
  //  if(confirm('Are you sure you want to delete all your todos?')) {
  //   this.#items.length = 0;
  //  }
  // }

  // * Read (Not implemented yet. see below for 'render method')
  findItemIdByField(field = "", value = "") {
    return clone(
      this.#items.find((item) => {
        return item[field] === value;
      })?._id ?? null
    ); // wait for es6
  }

  // * Update
  updateItem(id, updates = {}) {
    console.log(`updating item with id: ${id} with`, updates);

    // Try to find where it is:
    const idx = this.#items.findIndex((item) => {
      return item._id === id;
    });

    // console.log("idx", idx);

    // check that we found something, if not do something (here we're throwing an error)
    if (idx === -1) {
      throw new Error(`Item with id ${id} not found`);
    }

    // Get the actual item (ready to update)
    const item = this.#items[idx];
    // console.log('actual item', item);

    // We could use:
    // Object.assign(item, updates);
    // const updatedItem = { ...item, ...updates }; // both are shallow

    // SO, instead we'll use:

    // MERGE with updates to get new updated item
    const updatedItem = new this.itemClass(deepmerge(item, updates));
    // console.log('updated item', updatedItem);

    // Put the item back in the array (overwriting the previous)
    // this.#items[idx] = updatedItem;
    this.#items = this.#items.toSpliced(idx, 1, updatedItem);
  }

  // * Delete
  removeItem(id) {
    // console.log("removing id", id);
    // find where it is
    const idx = this.#items.findIndex(({ _id }) => {
      return _id === id;
    });

    console.log("idx", idx);

    // check that it exists
    if (idx === -1) {
      throw new Error(`Item with id ${id} not found`);
    }

    // save the old Item to return it
    const removedItem = this.#items[idx];

    // recreate the array without it
    this.#items = this.#items.toSpliced(idx, 1);

    // release it from our system
    return removedItem;
  }

  // Read & print
  render(fn = Manager.consoleRender) {
    // To protect against mutating code in the pased function
    const clonedItems = clone(this.#items);

    // Give them a glimpse at a copy. (N.B. If they reference this and do so in a loop they risk creating a memory leak by creating too many objects)
    return fn(clonedItems);
  }

  static consoleRender = (items) => {
    if (!items?.length) return console.log("No items to display");
    console.table(items);
  };
}

```
This has a new `createTodos` method which just loop calls `createTodo`.
In a lot of these methods, because we're now going to use things from outside the class, I've now `return`ed things. So you can see that we have added a return statement in various methods.

OK, then there's the app class:

```js
import Manager from "./manager.js";
import Todo from "./todo.js";

export default class TodosApp extends Manager {
  constructor({
    owner,
    startingData,
    storageKey = "todos",
    hydrate = true,
  } = {}) {
    super({ startingData, itemClass: Todo });

    if (typeof owner !== "string")
      throw new Error(
        `An app requires an owner (of type 'string'); instead received ${owner} (of type ${typeof owner})`
      );

    if (typeof storageKey !== "string")
      throw new Error(
        `An app requires an storageKey (of type 'string'); instead received ${storageKey} (of type ${typeof storageKey})`
      );

    if (typeof hydrate !== "boolean")
      throw new Error(
        `'hydrate' must be a boolean; instead received ${hydrate} (of type ${typeof hydrate})`
      );

    Object.defineProperty(this, "owner", { value: owner, enumerable: true });
    Object.defineProperty(this, "storageKey", {
      value: `${owner.toLowerCase()}-${storageKey}`,
      enumerable: true,
    });

    Object.freeze(this);

    if (hydrate) {
      this.hydrateApp();
    }
  }

  // Convenience Methods
  markAsDone(id) {
    const result = super.updateItem(id, { done: true });
    this.persistData();
    return result;
  }

  markAsUndone(id) {
    const result = super.updateItem(id, { done: false });
    this.persistData();
    return result;
  }

  // getTodoIdByTitle(title = "") {
  //   return super.findItemIdByField("title", title);
  // }

  // Aliases
  createTodo(data) {
    const itemId = super.createItem(data);
    this.persistData();
    return itemId;
  }

  updateTodo(id, updates) {
    super.updateItem(id, updates);
    this.persistData();
  }

  removeTodo(id) {
    const item = super.removeItem(id);
    this.persistData();
    return item;
  }

  // 'persist' the data
  persistData({ key = this.storageKey } = {}) {
    super.render(function (todos) {
      console.log(todos);
      localStorage.setItem(key, JSON.stringify(todos));
    });
  }

  // 'hydrate' the app
  hydrateApp({ key = this.storageKey } = {}) {
    const todosData = JSON.parse(localStorage.getItem(key)) || [];
    super.createItems(todosData);
  }

  getAllTodos() {
    return super.render(function (todos) {
      return todos;
    });
  }

  getTodoById(id) {
    const todo = super.render(function (todos) {
      const t = todos.find(({ _id }) => _id === id);
      return t;
    });
    return todo;
  }

  render({ fn = function () { console.log(...arguments)} }={}) {
    const { owner } = this;
    return super.render(function (todos) {
      return fn({ todos, owner });
    });
  }
}

```
Again, this `return`s from most methods to allow use outside. It also has:

 - `persist` - which effectively allows us to save the state of the app to our localstorage (disk)
 - `hydrate`  - which allows us to retrieve that state and put it back into the app when the page reloads (see in the constructor after property assignment)

 So, the equivalent of 'save' and 'load'.

 We can put these in our app (in the `scripts` folder) and call it into our `index.js` to create a todo app, which we can then wire to the DOM!

 if you put:
 ```js
import TodoApp from "./classes/todo-app.js";

const jamesTodosApp = new TodoApp({ owner: "James" });

jamesTodosApp.render();
 ```
 You should get an empty array.


 ** CHECKPOINT** We have a working in-memory manager!!

OK, so we're going to be working with forms, etc. and we know we need to get some 'utility functions', like `populate`, `serialise`, `resetAllFormFields`. Tod do this we can create a `utils.js` file (next to `index.js`) and add our functions from the portal into there.

So, it should start and look like this:

```js
function serialize(form) {
  // get most things
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // If you have checkboxes or selects in multiple mode
  const multis = Array.from(
    form.querySelectorAll('select[multiple], [type="checkbox"]')
  );
  const multiNames = Array.from(new Set(multis.map((input) => input.name)));
  console.log("multis", multis);

  // Get full values for checkboxes & multi-selects
  if (multis.length) {
    for (const name of multiNames) {
      formData.set(name, formData.getAll(name));
    }
  }

  return data;
}

function populate(form, data = {}) {
  console.log("populate data", data);
  if (!form || !(form instanceof HTMLFormElement)) {
    throw new Error(
      `The populate function requires a form element. Instead received $form} of type ${form?.prototype?.Constructor?.name}`
    );
  }

  // walk the object
  for (let [inputName, value] of Object.entries(data)) {
    // Make any bad values an empty string
    value ??= "";

    // try to find element in the form
    const element = form[inputName];

    // If we can't then bail
    if (!element || !element instanceof Element) {
      console.warn(`Could not find element ${inputName}: bailing...`);
      continue;
    }

    // see what type an element is to handle the process differently
    const type = element.type || element[0].type;

    switch (type) {
      case "checkbox": {
        // Here, value is an array of values to be spread across the checkboxes that make up this input. It's the value of the input as a whole, NOT the value of one checkbox.
        const values = Array.isArray(value) ? value : [value];
        const checkboxes = Array.isArray(element) ? element : [element];
        console.log("values", values);
        for (const checkbox of checkboxes) {
          console.log(checkbox.value);
          if (values.includes(checkbox.value)) {
            checkbox.checked = true;
          }
        }
        break;
      }
      case "select-multiple": {
        const values = Array.isArray(value) ? value : [value];

        for (const option of element) {
          if (values.includes(option.value)) {
            option.selected = true;
          }
        }
        break;
      }

      case "select":
      case "select-one":
        element.value = value.toString() || value;
        break;

      // case "time":
      // case "week":
      // case "datetime-local":
      case "date":
        element.value = new Date(value).toISOString().split("T")[0];
        break;

      default:
        element.value = value;
        break;
    }
  }
}

const resetAllFormFields = (form) => {
  form.reset();

  // const hiddenFields = form.querySelectorAll('input[type="hidden"');

  for (const field of form.querySelectorAll('input[type="hidden"')) {
    field.value = "";
  }
};

function validate(input) {
  const formRow = input.closest(".form-row");
  const errorLabel = formRow.querySelector("label.error");
  console.log(errorLabel);
  errorLabel.textContent = "";

  // Get current validation state
  const validityState = input.validity;
  console.log("validityState", validityState);

  // handle various errors
  // badInput - bad characters
  // customError - has setCustomValidity been used to override default message
  // patternMismatch - does the value match the pattern attribute
  // rangeOverflow - larger than max attribute
  // rangeUnderflow - less than min attribute
  // stepMismatch - value not matching the step attribute
  // tooLong - longer than maxLength attribute
  // tooShort - shorter than minLength attribute
  // typeMismatch - input is in incorrect format for type emal or url
  // valid - is it valid or not
  // valueMissing  - for required fields

  if (validityState.valueMissing) {
    // required
    errorLabel.textContent = "This field is required and cannot be blank!";
  } else if (validityState.tooShort) {
    // under min-length
    errorLabel.textContent = `The title must be at least ${input.getAttribute(
      "min-length"
    )} characters long!`;
  }

  // if (!input.checkValidity()) {
  if (validityState.valid) {
    console.log("valid", validityState);
    formRow?.classList.remove("invalid");
    // submitBtn.removeAttribute("disabled");
  } else {
    console.log("invalid", validityState);
    formRow?.classList.add("invalid");
  }
}

function renderUI(){}

export {
  serialize,
  populate,
  resetAllFormFields,
  validate,
  renderUI,
};
```

OK, so what was `renderUI`?? Well, that's the function we're going to give to `jamesTodosApp.render();` so that it prints the list.

Let's rig something up momentarily though. Change your `renderUI` function to look like this:

```js
function renderUI({
  todos=[],
  owner='',
  listElement
} ={}){
  console.log('in renderUI');
  console.log('owner', owner);
  console.log('todos', todos);
  console.log('listElement', listElement);
}
```

and in your `index.js` have this:

```js
import {
  serialize,
  populate,
  resetAllFormFields,
  validate,
  renderUI
} from './utils.js'

import TodoApp from "./classes/todo-app.js";

// Create the app
const jamesTodosApp = new TodoApp({ owner: "James" });

// Find the list
const listElement = document.getElementById("todos-list");

// Make some standard options that compose together the data we need to render the list (the todos, the owner and the location we want to render it)
const renderOptions = {
  fn: function ({todos, owner}) {
    return renderUI({ 
      todos, 
      owner,
      listElement,
    });
  },
};

// 
jamesTodosApp.render(renderOptions);
```


