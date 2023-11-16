import { Cell } from "./board";

export interface Coin {
  cell: Cell;
  serial: number;
}

export class Coins {
  private readonly coinsMap: Map<string, Coin[]> = new Map<string, Coin[]>();

  private readonly coinSerialsByCell: Map<string, Set<number>> = new Map<
    string,
    Set<number>
  >();

  addCoin(cell: Cell): void {
    const cellKey = cellToString(cell);

    if (!this.coinSerialsByCell.has(cellKey)) {
      this.coinSerialsByCell.set(cellKey, new Set());
    }

    const serials = this.coinSerialsByCell.get(cellKey)!;

    let serial = 0;
    while (serials.has(serial)) {
      serial++;
    }

    serials.add(serial);

    const coin: Coin = { cell, serial };
    if (!this.coinsMap.has(cellKey)) {
      this.coinsMap.set(cellKey, []);
    }
    this.coinsMap.get(cellKey)!.push(coin);
  }

  getCoins(cell: Cell): Coin[] {
    return this.coinsMap.get(cellToString(cell))!;
  }

  removeCoin(cell: Cell): Coin | null {
    const cellKey = cellToString(cell);
    const coins = this.coinsMap.get(cellKey)!;
    const coin = coins.shift()!;
    return coin;
  }

  depositCoin(cell: Cell, coin: Coin): void {
    const cellKey = cellToString(cell);
    this.coinsMap.get(cellKey)!.push(coin);
  }
}

function cellToString(cell: Cell): string {
  return `${cell.i},${cell.j}`;
}
