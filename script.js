'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.querySelector('.sidebar__toggle');
const sidebarClose = document.querySelector('.sidebar__close');

class Workout {
  _id = Math.trunc(Math.random() * 1000000);
  _date = new Date();

  constructor(distance, duration, coords) {
    // this.#date = new Date();
    this.distance = distance; // km
    this.duration = duration; // min
    this.coords = coords; // [lat, lang]
    // this.#makeTitle();
  }

  // make title
  _makeTitle() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.title = `${this._type[0].toUpperCase()}${this._type.slice(1)} on ${
      months[this._date.getMonth()]
    } ${this._date.getDate()}`;
  }
}

class Running extends Workout {
  _type = 'running';

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._makeTitle();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1); // min / km
  }
}

class Cycling extends Workout {
  _type = 'cycling';

  constructor(distance, duration, coords, elevGain) {
    super(distance, duration, coords);
    this.elevGain = elevGain;
    this.calcSpeed();
    this._makeTitle();
  }

  calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1); // km / h
  }
}

class App {
  #workouts = [];
  #map;
  #mapEvent;

  constructor() {
    this.#getPosition();
    this.#toggleElevationField();
    this.#getLocalStorage();

    form.addEventListener('submit', this.#newWorkout.bind(this));
    containerWorkouts.addEventListener('click', e => {
      this.#moveToPopup(e);
      this.#toggleSlider();
    });
    sidebarToggle.addEventListener('click', this.#toggleSlider);
    sidebarClose.addEventListener('click', this.#toggleSlider);
  }

  #getPosition() {
    // geolaction API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Sizning joyingiz aniqlanmadi');
        }
      );
    }
  }

  #loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    // Leaflet JS library
    this.#map = L.map('map').setView(coords, 14);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // addEventListener = on
    this.#map.on('click', () => {
      this.#toggleSlider(), setTimeout(this.#showForm.bind(this), 300);
    });

    this.#workouts.forEach(el => {
      this.#renderMarker(el);
    });
  }

  #showForm(event) {
    this.#mapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #toggleElevationField() {
    inputType.addEventListener('change', () => {
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
      inputElevation
        .closest('.form__row')
        .classList.toggle('form__row--hidden');
    });
  }

  #newWorkout(e) {
    e.preventDefault();

    const isValid = (...nums) => {
      return nums.every(el => el > 0);
    };

    // Get data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const coords = [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng];
    let workout;

    if (type == 'running') {
      const cadence = +inputCadence.value;

      // Guard: check is data valid
      if (!isValid(distance, duration, cadence)) {
        alert("Ma'lumotlar musbat sonolardan kiritilishi kerak");
        return;
      }
      workout = new Running(distance, duration, coords, cadence);
    } else {
      const elevGain = +inputElevation.value;

      if (!isValid(distance, duration, elevGain)) {
        alert("Ma'lumotlar natural sonolardan iborat bo'lishi kerak");
        return;
      }
      workout = new Cycling(distance, duration, coords, elevGain);
    }

    // add new data to workouts array
    this.#workouts.push(workout);

    // render mark
    this.#renderMarker(workout);

    // render workout
    this.#renderWorkout(workout);

    // hide form
    this.#hideForm();

    // set workouts to lacal storage
    this.#setLocalStorage();
  }

  // marker on map
  #renderMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          content: `${workout._type == 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
            workout.title
          }`,
          className: `${workout._type}-popup`,
        })
      )
      .openPopup();
  }

  // data on sidebar
  #renderWorkout(workout) {
    let workoutHtml = `
    <li class="workout workout--${workout._type}" data-id="${workout._id}">
      <h2 class="workout__title">${workout.title}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout._type == 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout._type == 'running') {
      workoutHtml += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout._type == 'cycling') {
      workoutHtml += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon"> ⛰ </span>
          <span class="workout__value">${workout.elevGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li> 
      `;
    }
    form.insertAdjacentHTML('afterend', workoutHtml);
  }

  // hide form
  #hideForm() {
    // clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // move to Popup
  #moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    console.log(this);

    // Guard
    if (!workoutEl) return;

    const findWorkout = this.#workouts.find(
      el => el._id == workoutEl.dataset.id
    );

    this.#map.setView(findWorkout.coords, 16, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #setLocalStorage() {
    console.log(this.workouts);
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(el => {
      this.#renderWorkout(el);
    });
  }

  #toggleSlider() {
    sidebar.classList.toggle('show');
  }

  clearData() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
