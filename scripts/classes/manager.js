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
