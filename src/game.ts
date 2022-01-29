export interface Tile {
  value: string;
  type: TileState;
}

export enum TileState {
  Empty = 0,
  Input = 1,
  Wrong = 2,
  Correct = 3,
  CorrectWrongPosition = 4,
}

export interface State {
  date: string;
  state: string;
}

export class Game {
  private readonly WORD_LENGTH = 5;
  private readonly WORD_ROWS = 6;
  // letters of the current word
  private word: string[] = [];
  // wordlist
  private words: Map<string, null> = new Map();
  // tile state
  private tiles: Tile[] = [];
  // callback func
  private onChange: (
    index: number,
    value: string | null,
    type: TileState
  ) => void;
  //
  private onBadInput: () => string;
  // localstorage
  private store: Store = new Store();
  // pointer to current start tile
  private cursor: number = 0;
  // current input
  private stack: number[] = [];
  // if true, the game is completed
  private isDone: boolean = false;

  constructor(
    word: string,
    words: string[],
    fn: (index: number, value: string | null, type: TileState) => void
  ) {
    this.onChange = fn;
    if (word.length != this.WORD_LENGTH) {
      throw `word: ${word}; got size ${word.length} want ${this.WORD_LENGTH}`;
    }
    for (let char of word) {
      this.word.push(char);
    }
    for (let w of words) {
      if (w.length != this.WORD_LENGTH) {
        throw `wordlist: ${w}; got size ${w.length} want ${this.WORD_LENGTH}`;
      }
      this.words.set(w, null);
    }
    for (let i = 0; i < this.WORD_LENGTH * this.WORD_ROWS; i++) {
      this.tiles.push({ value: '', type: TileState.Empty });
    }
    this.load();
  }

  private validate(char: string, pos: number): TileState {
    let state: TileState = TileState.Wrong;
    if (char == this.word[pos]) {
      state = TileState.Correct;
    } else if (this.word.includes(char)) {
      state = TileState.CorrectWrongPosition;
    }
    return state;
  }

  private sync() {
    if (this.isDone) return;
    if (this.cursor == 30) {
      this.isDone = true;
      return;
    }
    let ok = 0;
    for (let i = this.cursor; i >= 0 && i >= this.cursor - 5; i--) {
      if (this.tiles[i].type == TileState.Correct) {
        ok++;
      }
    }
    if (ok == 5) {
      // on win??
      this.isDone = true;
    }
  }

  private valid(): boolean {
    return this.isDone;
  }

  private load() {
    const v = this.store.get();
    if (!v) return;
    for (let i = 0, j = v.state.length; i < j; i += this.WORD_LENGTH) {
      const word = v.state.slice(i, i + this.WORD_LENGTH);
      this.process(word);
    }
  }

  input(v: string) {
    if (this.valid() || this.stack.length >= this.WORD_LENGTH) {
      return;
    }
    const pos = this.cursor + this.stack.length;
    this.tiles[pos].value = v;
    this.tiles[pos].type = TileState.Input;
    this.stack.push(pos);
    this.onChange(pos, v, TileState.Input);
  }

  remove() {
    if (this.valid() || this.stack.length == 0) {
      return;
    }
    const pos = this.stack.pop();
    if (pos === undefined) return;
    this.tiles[pos].value = '';
    this.tiles[pos].type = TileState.Empty;
    this.onChange(pos, '', TileState.Empty);
  }

  enter() {
    if (this.valid() || this.stack.length != 5) {
      return;
    }
    let word: string = '';
    for (let pos of this.stack) {
      word += this.tiles[pos].value;
    }
    this.process(word);
    this.stack = [];
  }

  private process(word: string) {
    if (!this.words.has(word)) {
      // TODO: append error message
      return;
    }
    for (let i = 0; i < this.WORD_LENGTH; i++) {
      const pos = this.cursor + i;
      const newState = this.validate(word[i], i);
      this.tiles[pos].value = word[i];
      this.tiles[pos].type = newState;
      this.onChange(pos, this.tiles[pos].value, this.tiles[pos].type);
    }
    this.cursor += this.WORD_LENGTH;
    this.save();
    this.sync();
  }

  private save() {
    let state = '';
    for (let i = 0; i < this.cursor; i++) {
      state += this.tiles[i].value;
    }
    this.store.put(state);
  }
}

class Store {
  private readonly KEY = 'state';

  get(): State | null {
    const item = localStorage.getItem(this.KEY);
    if (!item) {
      return null;
    }
    const state = JSON.parse(item) as State;
    if (!isSameDay(new Date(state.date), new Date(Date.now()))) {
      return null;
    }
    return state;
  }

  put(value: string) {
    const state: State = {
      date: new Date(Date.now()).toUTCString(),
      state: value,
    };
    localStorage.setItem(this.KEY, JSON.stringify(state));
  }
}

const isSameDay = (first: Date, second: Date): boolean => {
  return (
    first.getFullYear() == second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};
