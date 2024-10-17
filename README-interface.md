# PP2 DOM Todo App (Interface Setup)


OK, let's start from the HTML layer and go upwards.

1. Generate a page (`index.html`)
2. We're going to use [Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/download/#cdn-via-jsdelivr) and [FontAwesome](https://fontawesome.com/icons) ([CDN](https://cdnjs.com/libraries/font-awesome)) (you would add these as you discovered you needed them), so in the head of your document add:

```html
<!-- Bootstrap -->
<link
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
  rel="stylesheet"
  integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
  crossorigin="anonymous"
/>

<script
  defer
  src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
  integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
  crossorigin="anonymous"
></script>

<!-- Font Awesome -->
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
  integrity="sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
/>
```

3. Add your own stylesheet

---

4. OK, for CSS add the following to your stylesheet:

```css
html,
body {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr;
}

main {
  background: hsl(192deg 25.42% 65.29%) url(https://media.licdn.com/dms/image/D4D12AQEwyXBntfTThw/article-cover_image-shrink_720_1280/0/1659250553931?e=2147483647&v=beta&t=t2RNu24hGF7CBMPJGnyH1rD5kYIvz2fhK35Yz2BJ9pc)
    top center no-repeat; /* Pick any royalty-free or licenced image you want in production */
}

.button *,
.btn *,
button * {
  pointer-events: none; /* stops icons being the target of JS click events */
}
```

(later, when you get to form rows you will find you need, so add it now.)

```css
.item-row {
  display: grid; /* Make a row */
  grid-template-columns: 1fr auto auto auto; /* content  doneBtn updateBtn deleteBtn */
  gap: 0.5em; /* Spaces between content, especially buttons */
  align-items: center; /* Line up text vertically */
}
```

5. Let's add some HTML to the body to make a header (straight from the docs)

```html
<header class="page-header">
  <nav class="navbar bg-primary" data-bs-theme="dark">
    <div class="container">
      <a class="navbar-brand" href="/">Todo App</a>
    </div>
  </nav>
</header>
```

6. Let's add the main tag, with some padding to keep content away from the header

```html
<main class="pt-5"></main>
```

7. Inside the main, let's add a container, to keep content away from the edges

```html
<div class="container"></div>
```

8. Now let's add a list inside that, taking a basic list group from the docs and adjusting until we get what we want. (The form will be the same for any todo list, so we'll leave it as static HTML but you could generate it?!):

```html
<ul class="list-group">
  <li class="list-group-item">Feed Cat (2mins)</li>
  <li class="list-group-item">A third item</li>
  <li class="list-group-item">A fourth item</li>
  <li class="list-group-item">And a fifth one</li>
</ul>
```

** CHECKPOINT **: We have a list

So, that's read (R). Now we need C, U and D from CRUD.

9. D is easy. As an internet user I expect there to be a delete button and no more details are required (other than the id, which we can hold in JS (as a data-attribute on the button)).

So, let's mock that up and see what we get with the list (and give the list an id)

```html
<ul class="list-group" id="todos-list">
  <li class="list-group-item">Feed Cat (2mins) <button class="btn btn-danger" data-id="1">X</button></li>
  <li class="list-group-item">A second item< <button class="btn btn-danger" data-id="2">X</button></li>

  <li class="list-group-item">A third item</li>
  <li class="list-group-item">A fourth item</li>
  <li class="list-group-item">And a fifth one</li>
</ul>

```

OK, so that's delete...

10. If we're going to get the user to create we'll need a form for them to put the details in, so let's create an `add.html` (you can clone index.html and remove the list)

We can put a link to it, styled like a button, above our list and title:

```html
<div class="d-flex justify-content-end mb-3">
  <a class="btn btn-primary" href="/add.html">Add todo</a>
</div>
```

Cool, so we go there and we have an empty page. We'll need a form. If you go to the forms section of bootstrap there are example ones. We can pull one out and customise it to look the way we want it.

Fields we need:

- Title (string)
- Duration (string)
- Done (boolean)

So, we can go with a form like this:

```html
<form name="add-todo-form" class="mb-5 p-3 bg-light" novalidate>
  <div class="mb-3 form-row">
    <label for="title" class="form-label">Title</label>
    <input type="text" class="form-control" name="title" id="title" required minlength="2" maxlength="30">
    <label for="title" class="text-danger d-block form-text error" aria-live="polite"></label>
  </div>
  <div class="mb-3 form-row">
    <label for="duration" class="form-label">Duration</label>
    <input type="text" class="form-control" name="duration" id="duration" required minlength="2" maxlength="20">
    <label for="duration" class="text-danger d-block form-text error" aria-live="polite"></label>
  </div>
  <div class="form-row d-flex justify-content-end align-items-center">
    <div class="pe-5">
      <label class="form-check-label" for="done">done?</label>
      <input type="checkbox" name="done" class="form-check-input" id="done" value="done">
    </div>

    <div class="controls">
      <button type="reset" class="btn btn-secondary">Reset</button>
      <button type="submit" class="btn btn-primary">Submit</button>
    </div>
  </div>
</form>
```

So, extra to the bootsrap form, we've

 - Given the form a name
 - Given the elements names
 - Added a reset button
 - Put validation spans underneath (as per the second example of validation in the portal)
 - put the buttons and the checkbox in a line using flexbox. 

It's the same form, I just fiddled with it. (You can always use that [end point form the forms lesson](https://form-reader.netlify.app/.netlify/functions/formReader) to make sure it gives the correct data shape!)

OK, so that's READ, DELETE and CREATE. Now what about update?

Well, it's basically the same as create, only we'll populate the form for them. We can create a separate page here but we couldn't create one for every single todo, so we're going to have to create a generic page with a form in and somehow tell it the ID of the todo in question, so it can look it up and populate the form with it.

Let's start by creating `update.html` which is a clone of `add.html` with the title changed.

Back on the list page we'll need to update the buttons so that each todo listed has an update button (anchor) that goes to `update.html?id=1`, for example.

```html
<ul class="list-group" id="todos-list">
  <li class="list-group-item">Feed Cat (2mins) <a href="/update.html?id=1" class="btn btn-warning">Update</a> <button class="btn btn-danger">X</button></li>
  <li class="list-group-item">A second item<<a href="/update.html?id=2" class="btn btn-warning">Update</a> <button class="btn btn-danger">X</button></li>
</ul>
```

OK, so that takes us to that page.

Once we've finished messing around with the HTML and CSS you can end up with a row like

```html
<li class="list-group-item todo-listing">
  <div class="item-row align-items-center d-flex">
    <span class="me-auto d-flex">Feed dog (5 mins)</span>
    <button class="btn btn-success done" data-id="DUf7I3JY_IRYiwLBjMHRt" data-done="false"><span
        class="visually-hidden">mark as not done</span>
      <span aria-hidden="true" class="fa-solid fa-check"></span>
    </button>
    <a href="/update.html?id=1" class="btn btn-warning update" data-id="DUf7I3JY_IRYiwLBjMHRt"><span
        class="visually-hidden">update</span><span aria-hidden="true" class="fa-solid fa-pen"></span></a>
    <button class="btn btn-danger remove" data-id="DUf7I3JY_IRYiwLBjMHRt"><span
        class="visually-hidden">remove</span><span aria-hidden="true" class="fa-solid fa-trash"></span></button>
  </div>
</li>
```

** CHECKPOINT **: We have an interface which is acceptable to us! 

Time for some JAVASCRIPT!!
