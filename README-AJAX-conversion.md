# Converting the app to AJAX

** YOU NEED AN ENDPOINT THAT SENDS THAT DATA **
(jsonplaceholder is a fake endpoint. Let's use a real one)

1. We need to convert our Todo model to a car model, so rename the `/scripts/classes/Todo.js` to `/scripts/classes/Car.js`.

The 'schema' (the data-shape type diagram) for the cars API can be found (here)[https://carsapp-production.up.railway.app/schema.html] and looks like this:

```js
// Cars API
{
  name: {
    type: String,
    required: true,
    maxLength: 50,
  },
  bhp: {
    type: Number,
    required: true,
    max: 10000
  },
  avatar_url: {
    type: String,
    default: "https://static.thenounproject.com/png/449586-200.png",
    maxLength: 200,
  },
}
```

So now we can adjust our 'model' (Properties are checked on the server, so as long as we don't create models separately to an AJAX call we don't need to validate).

Search and replace 'Todo' with 'Car' and then remove defensive checks and change the property names and ...

```js
import isURI from "https://esm.sh/is-uri";


export default class Car {
  constructor({ name = "", bhp = 0, avatar_url = "", _id } = {}) {
    // Now _ids come from the server, so let's check:
    if (typeof _id !== "string")
      throw new Error(
        `A car requires an '_id' (of type 'string'); instead received ${_id} (of type ${typeof _id})`
      );

    if (!_id.length) throw new Error(`'_id' cannot be an empty string`);

    // check
    if (typeof name !== "string")
      throw new Error(
        `A car requires an 'name' (of type 'string'); instead received ${name} (of type ${typeof name})`
      );

    if (!name.length) throw new Error(`'name' cannot be an empty string`);

    if (typeof bhp !== "number" && !Number.isNaN(bhp))
      throw new Error(
        `A car requires an 'bhp' (of type 'number'); instead received ${bhp} (of type ${typeof bhp})`
      );

    if (bhp < 0 || bhp > 6000)
      throw new Error(
        `A car requires an 'bhp' (of type 'number'); instead received ${bhp} (of type ${typeof bhp})`
      );

    if (typeof avatar_url !== "string")
      throw new Error(
        `A car requires an 'avatar_url' (of type 'string'); instead received ${avatar_url} (of type ${typeof avatar_url})`
      );

    if (!isURI(avatar_url))
      throw new Error(
        `A car requires an 'avatar_url' which must be a complete URL`
      );

    this._id = _id;

    this.name = name;
    this.bhp = bhp;
    this.avatar_url = avatar_url;

    // Freeze to protect
    Object.freeze(this);
  }
}
```

For the manager app we can add some quick convenience methods, resulting in:

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

  createItems(data = []) {
    for (const item of data) {
      this.createItem(item);
    }
  }

  // NEW!
  clear(){
    this.#items.length = 0;
  }

  // NEW!
  loadItems(data){
    this.clear();
    this.createItems(data);
  }


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


** Don't forget to export it!! **

NOW, do the same for `/scripts/classes/todo-app.js` and rename it to

then search and replace 'Todo' with 'Car' (preserve the case!).

If we remove ALL localStorage persistence code (because the server is the persistor now) we'll get:

```js
import Manager from "./manager.js";
import Car from "./car.js";

export default class CarsApp extends Manager {
  constructor({
    owner,
    startingData,
  } = {}) {
    super({ startingData, itemClass: Car });
  }

  // Convenience Methods
  createCars({
    data=[], 
  }={}) {
    super.createItems(data);
  }

  clearAllCars(){
    super.clear();
  }

  loadCars(cars=[]){
    super.loadItems(cars);
  }

  // Aliases
  createCar(data) {
    const itemId = super.createItem(data);
    return itemId;
  }

  updateCar(id, updates) {
    super.updateItem(id, updates);
  }

  removeCar(id) {
    const item = super.removeItem(id);
    return item;
  }

  getAllCars() {
    return super.render(function (cars) {
      return cars;
    });
  }

  getCarById(id) {
    const car = super.render(function (cars) {
      const t = cars.find(({ _id }) => _id === id);
      return t;
    });
    return car;
  }

  render({ fn = function () { console.log(...arguments)} }={}) {
    const { owner } = this;
    return super.render(function (cars) {
      return fn({ cars, owner });
    });
  }
}
```

---

---

** CHECKPOINT: Data Model Adjusted! **

---

Next, let's update the 'view'!

Go through the HTML files and change any mention of 'Todo' for 'Car'

OK, let's update the forms. (again change 'todo' for 'car')

Change:

- 'title' for `name`
- 'duration' for `bhp` (input type text but with a pattern and an inputmode of numeric)
- Add a input[type="url"] for the `avatar_url`

So now we have a form that looks like:

```html
<form name="add-car-form" class="mb-5 p-3 bg-light" novalidate>
  <div class="mb-3 form-row">
    <label for="name" class="form-label">Name</label>
    <input type="text" class="form-control" name="name" id="name" required minlength="2" maxlength="30"  placeholder="e.g. Bugatti Chiron">
    <label for="name" class="text-danger d-block form-text error" aria-live="polite"></label>
  </div>
  <div class="mb-3 form-row">
    <label for="bhp" class="form-label"><abbr title="Break Horse Power">BHP</abbr> (as a number)</label>
    <input type="text" pattern="[0-9]{1,5}" inputmode="numeric" class="form-control" name="bhp" id="bhp" required minlength="2" maxlength="5" placeholder="e.g. 1234">
    <label for="bhp" class="text-danger d-block form-text error" aria-live="polite"></label>
  </div>
  <div class="mb-3 form-row">
    <label for="avatar_url" class="form-label">Avatar <abbr title="Uniform Resource Locator">URL</abbr></label>
    <input type="url" class="form-control" name="avatar_url" id="avatar_url" required minlength="2" maxlength="300" placeholder="e.g. https://www.sportscars.com/bugatti/chiron.jpg">
    <label for="avatar_url" class="text-danger d-block form-text error" aria-live="polite"></label>
  </div>
  <div class="form-row d-flex justify-content-end align-items-center">
    <div class="controls">
      <button type="reset" class="btn btn-secondary">Reset</button>
      <button type="submit" class="btn btn-primary">Submit</button>
    </div>
  </div>
</form>
```

Do the same for the update form. (** DON'T accidentally delete the hidden `_id` input**)

Now let's do the list:

In `/scripts/utils.js`, change 'Todo' for 'Car', as we did before.

Now, in `createCarListItem` let's adjust the code to print the new properties, like so:

```js
function createCarListItem({ car = {} } = {}) {
  const { name, bhp, avatar_url, _id } = car; // CHANGE 1: Get correct property names

  // create our own element to display an item
  const row = document.createElement("div");
  row.classList.add("item-row");

  // CHANGE 2 (Create an avatar image)
  const img = document.createElement("img");
  img.alt = "";
  img.src = avatar_url;
  img.width = 100;
  img.height = 100;
  img.classList.add("bg-info", "rounded-circle");

  row.append(img);

  const span = document.createElement("span");
  span.classList.add("me-auto");
  span.innerHTML = `${name} (${bhp} <abbr title="Break Horse Power">BHP</abbr>)`; // CHANGE 3: Correct the text

  row.append(span);

  // buttons
  const updateButton = document.createElement("a");
  updateButton.href = `/update.html?id=${_id}`;
  updateButton.classList.add("btn", "btn-warning", "update");
  // updateButton.dataset.id = _id;

  // accessibility text
  const updateAccessibilityTextSpan = document.createElement("span");
  updateAccessibilityTextSpan.classList.add("visually-hidden");
  updateAccessibilityTextSpan.textContent = "update";

  // icons
  const updateIcon = document.createElement("span");
  updateIcon.setAttribute("aria-hidden", "true");
  updateIcon.classList.add("fa-solid", "fa-pen");

  updateButton.append(updateAccessibilityTextSpan, updateIcon);

  const removeButton = document.createElement("button");
  removeButton.classList.add("btn", "btn-danger", "remove");
  removeButton.dataset.id = _id;

  const removeAccessibilityTextSpan =
    updateAccessibilityTextSpan.cloneNode(true);
  removeAccessibilityTextSpan.textContent = "remove";

  const removeIcon = updateIcon.cloneNode(true);
  removeIcon.classList.replace("fa-pen", "fa-trash");

  removeButton.append(removeAccessibilityTextSpan, removeIcon);

  row.append(updateButton, removeButton);

  // Create the li for boostraps list
  const li = document.createElement("li");
  li.classList.add("list-group-item", "car-listing");

  li.append(row);

  return li;
}
```

Don't forget to adjust the CSS to accomodate the avatar:

```css
.item-row {
  display: grid; /*  Make a row */
  grid-template-columns: auto 1fr  auto auto; /* avatar content updateBtn deleteBtn */
  gap: 0.5em; /* Spaces between content, especially buttons */
  align-items: center; /* Line up text vertically */
}
```

---

** CHECKPOINT: View Adjusted! **

---

OK, so now we need to adjust our `/scripts/index.js` to:

1. Use the AJAX calls to exchange state with the server (when necesary)
2. Update our DOM app with the data from the server
3. Render to the interface

Let's look at our f AJAX methods first (Slight difference because we're in a different file: Here, instead of using `renderFn` we're actually going to return what we get back):

** READ (GET) **

```js
async function getCars({ id = "" } = {}) {
  try {
    const response = await fetch(
      `https://carsapp-production.up.railway.app/api/v1/cars/${id}`
    );

    if (!response.ok) {
      throw response; // we could use the new Error.cause instead (a stylistic choice)
    }

    const data = await response.json();

    // Put the data into the UI
    // renderFn(data);
    return data;
  } catch (err) {
    console.log(err);
    // show the user that an error occurred
    // showError(err);
    return new Error(err.message || err);
  }
}
```

** CREATE (POST) **

```js
async function addCar({
  data:newCarData={}, // POJO (Plain Old JavaScript Object)  (You can oass a FormData object and send that. See line 13 for more)
}) {
  console.log('newCarData', newCarData);
  try {
    const response = await fetch(
      "https://carsapp-production.up.railway.app/api/v1/cars",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8", // <-- NECESSARY if sending data
          // 'Content-Type': 'application/x-www-form-urlencoded', // If using a FormData object this will get set automatically
        },
        body: JSON.stringify(newCarData), // convert for a JSON-receiving API
        // body: FormDataObject, // this is if you wanted to send a FormData object (to an API capable of receiving it)
      }
    );

    if (!response.ok) throw response;

    const data = await response.json();

    // Put the data into the UI
    // renderFn(data);
    return data;
  } catch (err) {
    console.log(err);
    // show the user that an error occurred
    // showError(err);
    return err;
  }
}
```

** UPDATE (PUT) **

```js
async function updateCar({ id = "", changes = {} } = {}) {
  try {
    const response = await fetch(
      `https://carsapp-production.up.railway.app/api/v1/cars/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json; charset=utf-8", // <-- NECESSARY if sending data
        },
        body: JSON.stringify(changes),
      }
    );

    if (!response.ok) throw response;

    const data = await response.json();

    // Put the data into the UI
    // renderFn(data);
    return data;
  } catch (err) {
    console.log(err);
    // show the user that an error occurred
    // showError(err);
    return err;
  }
}
```

** DELETE (DELETE) **

```js
async function removeCar({ id = "" }) {
  try {
    const response = await fetch(
      `https://carsapp-production.up.railway.app/api/v1/cars/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw response;

    // update the UI
    // renderFn();
    return undefined;
  } catch (err) {
    console.log(err);
    // show the user that an error occurred
    // showError(err);
    return err;
  }
}
```

Put these in a new file called `/scripts/api.js` and export them.

OK, so let's make the GET call first and put cars into the app:


Just before the `if(listElement){` block put:

```js


const loadCars = async (loaded=false) => {
  if (!loaded) {
    const result = await getCars();
    if (result instanceof Error) {
      toadtBody.textContent = result.message;
      toastElement.classList.replace("text-bg-success", "text-bg-danger");
      toast.show();
    } else if (Array.isArray(result)) {
      console.log(result);
      jamesCarsApp.clearAllCars();
      jamesCarsApp.createCars({ data: result });
    } else {
      console.warn("unexpected result", result);
    }
  }
};

```

Let's add a spinner to show when we're calling. Add this to utils and export:

```js
const centeredSpinner = document.createElement('div');  // export this
centeredSpinner.classList.add('d-grid', 'justify-content-center');

const loadingSpinner = document.createElement('div');
loadingSpinner.classList.add("spinner-border", "text-primary");
loadingSpinner.setAttribute("role", "status");

centeredSpinner.append(loadingSpinner);

const spinnerAccessibilityText = document.createElement('span');
spinnerAccessibilityText.classList.add("visually-hidden");
loadingSpinner.replaceChildren(spinnerAccessibilityText);
```

Inside the `if(listElement){` block put:

```js
listElement.before(centeredSpinner);

await loadCars();
centeredSpinner.remove();

// Render List
jamesCarsApp.render(renderOptions);
```

OK, great! Let's wire up the delete buttons. 

```js

  // Bind Buttons
  listElement.addEventListener("click", async (e) => {
    // See what was clicked
    const { target: clickedElement } = e;
    // console.log(clickedElement);

    // Bail if not a button we know how to handle
    if (!clickedElement?.matches?.("button.remove"))
      return;

    const { id } = clickedElement.dataset;
    console.log('clicked id', id);

    const oldLi = clickedElement.closest("li.car-listing");

    if (clickedElement?.matches?.(".remove")) {

      const result = await removeCar({id}); // The call

      // Handling
      if (result instanceof Error) {
        toadtBody.textContent = result.message;
        toastElement.classList.replace("text-bg-success", "text-bg-danger");
        toast.show();
      } else {
        
        // Our happy-path rendering code
        console.log(result);
        // Call memory manager
        jamesCarsApp.removeCar(id);
        // Remove item from list
        const list = oldLi.closest("ol,ul");
        oldLi.remove();

        console.log(list);
        console.log(list.children.length);
        const carItemElements = list.children.length;

        // DOM Micro-management to show noCarsMessage (which you imported above from utils, right?!)
        if (!carItemElements) {
          list.after(noCarsMessage);
        } else {
          noCarsMessage.remove();
        }
      }
    }
  });
```

And the update buttons work as planned, so that's pretty much our list done. Let's add a refresh button so we can pull new data at will.

In `index.html`, before the 'Add Car' button, add a refresh button, so we have:

```html
<div class="d-flex justify-content-end mb-3 gap-2">
  <button id="refresh" class="btn btn-light">
    <span class="visually-hidden">refresh</span>
    <i class="fa-solid fa-arrows-rotate"></i>
  </button>
  <a class="btn btn-primary" href="/add.html">Add car</a>
</div>
```

now in `/scripts/index.js` add the following in the listElement if-block:

```js
// Reload functionality
const refreshBtn = document.getElementById("refresh");
if (refreshBtn) {
  refreshBtn.addEventListener("click", async (e) => {
    await loadCars(false);
    jamesCarsApp.render(renderOptions);
  });
}
```

---

** CHECKPOINT: Working List! READ & DELETE functionality **

---

Let's do the add form next:

In the addForm if-block, there are 2 things we need to change:

1. The handler for the form submit:

```js
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { target: form } = e;

    // Get the data
    const data = serialize(form);

    // adjust for BHP being a string
    data.bhp = Number(data.bhp);

    const result = await addCar({ data });
    if (result instanceof Error) {
      // Show error toast
      toadtBody.textContent = result.message;
      toastElement.classList.replace("text-bg-success", "text-bg-danger");
      toast.show();
    } else {
      // update in local state
      jamesCarsApp.createCar(result);

      // Show confirmation toast
      toadtBody.textContent = `${data.name} created`;
      toastElement.classList.remove("text-bg-danger");
      toastElement.classList.add("text-bg-success");
      toast.show();

      // location.assign("/");
    }

    // reset form fields
    resetAllFormFields(form);
  });
```
we also need to handle validation:

```js
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
  } else if (validityState.typeMismatch) { // **** HERE ****
    errorLabel.textContent = "Not a valid URL";
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
```

Back in `/scripts/index.js`, the validation bindings below now find the new fileds and look like this:

```js
  const nameField = addForm["name"];
  const bhpField = addForm["bhp"];
  const avatarField = addForm["avatar_url"];

  nameField.addEventListener("input", (e) => {
    validate(nameField);
  });
  nameField.addEventListener("change", (e) => {
    validate(nameField);
  });

  bhpField.addEventListener("input", (e) => {
    validate(bhpField);
  });
  bhpField.addEventListener("change", (e) => {
    validate(bhpField);
  });

  avatarField.addEventListener("input", (e) => {
    validate(avatarField);
  });
  avatarField.addEventListener("change", (e) => {
    validate(avatarField);
  });
```

---

** CHECKPOINT: Working Add Form and CREATE functionality **

---

For the update form you need to:

1. Get rid of any 'done' adjustments (in the last few lines of the if-block) 
2. For the submit event handler, you'll need to diff the 2 objects to find what has changed and send those updates; and again cast bhp to a number.

We'll call in a function to help us diff. Add this import to the top of `/scripts/index.js`:

```js
import {
  diff,
} from "https://esm.sh/deep-object-diff";
```

then...

```js
updateForm.addEventListener("submit", async (e) => {
    // Stop the submit
    e.preventDefault();

    // Extract refernce to form (to avoid repeated lookup with e.target)
    const { target: form } = e;

    // Get the data
    const carData = serialize(form);
    carData.bhp = Number(carData.bhp);  // CHange 1

    // Get _id and rest of data separately
    const { _id, ...data } = carData;

    const oldCar = jamesCarsApp.getCarById(_id);  // Change 2

    const updates = diff(oldCar, carData); // Change 3
    console.log("diff", updates);

    // Update on server
    const result = await updateCar({ id: _id, changes: updates });

    if (result instanceof Error) {
      toadtBody.textContent = result.message;
      toastElement.classList.replace("text-bg-success", "text-bg-danger");
      toast.show();
    } else {
      // update locally
      jamesCarsApp.updateCar(_id, updates);

      // reset form fields
      // resetAllFormFields(form);
      toastElement.classList.remove("text-bg-danger");
      toastElement.classList.add("text-bg-success");

      toadtBody.textContent = `${data.name} updated`;
      toast.show();

      // location.assign("/");
    }
  });
```

