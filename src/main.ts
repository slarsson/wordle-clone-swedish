import './style.css';
import { words } from './wordlist';
import { Game, TileState, Tile } from './game';

interface Elements {
  grid: Array<HTMLDivElement>;
  keyboard: Array<HTMLDivElement>;
}

const hydrate = (keyboard: string, grid: string): Elements => {
  let keyboardElement = document.getElementById(
    keyboard
  ) as HTMLDivElement | null;
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

const main = () => {
  let h = hydrate('keyboard', 'grid');

  const update = (
    index: number,
    value: string | null,
    type: TileState
  ): void => {
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

  let g = new Game('fuska', words, update);

  const onInput = (key: string) => {
    switch (key) {
      case 'Enter':
        g.enter();
        break;
      case 'Backspace':
        g.remove();
        break;
      default:
        if (key.match(/[a-ö]/g)) {
          g.input(key);
        }
    }
  };

  window.addEventListener('keydown', (evt: KeyboardEvent) => {
    onInput(evt.key);
  });

  for (let child of h.keyboard) {
    child.addEventListener('click', () => {
      const key = child.dataset['key'];
      if (!key) return;
      onInput(key);
    });
  }
};

window.addEventListener('DOMContentLoaded', main);
