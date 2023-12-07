import { Cell } from "./board";

export interface Coin {
  cell: Cell;
  serial: number;
}

interface GeocacheData {
  cell: Cell;
  coins: Coin[];
}

interface Momento<T> {
  toMomento(): T;
  fromMomento(momento: T): void;
}

export class Geocache implements Momento<string> {
  cell: Cell;
  coins: Coin[];

  constructor(cell: Cell, coins?: Coin[]) {
    this.cell = cell;
    this.coins = coins ?? [];
  }

  depositCoin(coin: Coin) {
    this.coins.push(coin);
  }

  removeCoin(): Coin | null {
    if (this.coins.length > 0) {
      return this.coins.shift()!;
    } else {
      return null;
    }
  }

  toMomento() {
    return JSON.stringify({ cell: this.cell, coins: this.coins });
  }

  fromMomento(momento: string): void {
    const data = JSON.parse(momento) as GeocacheData;
    this.cell = data.cell;
    this.coins = data.coins;
  }
}
