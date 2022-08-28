'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');

/****************************************************************/

// 254. Работа с Данными Тренировки - Создание Классов

class Workout {
  date = new Date();

  id = (Date.now() + '').slice(-10);

  clickNumber = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.duration = duration; // km
    this.distance = distance; // min
  }

  _setDescription() {
    this.type === 'running'
      ? (this.description = `Пробіжка ${new Intl.DateTimeFormat('ua-Ua').format(
          this.date
        )}`)
      : (this.description = `Велотренування ${new Intl.DateTimeFormat(
          'ua-Ua'
        ).format(this.date)}`);
  }

  click() {
    this.clickNumber++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }

  calculatePace() {
    // min/km
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }

  calculateSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
  }
}

// const running = new Running([50, 39], 7, 40, 170);
// const cycling = new Cycling([50, 39], 37, 80, 370);

// console.log(running, cycling);

/****************************************************************/

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Отримання місцеположення кристувача
    this._getPosition();

    // Отриманна даних із Local srorage
    this._getLocalStorageData();

    // 251. Размещение Формы Ввода Тренировки

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleClimbField);

    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Неможливо отримати ваше місцезнаходження');
        }
      );
    }
  }

  _loadMap(position) {
    // console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(
    //   `https://www.google.com.ua/maps/@${latitude},${longitude},13z?hl=uk&authuser=0`
    // );

    const coords = [latitude, longitude];

    // console.log(this);

    /****************************************************************/
    // 249. Отображение Карты с Помощью Библиотеки Leaflet

    this.#map = L.map('map').setView(coords, 13);
    // console.log(map);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    /****************************************************************/

    // 250. Отображение Маркера на Карте

    // Опрацювання кліка на карті
    this.#map.on('click', this._showForm.bind(this));

    // Відображення тренувань на карті із Local srorage
    this.#workouts.forEach(workout => {
      this._displayWorkout(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    // console.log(#mapEvent);
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputTemp.value =
      inputClimb.value =
        '';
    form.classList.add('hidden');
  }

  _toggleClimbField() {
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Функція провірки чи введені дані є числами
    const areNumbers = (...numbers) =>
      numbers.every(num => Number.isFinite(num));

    // Функція провірки чи числа є позитивними
    const areNumbersPositive = (...numbers) => numbers.every(num => num > 0);

    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    // Отримати дані із форми

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // Якщо тренування є пробіжкою, створити об'єкт Running
    if (type === 'running') {
      const temp = +inputTemp.value;

      // Перевірка валідності даних
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(temp)

        !areNumbers(distance, duration, temp) ||
        !areNumbersPositive(distance, duration, temp)
      )
        return alert('Введіть позитивне число!');

      workout = new Running([lat, lng], distance, duration, temp);
    }

    // Якщо тренування є велотренуванням, створити об'єкт Cycling
    if (type === 'cycling') {
      const climb = +inputClimb.value;

      // Перевірка валідності даних
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(climb)
        !areNumbers(distance, duration, climb) ||
        !areNumbersPositive(distance, duration)
      )
        return alert('Введіть позитивне число!');

      workout = new Cycling([lat, lng], distance, duration, climb);
    }

    // Додати новий об'єкт в масив тренувань

    this.#workouts.push(workout);

    // Відобразити тренування на карті

    this._displayWorkout(workout);

    // Відобразити тренування в списку

    this._displayWorkoutOnSidebar(workout);

    // Сховати форму і очистка поля вводу

    this._hideForm();

    // Додати всі тренування в локальне сховище
    this._addWorkoutsToLocalStorage();
  }

  // Відображення маркера
  // console.log(this.#mapEvent);і

  _displayWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚵‍♂️'}${workout.description}`
      )
      .openPopup();
  }

  _displayWorkoutOnSidebar(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃' : '🚵‍♂️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">км</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">хв</span>
      </div>`;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">📏⏱</span>
        <span class="workout__value">${workout.pace.toFixed(2)}</span>
        <span class="workout__unit">хв/км</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">👟⏱</span>
        <span class="workout__value">${workout.temp}</span>
        <span class="workout__unit">кроки/хв</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">📏⏱</span>
        <span class="workout__value">${workout.speed.toFixed(2)}</span>
        <span class="workout__unit">км/год</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🏔</span>
        <span class="workout__value">${workout.climb}</span>
        <span class="workout__unit">м</span>
      </div>
    </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToWorkout(e) {
    const workoutElement = e.target.closest('.workout');

    // console.log(workoutElement);

    if (!workoutElement) return;

    const workout = this.#workouts.find(
      item => item.id === workoutElement.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click();

    // console.log(workout);
  }

  // 258. Работа с localStorage

  _addWorkoutsToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorageData() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) return;
    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this._displayWorkoutOnSidebar(workout);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

/*******************************************************************/
