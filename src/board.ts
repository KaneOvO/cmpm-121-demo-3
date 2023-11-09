import leaflet from "leaflet";

interface Cell {
  readonly i: number;
  readonly j: number;
}

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;

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
}
