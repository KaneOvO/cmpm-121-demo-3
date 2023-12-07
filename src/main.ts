import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
import { Board, Cell } from "./board";
import { Coin, Geocache } from "./coin";

const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;
let CURRENT_COIN: Coin | null = null;
const PLAYER_COINS: Coin[] = [];
const onMapPits: leaflet.Layer[] = [];
const geoCaches = new Map<Cell, string>();

const mapContainer = document.querySelector<HTMLElement>("#map")!;
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
  })
  .addTo(map);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

const sensorButton = document.querySelector("#sensor")!;
sensorButton.addEventListener("click", () => {
  navigator.geolocation.watchPosition((position) => {
    playerMarker.setLatLng(
      leaflet.latLng(position.coords.latitude, position.coords.longitude)
    );
    map.setView(playerMarker.getLatLng());
  });
});

const northButton = document.querySelector("#north")!;
northButton.addEventListener("click", () => {
  updatePlayerPosition("north");
});

const southButton = document.querySelector("#south")!;
southButton.addEventListener("click", () => {
  updatePlayerPosition("south");
});

const eastButton = document.querySelector("#east")!;
eastButton.addEventListener("click", () => {
  updatePlayerPosition("east");
});

const westButton = document.querySelector("#west")!;
westButton.addEventListener("click", () => {
  updatePlayerPosition("west");
});

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

function makePit(cell: Cell) {
  const bounds = board.getCellBounds(cell);
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;

  pit.bindPopup(() => {
    const geoCache = new Geocache(cell);
    if (geoCaches.has(cell)) {
      const moment: string = geoCaches.get(cell)!;
      geoCache.fromMomento(moment);
    } else {
      const coins: Coin[] = [];
      const initialCoinCount = Math.floor(
        luck([cell.i, cell.j, "initialValue"].toString()) * 100
      );
      for (let serial = 0; serial < initialCoinCount; serial++) {
        coins.push({ cell, serial });
      }
      geoCache.coins = coins;
      geoCaches.set(cell, geoCache.toMomento());
    }

    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${cell.i},${cell.j}". It has value <span id="value">${geoCache.coins.length}</span>.</div>
                <div class="coinInfo" style="height: 100px; overflow-y: scroll;"></div>
                <button id="poke">poke</button>
                <button id="deposit">deposit</button>`;

    const coinInfo = container.querySelector<HTMLDivElement>(".coinInfo")!;
    coinInfo.innerHTML = getCoinInfoHtml(geoCache);

    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    poke.addEventListener("click", () => {
      if (geoCache.coins.length <= 0) {
        alert("You have poked the pit too much and it has disappeared!");
        return;
      }

      CURRENT_COIN = geoCache.removeCoin();
      if (CURRENT_COIN) {
        PLAYER_COINS.push(CURRENT_COIN);
      }
      geoCaches.set(cell, geoCache.toMomento());

      points++;
      statusPanel.innerHTML = `${points} points accumulated`;
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        geoCache.coins.length.toString();

      coinInfo.innerHTML = getCoinInfoHtml(geoCache);
    });

    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      if (points <= 0) {
        alert("You have no points to deposit!");
        return;
      }

      geoCache.depositCoin(PLAYER_COINS.pop()!);
      geoCaches.set(cell, geoCache.toMomento());

      coinInfo.innerHTML = getCoinInfoHtml(geoCache);
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        geoCache.coins.length.toString();
      points--;
      statusPanel.innerHTML =
        points === 0 ? `No points yet...` : `${points} points accumulated`;
    });

    return container;
  });
  pit.addTo(map);
  onMapPits.push(pit);
}

updateCacheLocations(MERRILL_CLASSROOM);

function getCoinInfoHtml(geoCache: Geocache): string {
  const coinList = geoCache.coins;

  const coinInfoHtml = coinList
    .map(
      (coin) => `
    <div>
      Coin: {i: ${coin.cell.i}, j: ${coin.cell.j}, serial: ${coin.serial}}
    </div>`
    )
    .join(``);

  return coinInfoHtml;
}

// function cellToString(cell: Cell): string {
//   return `${cell.i},${cell.j}`;
// }

function updatePlayerPosition(direction: string) {
  const position = playerMarker.getLatLng();
  switch (direction) {
    case "north":
      position.lat += TILE_DEGREES;
      break;
    case "south":
      position.lat -= TILE_DEGREES;
      break;
    case "east":
      position.lng += TILE_DEGREES;
      break;
    case "west":
      position.lng -= TILE_DEGREES;
      break;
    default:
      console.error("Invalid direction");
  }
  playerMarker.setLatLng(position);
  map.setView(position);
  updateCacheLocations(position);
}

function updateCacheLocations(currentPosition: leaflet.LatLng) {
  removeAllPits();

  board.getCellsNearPoint(currentPosition).forEach((cell) => {
    if (luck([cell.i, cell.j].toString()) < PIT_SPAWN_PROBABILITY) {
      makePit(cell);
    }
  });
}

function removeAllPits() {
  onMapPits.forEach((pit) => pit.removeFrom(map));
  onMapPits.length = 0;
}
