import leaflet from "leaflet";

interface Cell {
  readonly i: number;
  readonly j: number;
}

interface Coin {
  cell: Cell;
  serial: number;
}

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;
  private readonly coins: Coin[] = [];
  private readonly coinSerialsByCell: Map<string, Set<number>> = new Map<
    string,
    Set<number>
  >();

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map();
  }

  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, cell);
    }
    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell({
      i: Math.floor(point.lat / this.tileWidth),
      j: Math.floor(point.lng / this.tileWidth),
    });
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const southWest = new leaflet.LatLng(
      cell.i * this.tileWidth,
      cell.j * this.tileWidth
    );
    const northEast = new leaflet.LatLng(
      (cell.i + 1) * this.tileWidth,
      (cell.j + 1) * this.tileWidth
    );
    return new leaflet.LatLngBounds(southWest, northEast);
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    const minX = originCell.i - this.tileVisibilityRadius;
    const maxX = originCell.i + this.tileVisibilityRadius;
    const minY = originCell.j - this.tileVisibilityRadius;
    const maxY = originCell.j + this.tileVisibilityRadius;

    for (let i = minX; i <= maxX; i++) {
      for (let j = minY; j <= maxY; j++) {
        const cell = this.getCanonicalCell({ i, j });
        resultCells.push(cell);
      }
    }

    return resultCells;
  }

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
    this.coins.push(coin);
  }

  getCoins(): Coin[] {
    return this.coins;
  }

  removeCoin(cell: Cell): Coin | null {
    const cellKey = cellToString(cell);

    if (!this.coinSerialsByCell.has(cellKey)) {
      return null;
    }

    const serials = this.coinSerialsByCell.get(cellKey)!;

    if (serials.size === 0) {
      return null;
    }

    let minSerial = Number.MAX_SAFE_INTEGER;
    serials.forEach((serial) => {
      if (serial < minSerial) {
        minSerial = serial;
      }
    });

    serials.delete(minSerial);

    const index = this.coins.findIndex(
      (coin) =>
        coin.cell.i === cell.i &&
        coin.cell.j === cell.j &&
        coin.serial === minSerial
    );

    if (index !== -1) {
      const removedCoin = this.coins.splice(index, 1)[0];
      return removedCoin;
    }

    return null;
  }
}

function cellToString(cell: Cell): string {
  return `${cell.i},${cell.j}`;
}
