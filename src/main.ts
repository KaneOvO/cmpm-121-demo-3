import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
import { Board } from "./board";
import { Cell } from "./board";
import { Coin } from "./coin";
import { Coins } from "./coin";

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
const pitGeneratedFlags: Record<string, boolean> = {};
const pitValue: Record<string, number> = {};

const mapContainer = document.querySelector<HTMLElement>("#map")!;
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);
const coins = new Coins();

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

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

function makePit(cell: Cell) {
  const bounds = board.getCellBounds(cell);

  const pit = leaflet.rectangle(bounds) as leaflet.Layer;

  pit.bindPopup(() => {
    if (!pitGeneratedFlags[cellToString(cell)]) {
      pitValue[cellToString(cell)] = Math.floor(
        luck([cell.i, cell.j, "initialValue"].toString()) * 100
      );

      for (let i = 0; i < pitValue[cellToString(cell)]; i++) {
        coins.addCoin(cell);
      }

      pitGeneratedFlags[cellToString(cell)] = true; // 设置标志，表示已经生成过硬币
    }

    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${cell.i},${
      cell.j
    }". It has value <span id="value">${
      pitValue[cellToString(cell)]
    }</span>.</div>
                <div class="coinInfo" style="height: 100px; overflow-y: scroll;"></div>
                <button id="poke">poke</button>
                <button id="deposit">deposit</button>`;

    const coinInfo = container.querySelector<HTMLDivElement>(".coinInfo")!;
    coinInfo.innerHTML = getCoinInfoHtml(cell);

    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    poke.addEventListener("click", () => {
      if (pitValue[cellToString(cell)] <= 0) {
        alert("You have poked the pit too much and it has disappeared!");
        return;
      }
      points++;
      statusPanel.innerHTML = `${points} points accumulated`;
      pitValue[cellToString(cell)]--;
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        pitValue[cellToString(cell)].toString();

      CURRENT_COIN = coins.removeCoin(cell);
      if (CURRENT_COIN) {
        PLAYER_COINS.push(CURRENT_COIN);
      }
      coinInfo.innerHTML = getCoinInfoHtml(cell);
    });

    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      if (points <= 0) {
        alert("You have no points to deposit!");
        return;
      }

      pitValue[cellToString(cell)]++;
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        pitValue[cellToString(cell)].toString();
      points--;
      statusPanel.innerHTML =
        points === 0 ? `No points yet...` : `${points} points accumulated`;

      coins.depositCoin(cell, PLAYER_COINS.pop()!);
      coinInfo.innerHTML = getCoinInfoHtml(cell);
    });

    return container;
  });
  pit.addTo(map);
}

board.getCellsNearPoint(MERRILL_CLASSROOM).forEach((cell) => {
  if (luck([cell.i, cell.j].toString()) < PIT_SPAWN_PROBABILITY) {
    makePit(cell);
  }
});

function getCoinInfoHtml(cell: Cell): string {
  const coinList = coins.getCoins(cell);

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

function cellToString(cell: Cell): string {
  return `${cell.i},${cell.j}`;
}
