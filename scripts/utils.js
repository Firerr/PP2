const noTodosMessage = document.createElement("div");
noTodosMessage.classList.add("alert", "alert-success");
noTodosMessage.setAttribute("role", "alert");
noTodosMessage.textContent = `You have no todos`;


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

function createTodoListItem({ todo = {} } = {}) {
  // add each todo to fragment
  const { title, duration, done, _id } = todo;
  // create our own element to display an item
  const row = document.createElement("div");
  row.classList.add("item-row");

  const span = document.createElement("span");
  span.classList.add("me-auto");
  span.textContent = `${title} (${duration})`;

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

  const doneButton = removeButton.cloneNode(false);
  doneButton.classList.replace(
    "btn-danger",
    done ? "btn-secondary" : "btn-success"
  );
  doneButton.classList.replace("remove", "done");
  doneButton.dataset.done = done;

  const doneAccessibilityTextSpan = updateAccessibilityTextSpan.cloneNode(true);
  doneAccessibilityTextSpan.textContent = `mark as ${done ? "" : "not"} done`;

  const doneIcon = updateIcon.cloneNode(true);
  doneIcon.classList.replace("fa-pen", "fa-check");

  doneButton.append(doneAccessibilityTextSpan, doneIcon);

  row.append(doneButton, updateButton, removeButton);

  // Create the li for boostraps list
  const li = document.createElement("li");
  li.classList.add("list-group-item", "todo-listing");
  done
    ? li.classList.add("done", "text-decoration-line-through")
    : li.classList.remove("done", "text-decoration-line-through");

  li.append(row);

  return li;
}

function renderList({ todos = [], listElement } = {}) {
  // Create list

  // create document fragment
  const fragment = document.createDocumentFragment();

  // add each todo to fragment
  for (const todo of todos) {
    const li = createTodoListItem({ todo }); // HERE!!
    fragment.append(li);
  }

  listElement.replaceChildren(fragment);
  return listElement;
}



function renderUI({
  todos = [],
  listElement,
  showTitle = true,
  titleLevel = 1,
  owner = "",
}) {


  if (showTitle) {
    const title = document.createElement(`h${titleLevel}`);
    title.id = `${owner}-title`;
    title.classList.add("list-title", "text-light");
    title.style.textShadow = `1px 1px 5px hsl(0deg 100% 0%)`;
    title.textContent = `${owner}'s Todos`;
    listElement.before(title);
  }

  if (!todos.length) {
    listElement.before(noTodosMessage);
  } else {
    noTodosMessage.remove();
  }

  renderList({
    todos,
    listElement,
  });
}

export {
  serialize,
  populate,
  resetAllFormFields,
  validate,
  renderUI,
  noTodosMessage,
  createTodoListItem,
};
