import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.selectedTable = '';
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();
  }
  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePickerWidget.minDate);

    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePickerWidget.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsReapeat: [settings.db.repeatParam, endDateParam],
    };

    const urls = {
      booking:
        settings.db.url +
        '/' +
        settings.db.booking +
        '?' +
        params.booking.join('&'),

      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsCurrent.join('&'),

      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsReapeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsReapeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsReapeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsReapeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerWidget.minDate;
    const maxDate = thisBooking.datePickerWidget.maxDate;

    for (let item of eventsReapeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
      }
    }
    console.log('thisBooking booked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);

      if (table.classList.contains(classNames.booking.selectTable)) {
        table.classList.remove(classNames.booking.selectTable);
      }

      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }
  initActions() {
    const thisBooking = this;
    thisBooking.dom.planTable.addEventListener('click', function (event) {
      event.preventDefault();

      const clicedTable = event.target;
      if (clicedTable.classList.contains('booked')) {
        alert('Stolik niedostępny');
      } else {
        for (let table of thisBooking.dom.tables) {
          if (
            table !== clicedTable &&
            table.classList.contains(classNames.booking.selectTable)
          ) {
            table.classList.remove(classNames.booking.selectTable);
          }
        }
        const activeTable = clicedTable.getAttribute(
          settings.booking.tableIdAttribute
        );
        thisBooking.selectedTable = activeTable;
        clicedTable.classList.toggle(classNames.booking.selectTable);
        if (!clicedTable.classList.contains(classNames.booking.selectTable)) {
          thisBooking.selectedTable = '';
        }
      }
    });
  }

  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePickerWidget.value,
      hour: thisBooking.hourPickerWidget.value,
      table: parseInt(thisBooking.selectedTable),
      duration: parseInt(thisBooking.hoursAmountWidget.value),
      ppl: parseInt(thisBooking.peopleAmountWidget.value),
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedRespones', parsedResponse);
        thisBooking.makeBooked(
          payload.date,
          payload.hour,
          payload.duration,
          payload.table
        );
        thisBooking.updateDOM();
      });
  }

  render(element) {
    const thisBooking = this;

    const generateHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;

    thisBooking.dom.wrapper.innerHTML = generateHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.hoursAmount
    );

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );

    thisBooking.dom.planTable = thisBooking.dom.wrapper.querySelector(
      select.containerOf.tablePlan
    );

    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(
      select.booking.form
    );

    thisBooking.dom.address = thisBooking.dom.form.querySelector(
      select.booking.address
    );

    thisBooking.dom.phone = thisBooking.dom.form.querySelector(
      select.booking.phone
    );

    thisBooking.dom.starters = thisBooking.dom.form.querySelectorAll(
      select.booking.checkbox
    );
  }
  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmountWidget = new AmountWidget(
      thisBooking.dom.peopleAmount
    );
    thisBooking.hoursAmountWidget = new AmountWidget(
      thisBooking.dom.hoursAmount
    );

    thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);

    console.log('date picker', thisBooking.datePickerWidget);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.peopleAmount.addEventListener('updated', function (event) {
      event.preventDefault();
    });

    thisBooking.dom.hoursAmount.addEventListener('updated', function (event) {
      event.preventDefault();
    });

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (
        thisBooking.selectedTable == '' ||
        thisBooking.selectedTable == null
      ) {
        alert('Brak wybranego stolika do rezerwacji');
      } else {
        thisBooking.sendBooking();
      }
    });
  }
}

export default Booking;
