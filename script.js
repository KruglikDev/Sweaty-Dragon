"use strict";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const form = document.querySelector(".form"),
  containerWorkouts = document.querySelector(".workouts"),
  inputType = document.querySelector(".form__input_type"),
  inputDistance = document.querySelector(".form__input_distance"),
  inputDuration = document.querySelector(".form__input_duration"),
  inputCadence = document.querySelector(".form__input_cadence"),
  inputElevation = document.querySelector(".form__input_elevation"),
  popupQuestion = document.querySelector(".popup-question"),
  images = popupQuestion.querySelectorAll("img"),
  logoBlock = document.querySelector(".logo-block"),
  sidebar = document.querySelector(".sidebar"),
  logo = document.querySelector(".logo"),
  buttons = document.querySelectorAll(".form__btn"),
  closingIcon = document.querySelector(".logo-block__icon"),
  root = document.documentElement;

class Workout {
  date = new Date();
  id = parseInt((Date.now() * Math.random()) / 500);

  constructor(coords, distance, duration, tstype) {
    this.coords = coords; //[lat, lng]
    this.distance = distance; //km
    this.duration = duration; //mins
    this.tstype = tstype;
    this._setDescription();
  }

  _setDescription() {
    this.description = `${logo.getAttribute("alt")[0].toUpperCase()}${logo
      .getAttribute("alt")
      .slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence, tstype) {
    super(coords, distance, duration, tstype);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevation, tstype) {
    super(coords, distance, duration, tstype);
    this.elevation = elevation;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #allCoords = [];
  #allPolylines = [];
  #coords;
  #map;
  #tstype;
  #polyline;
  #workouts = [];
  #markers = [];

  constructor() {
    this._getPosition();

    // GET DATA FROM LOCALSTORAGE
    this._getLocalStorage();

    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));

    document.getElementById("map").addEventListener("click", () => {
      if (!inputDistance.value) {
        inputDistance.focus();
      } else if (!inputDuration.value) {
        inputDuration.focus();
      } else {
        inputDistance.focus();
      }
    });

    images.forEach((image) => {
      image.addEventListener("click", (e) => {
        let transportType = e.target.getAttribute("alt");
        this._setStyle(transportType);
      });
    });

    closingIcon.addEventListener("click", () => {
      this._toggleSidebar();
    });

    // SWITCH STYLE
    logo.addEventListener("click", (e) => {
      this._toggleSidebar();
      this._setStyle(e.target.getAttribute("src"));
    });

    form.addEventListener("submit", this._newWorkout.bind(this));
  }

  _toggleSidebar() {
    sidebar.classList.toggle("sidebar_hidden");
    logoBlock.lastElementChild.classList.toggle("form__row_hidden");
    logoBlock.querySelector("h2").classList.toggle("form__row_hidden");
    buttons.forEach((el) => el.classList.toggle("form__row_hidden"));
    if (sidebar.classList.contains("sidebar_hidden")) {
      closingIcon.setAttribute("src", "images/arrows-svgrepo.svg");
    } else {
      closingIcon.setAttribute("src", "images/compress-alt-solid.svg");
    }
  }

  _setStyle(type) {
    if (type === "running" || type === "images/bycicle-logo.png") {
      logoBlock.lastElementChild.setAttribute("src", "images/logo.png");
      logoBlock.lastElementChild.setAttribute("alt", "running");
      root.style.setProperty("--color-brand", "#00c46954");
      inputElevation.parentElement.classList.add("form__row_hidden");
      inputCadence.parentElement.classList.remove("form__row_hidden");
      this.#tstype = "running";
    } else {
      logoBlock.lastElementChild.setAttribute("src", "images/bycicle-logo.png");
      logoBlock.lastElementChild.setAttribute("alt", "cycling");
      root.style.setProperty("--color-brand", "#ffb54577");
      inputCadence.parentElement.classList.add("form__row_hidden");
      inputElevation.parentElement.classList.remove("form__row_hidden");
      this.#tstype = "cycling";
    }
    popupQuestion.style.display = "none";
    form.classList.remove("hidden");
    inputDistance.focus();
    this._toggleSidebar();
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
      alert("Could not get your position!");
    });
  }

  _loadMap(position) {
    const { longitude, latitude } = position.coords;

    this.#coords = [latitude, longitude];
    this.#map = L.map("map").setView(this.#coords, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", (mapEvent) => {
      this._renderWorkoutMarker(mapEvent);
    });

    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }

  _renderWorkoutMarker(mapEvent) {
    if (mapEvent.latlng) {
      this.#coords = [mapEvent.latlng.lat, mapEvent.latlng.lng];
    } else {
      this.#coords = [mapEvent.coords[0], mapEvent.coords[1]];
    }

    this.#allCoords.push(this.#coords);

    const fireIcon = L.icon({
      iconUrl: "images/fire.png",
      iconSize: [30, 30],
    });

    let marker = L.marker(this.#coords, { icon: fireIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "running-popup",
        })
      )
      .setPopupContent(
        `${this.#tstype === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${logo
          .getAttribute("alt")[0]
          .toUpperCase()}${logo.getAttribute("alt").slice(1)} on ${
          months[new Date().getMonth()]
        } ${new Date().getDate()}`
      )
      .openPopup();

    document.querySelectorAll(".leaflet-marker-icon").forEach((icon) => {
      icon.addEventListener("click", (e) => {
        e.target.remove();
        this.#map.removeLayer(this.#polyline);
      });
    });

    // CLEAR MAP LISTENER
    document
      .querySelector(".form__btn_clear-map")
      .addEventListener("click", () => {
        this._clearMap();
      });

    if (
      this.#allCoords.length >= 2 &&
      document.querySelector(".form__checkbox").checked
    ) {
      let newCoords = [
        this.#allCoords[this.#allCoords.length - 2],
        this.#allCoords[this.#allCoords.length - 1],
      ];
      this.#polyline = L.polyline(newCoords, { color: "orangered" }).addTo(
        this.#map
      );
      this.#map.fitBounds(this.#polyline.getBounds());
      this.#allPolylines.push(this.#polyline);
    }
    this.#markers.push(marker);
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every((input) => input > 0);

    e.preventDefault();

    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    if (this.#tstype === "running") {
      const cadence = +inputCadence.value;

      if (
        !validInputs(duration, distance, cadence) ||
        !allPositive(duration, distance, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running(
        this.#coords,
        distance,
        duration,
        cadence,
        this.#tstype
      );
    }

    if (this.#tstype === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInputs(duration, distance, elevation) ||
        !allPositive(duration, distance)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Cycling(
        this.#coords,
        distance,
        duration,
        elevation,
        this.#tstype
      );
    }

    this.#workouts.push(workout);
    this._renderWorkout(workout);
    // SET LOCAL STORAGE
    this._setLocalStorage();

    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        "";
  }

  _renderWorkout(workout) {
    const html = `
    <li class="workout" data-id="${workout.id}">
    <img class="workout__xmark" src="images/xmark.svg" alt="xmark">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          this.#tstype === "running" || workout.tstype === "running"
            ? "🏃‍♂️"
            : "🚴‍♀️"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${
          this.#tstype === "running" || workout.tstype === "running"
            ? workout.pace.toFixed(1)
            : workout.speed.toFixed(1)
        }</span>
        <span class="workout__unit">${
          this.#tstype === "running" ? "km/min" : "km/h"
        }</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${
          this.#tstype === "running" || workout.tstype === "running"
            ? "🦶🏼"
            : "⛰"
        }</span>
        <span class="workout__value">${
          this.#tstype === "running" || workout.tstype === "running"
            ? workout.cadence
            : workout.elevation
        }</span>
        <span class="workout__unit">${
          this.#tstype === "running" || workout.tstype === "running"
            ? "spm"
            : "m"
        }</span>
      </div>
    </li>
    `;

    form.insertAdjacentHTML("afterend", html);

    // REMOVING FROM LIST
    document.querySelector(".workout__xmark").addEventListener("click", (e) => {
      console.log(e.target.parentElement);
      this.#markers.forEach((marker) => {
        if (marker.id == e.target.parentElement.dataset.id) {
          this.#map.removeLayer(marker);
          this.#markers = this.#markers.filter((el) => el.id !== marker.id);
        }
      });
      e.target.parentElement.remove();

      // REMOVE FROM LOCALSTORAGE
      let storage = JSON.parse(localStorage.getItem("workout"));
      storage = storage.filter(
        (el) => el.id != e.target.parentElement.dataset.id
      );
      this._setLocalStorage(storage);
    });
  }

  ////////MOVING TO POPUP ONCLICK IN THE LIST
  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id == workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // CLEAR MAP FUNCTION
  _clearMap() {
    this.#markers.forEach((marker) => this.#map.removeLayer(marker));
    this.#markers = [];

    if (this.#allPolylines) {
      this.#allPolylines.forEach((poly) => this.#map.removeLayer(poly));
    }

    if (this.#polyline) {
      this.#map.removeLayer(this.#polyline);
      this.#polyline.remove(this.#map);
    }
    this.#allCoords = [];
  }

  _setLocalStorage(data) {
    if (data) {
      localStorage.setItem("workout", JSON.stringify(data));
    } else {
      localStorage.setItem("workout", JSON.stringify(this.#workouts));
    }
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));
    console.log(data);

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }
}

const app = new App();

// CLEAR LIST LISTENER
document
  .querySelector(".form__btn_clear-list")
  .addEventListener("click", () => {
    localStorage.clear();
    document.querySelectorAll(".workout").forEach((el) => el.remove());
  });
