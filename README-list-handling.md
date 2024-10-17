# PP2 DOM Todo App (List Handling)

OK, so now we need to handle the list! We're going to use a delegated listener to catch it but first we need to programatically render the todos!

Add this to the top of your `utils.js`:
```js
const noTodosMessage = document.createElement("div");
noTodosMessage.classList.add("alert", "alert-success");
noTodosMessage.setAttribute("role", "alert");
noTodosMessage.textContent = `You have no todos`;
```

** ADD IT TO THE EXPORT BLOCK and import it in `index.js`, so the scripts can share it!)

```js
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
```

As you can see from the code above, we have the ability to pass options and do things. Here I've decided to show a title.  (Don't forget to remove your `<h1>`)

I can also create fixtures (see the very top) - elements we're going to use again and again (like the 'no todos' paragraph) - show hide based on number of todos!

Finally we render the list. I've split this out into a separate function so we can render the list rather than the whole UI every time. Add it above your renderUI funcion:

```js
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
```

As you can see, it loops over the todos and creates an li for them using the `createTodoListItem` method. (When you're first doing it you'd probably have them un one function until you realised you needed the pieces separately: Single Responsibility Principle):

```js
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
```

As you can see it programattically assembles the pieces of the `<li>` we talked about earlier.

One thing to note here is how long it takes to put things together BUT how much `element.cloneNode()` helps!!

OK, so with that in we should actually see todos in our page but the buttons don't work!

Here's where our delegated listeners come in!



Unemotionally take their last doc to pcs showing how ur perspective (with evidence) is completely different to that stated in their docs 

State ur hours worked over day/week/month 7 days a week. 

Their hols n long w.e v ur 5 days have hol working 3 days out of 5 in Aug! U working thru every week end giving no chance for social life to meet anyone. 

State impact and n ur mental n physical health due to their blame culture n undermining of all ur work (tx msg from Smith just before start 1st session new cohort (quote it here). 

Their blaming u for writing ‘I’ when referring to school (quote msg from student n ur response) also why u sent it first marketing purposes but came back as criticism of u

Ur invite to work with smith her refusal because she doesn’t like you

He personal n vicious unwarranted attack on u n ur personhood which was pure vile but claiming in last doc they fear ur response. 

U always reman professional n try to see way forward but her in person n written communication is always driven by vengeance. 

Night b4 skiing hol they dumped legal work on you without briefing

Working with solicitor dumped on u taken take without any comm then criticised for not doing the work. Pt out this is their load but yet again smith dumps everything on u. 



```js
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
      const list = oldLi.closest("ol,ul"); // DON"T SWAP THIS like I did in the video

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
```

** CHECKPOINT ** : Working App.


