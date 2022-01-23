import './style.css';
import { words } from './wordlist';

interface Elements {
  grid: Array<HTMLDivElement>;
  keyboard: Array<HTMLDivElement>;
}

const hydrate = (keyboard: string, grid: string): Elements => {
  let keyboardElement = document.getElementById(keyboard) as HTMLDivElement | null;
  if (!keyboardElement) {
    throw `missing element with id ${keyboard}`;
  }
  let buttons: Array<HTMLDivElement> = [];
  for (let i = 0; i < keyboardElement.children.length; i++) {
    for (let j = 0; j < keyboardElement.children[i].children.length; j++) {
      buttons.push(keyboardElement.children[i].children[j] as HTMLDivElement);
    }
  }

  let gridElement = document.getElementById(grid) as HTMLDivElement | null;
  if (!gridElement) {
    throw `missing element with id ${grid}`;
  }
  let tiles: Array<HTMLDivElement> = [];
  for (let i = 0; i < gridElement.children.length; i++) {
    tiles.push(gridElement.children[i] as HTMLDivElement);
    tiles[i].classList.value = 'empty';
  }

  return {
    grid: tiles,
    keyboard: buttons,
  };
};

window.addEventListener('DOMContentLoaded', () => {
  let h = hydrate('keyboard', 'grid');

  const update = (index: number, value: string | null, type: TileState): void => {
    let v = '';
    if (value) {
      v = value;
    }

    h.grid[index].textContent = v;

    switch (type) {
      case TileState.Empty:
        h.grid[index].classList.value = 'empty';
        break;
      case TileState.Input:
        h.grid[index].classList.value = 'input';
        break;
      case TileState.Wrong:
        h.grid[index].classList.value = 'wrong';
        break;
      case TileState.Correct:
        h.grid[index].classList.value = 'correct';
        break;
      case TileState.CorrectWrongPosition:
        h.grid[index].classList.value = 'correctWrongPosition';
        break;
    }
  };

  let g = new State('fuska', words, update);

  for (let child of h.keyboard) {
    console.log(child);
    child.addEventListener('click', (evt: Event) => {
      console.log(child.dataset['key']);

      let v = child.dataset['key'];
      if (v) {
        switch (v) {
          case '_enter':
            g.enter();
            break;
          case '_remove':
            g.remove();
            break;
          default:
            g.input(v);
        }
      }
    });
  }
});

enum TileState {
  Empty = 0,
  Input = 1,
  Wrong = 2,
  Correct = 3,
  CorrectWrongPosition = 4,
}

interface Tile {
  value: string;
  type: TileState;
}

class State {
  private word: string[] = [];
  private words: Map<string, null> = new Map();
  private tiles: Tile[] = [];
  private onChange: (index: number, value: string | null, type: TileState) => void;

  private cursor: number = 0;
  private stack: number[] = [];

  private isDone: boolean = false;

  constructor(
    word: string,
    words: string[],
    fn: (index: number, value: string | null, type: TileState) => void
  ) {
    this.onChange = fn;
    for (let char of word) {
      this.word.push(char);
    }
    for (let word of words) {
      if (word.length != 5) {
        throw `bad word: ${word}`;
      }
      this.words.set(word, null);
    }
    for (let i = 0; i < 30; i++) {
      this.tiles.push({ value: '', type: TileState.Empty });
    }
  }

  input(v: string) {
    if (this.isDone || this.stack.length >= 5) {
      return;
    }
    const index = this.cursor + this.stack.length;
    this.tiles[index].value = v;
    this.tiles[index].type = TileState.Input;
    this.stack.push(index);
    this.onChange(index, v, TileState.Input);
  }

  remove() {
    if (this.isDone || this.stack.length == 0) {
      return;
    }
    const index = this.stack.pop();
    if (index === undefined) return;
    this.tiles[index].value = '';
    this.tiles[index].type = TileState.Empty;
    this.onChange(index, '', TileState.Empty);
  }

  enter() {
    if (this.isDone || this.stack.length != 5) {
      return;
    }
    let word: string[] = [];
    let wordAsString = '';
    for (const index of this.stack) {
      const value = this.tiles[index].value;
      word.push(value);
      wordAsString += value;
    }

    if (!this.words.has(wordAsString)) {
      console.log('NOT FOUND TODO');
      return;
    }

    for (let i = 0; i < 5; i++) {
      const char = word[i];
      const tile = this.tiles[this.stack[i]];

      if (char == this.word[i]) {
        tile.type = TileState.Correct;
      } else if (this.word.includes(char)) {
        tile.type = TileState.CorrectWrongPosition;
      } else {
        tile.type = TileState.Wrong;
      }
    }

    let success = true;
    for (const index of this.stack) {
      const tile = this.tiles[index];
      if (tile.type != TileState.Correct) {
        success = false;
      }
      this.onChange(index, tile.value, tile.type);
    }

    this.cursor += 5;
    this.stack = [];

    if (this.cursor == 30 || success) {
      this.isDone = true;
    }
  }
}
