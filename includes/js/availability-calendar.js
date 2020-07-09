/* global availabilityCalendar, jQuery */
jQuery(document).ready(function ($) {

    /**
     * Calendar type when no arrival or departure inputs are defined.
     *
     * @type {string}
     */
    const display = 'display';

    /**
     * Calendar type when both arrival and departure fields are defined.
     *
     * @type {string}
     */
    const active = 'active';

    /**
     * Calendar state when it is waiting for arrival date. Default calendar state.
     *
     * @type {string}
     */
    const arrival = 'arrival';

    /**
     * Calendar state when it is waiting for departure date. Available only for calendars with type 'active'.
     *
     * @type {string}
     */
    const departure = 'departure';

    /**
     *
     * @param {Object} object
     * @returns {null|*}
     */
    function getObjectLastItem(object) {
        let keys = Object.keys(object);
        if (0 >= keys.length) {
            return null;
        }
        return object[keys[keys.length - 1]];
    }

    /**
     * Adds days to provided date returning new date object.
     * @param {Date} date
     * @param {Number} days
     * @returns {Date}
     */
    function dateAddDays(date, days) {
        let newDate = new Date(date.getTime());
        newDate.setDate(date.getDate() + days);
        return newDate;
    }

    /**
     *
     * @param {Date} date
     * @param {string} format
     * @returns {string}
     */
    function dateToString(date, format) {
        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
        return $.datepicker.formatDate(format, date);
    }

    /**
     *
     * @param {string} date
     * @param {string} format
     * @returns {Date}
     */
    function stringToDate(date, format) {
        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
        return $.datepicker.parseDate(format, date);
    }

    /**
     *
     * @param {string} date
     * @param {string} format
     * @param {string} outputFormat
     * @returns {string}
     */
    function convertDate(date, format, outputFormat) {
        return dateToString(stringToDate(date, format), outputFormat);
    }

    /**
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarInstance(calendar) {
        return getElementData('instance', calendar);
    }

    /**
     * @param {HTMLElement} calendar
     * @returns {object}
     */
    function getCalendarParameters(calendar) {
        let i = getCalendarInstance(calendar);
        // noinspection JSUnresolvedVariable
        return (undefined === availabilityCalendar.calendars[i]) ? {} : availabilityCalendar.calendars[i].parameters;
    }

    /**
     *
     * @param {string} name
     * @param {HTMLElement} calendar
     * @returns {*}
     */
    function getCalendarParameter(name, calendar) {
        let parameters = getCalendarParameters(calendar);
        return (undefined === parameters[name]) ? null : parameters[name];
    }

    /**
     *
     * @param {string} field
     * @param {HTMLElement} calendar
     * @returns {HTMLElement|null}
     */
    function getCalendarInputField(field, calendar) {
        switch (field) {
            case 'arrival':
                return document.getElementById(getCalendarParameter('arrivalId', calendar));
            case 'arrivalDisplay':
                return document.getElementById(getCalendarParameter('arrivalIdDisplay', calendar));
            case 'departure':
                return document.getElementById(getCalendarParameter('departureId', calendar));
            case 'departureDisplay':
                return document.getElementById(getCalendarParameter('departureIdDisplay', calendar));
            default:
                return null;
        }
    }

    /**
     *
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarType(calendar) {
        let currentType = getElementData('type', calendar);
        if (null === currentType) {
            currentType = (
                (null === getCalendarInputField(arrival, calendar))
                || (null === getCalendarInputField(departure, calendar))
            ) ? display : active;
            setElementData('type', currentType, calendar);
        }
        return currentType;
    }

    /**
     * @param {HTMLElement} calendar
     * @returns {object}
     */
    function getCalendarAvailability(calendar) {
        let i = getCalendarInstance(calendar);
        // noinspection JSUnresolvedVariable
        return (undefined === availabilityCalendar.calendars[i]) ? {} : availabilityCalendar.calendars[i].availability;
    }

    /**
     *
     * @param {string} key
     * @param {HTMLElement} element
     * @returns {string|null}
     */
    function getElementData(key, element) {
        return element.getAttribute('data-' + key);
    }

    /**
     *
     * @param {string} key
     * @param {string} value
     * @param {HTMLElement} element
     */
    function setElementData(key, value, element) {
        element.setAttribute('data-' + key, value);
    }

    /**
     *
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarState(calendar) {
        let state = getElementData('state', calendar);
        if (null === state) {
            state = arrival;
            setCalendarState(calendar, state);
        }
        return state;
    }

    /**
     *
     * @param {HTMLElement} calendar
     * @param {string} state
     */
    function setCalendarState(calendar, state) {
        state = ('undefined' === typeof state) ? arrival : state;
        setElementData('state', state, calendar);
    }

    /**
     * Switches calendar state and updates cell data.
     *
     * @param {HTMLElement} calendar
     */
    function changeCalendarState(calendar) {
        //get current calendar state
        let state = getCalendarState(calendar);
        //update calendar state
        let newState = (arrival === state) ? departure : arrival;
        setCalendarState(calendar, newState);
        //update calendar cells
        lateUpdateCalendarCellData(calendar);
    }

    /**
     *
     * @param {HTMLElement} calendar
     */
    function updateCalendarCellData(calendar) {
        let showRates = (true === getCalendarParameter('showRates', calendar));
        //if no show rates - return for now
        if (!showRates) {
            return;
        }
        let format = getCalendarParameter('dateFormat', calendar);
        let dates = getCalendarAvailability(calendar);
        // noinspection JSUnresolvedFunction
        $(calendar).find('.ui-datepicker-calendar td > *[class*="ui-state"]').each(function () {
            let day = this.textContent;
            if ('' !== day) {
                let date = new Date(
                    parseInt(this.parentNode.getAttribute('data-year')),
                    parseInt(this.parentNode.getAttribute('data-month')),
                    parseInt(this.textContent),
                    0, 0, 0, 0
                );
                if (date instanceof Date && !isNaN(date)) {
                    let dateString = dateToString(date, format);
                    if (
                        dates.hasOwnProperty(dateString)
                        && ('undefined' !== typeof dates[dateString].rate)
                        && ('' !== dates[dateString].rate)
                    ) {
                        if (null === getElementData('rate', this.parentNode)) {
                            setElementData('rate', dates[dateString].rate, this.parentNode);
                            let rate = document.createElement('span');
                            rate.className = 'nightly-rate';
                            rate.appendChild(document.createTextNode(dates[dateString].rate));
                            this.parentNode.appendChild(rate);
                        }
                    }
                }
            }
        });
    }

    /**
     *
     * @param {HTMLElement} calendar
     */
    function lateUpdateCalendarCellData(calendar) {
        window.setTimeout(function (calendar) {
            updateCalendarCellData(calendar);
        }, 250, calendar);
    }

    /**
     *
     * @param {Date} current
     * @returns {*[]}
     */
    function beforeShowDay(current) {
        //initiate classes and messages
        let classes = [];
        let messages = [];
        //initiate arrival and departure selected dates
        let selectedArrival = null;
        let selectedDeparture = null;
        //get calendar type
        let type = getCalendarType(this);
        //get calendar current state
        let state = getCalendarState(this);
        //get calendar date format
        let format = getCalendarParameter('dateFormat', this);
        //get dates
        let dates = getCalendarAvailability(this);
        //get current date as string to use as key in dates
        let date = dateToString(current, format);
        //handle the selected dates if needed
        if ('active' === type) {
            //grab selected arrival date
            let arrivalInput = getCalendarInputField('arrival', this);
            selectedArrival = ('' === arrivalInput.value) ? stringToDate(arrivalInput.value, format) : null;
            //handle case the current is selected arrival
            if (selectedArrival === current) {
                classes.push('selected-arrival');
                messages.push('Your selected arrival date.');
            }
            //grab selected departure date
            let departureInput = getCalendarInputField('arrival', this);
            selectedDeparture = ('' === departureInput.value) ? stringToDate(departureInput.value, format) : null;
            if (selectedDeparture === current) {
                classes.push('selected-departure');
                messages.push('Your selected departure date.');
            }
            //handle stay period
            if ((null !== selectedArrival) && (null !== selectedDeparture)) {
                if (selectedArrival < current < selectedDeparture) {
                    classes.push('selected-date');
                    messages.push('Your stay period.');
                }
            }
        }
        //reject dates before min date
        if (current < stringToDate(getCalendarParameter('firstDate', this), format)) {
            return [false, classes.join(' '), messages.join(' ')];
        }
        //reject dates after max date
        let lastDay = null;
        let lastDate = getCalendarParameter('lastDate', this);
        // noinspection JSUnresolvedVariable
        let maxDate = ('arrival' === state) ? lastDate : ((null === (lastDay = getObjectLastItem(dates))) ? lastDate : lastDay.date);
        if (current > stringToDate(maxDate, format)) {
            return [false, classes.join(' '), messages.join(' ')];
        }
        //see if key is present in dates and return unavailable if not
        if (!dates.hasOwnProperty(date)) {
            return [false, classes.join(' '), messages.join(' ')];
        }
        //departure state is available only for calendars with arrival date selected, handle it here
        if (('departure' === state) && (null !== selectedArrival)) {
            //grab minimum stay for current date
            // noinspection JSUnresolvedVariable
            let minStay = (0 === dates[date].minStay) ? getCalendarParameter('minStay', this) : dates[date].minStay;
            //disable all dates before arrival + minimum stay
            if (current < dateAddDays(selectedArrival, minStay)) {
                return [false, classes.join(' '), messages.join(' ')];
            }
        }
        //build logic for arrival state
        if ('arrival' === state) {
            //see if date is allowed for arrivals
            let arrivalsAllowed = (true === dates[date].arrival);
            //handle arrivals allowed case
            if (!arrivalsAllowed) {
                classes.push('arrivals-not-allowed');
            }
            //see if date is available
            // noinspection JSUnresolvedVariable
            let available = (true === dates[date].available);
            //check for arrival / departure only cases
            //get yesterday date
            let yesterday = dateToString(dateAddDays(current, -1), format);
            // noinspection JSUnresolvedVariable
            let availableYesterday = dates.hasOwnProperty(yesterday) ? (true === dates[yesterday].available) : false;
            if (!available) {
                //handle not available case
                classes.push('unavailable');
                messages.push('Unavailable.');
                //handle conflicts with selected period
                if (
                    (current === selectedArrival)
                    || (
                        (null !== selectedArrival) && (null !== selectedDeparture)
                        && (selectedArrival < current < selectedDeparture)
                    )
                ) {
                    classes.push('selected-conflict');
                    messages.push('Conflicts with your selected period.');
                }
                //handle departure only case
                if (availableYesterday) {
                    classes.push('departure-only');
                    messages.push('Departure only.');
                }
                return [false, classes.join(' '), messages.join(' ')];
            } else {
                //handle available case
                classes.push('available');
                //are arrival allowed this day?
                if (arrivalsAllowed) {
                    messages.push('Available for arrival.');
                    // noinspection JSUnresolvedVariable
                    messages.push(parseInt(dates[date].minStay).toString() + ' night(s) minimum stay.');
                } else {
                    messages.push('Available. Arrivals are not allowed this day.');
                }
                // noinspection JSUnresolvedVariable
                messages.push('Rates from ' + dates[date].rate + '/night.');
                if (!availableYesterday) {
                    classes.push('arrival-only');
                }
                return [arrivalsAllowed, classes.join(' '), messages.join(' ')];
            }
        }
        //handle the 'departure' state
        else {
            //see if date is allowed for departures
            let departuresAllowed = (true === dates[date].departure);
            //handle arrivals allowed case
            if (!departuresAllowed) {
                classes.push('departures-not-allowed');
            }
        }

        return [false, classes.join(' '), messages.join(' ')];
    }

    /**
     *
     * @param {string} dateString
     * @param {Object} instance
     * @param {HTMLElement} calendar
     */
    function onSelect(dateString, instance, calendar) {
        //get current calendar state
        let state = getCalendarState(calendar);
        //update calendar input field
        let inputField = getCalendarInputField(state, calendar);
        inputField.value = dateString;
        //update calendar display input
        let displayInputField = getCalendarInputField(state + 'Display', calendar);
        if (null !== displayInputField) {
            // noinspection JSUnresolvedVariable
            displayInputField.value = convertDate(dateString, instance.settings.dateFormat, instance.settings.altFormat);
        }
        //change calendar state
        changeCalendarState(calendar);
    }

    /**
     * @param {number} order
     * @param {HTMLElement} calendar
     */
    function initiateCalendar(order, calendar) {
        console.log(availabilityCalendar);
        //on init set calendar to 'arrival' state
        setCalendarState(calendar, arrival);
        //grab calendar parameters
        let calendarParameters = getCalendarParameters(calendar);
        //see what type of calendar we have
        let calendarType = getCalendarType(calendar);
        // noinspection JSUnresolvedVariable
        let parameters = {
            //handle days display
            beforeShowDay: beforeShowDay,
            //handle formats
            altFormat: calendarParameters.dateFormatDisplay,
            dateFormat: calendarParameters.dateFormat,
            //handle week start and current day
            firstDay: calendarParameters.weekStart,
            defaultDate: null,
            gotoCurrent: true,
            //max and min dates
            maxDate: calendarParameters.lastDate,
            minDate: calendarParameters.firstDate,
            //months display
            showOtherMonths: false,
            numberOfMonths: 3,
            //show rates
            onChangeMonthYear: function () {
                lateUpdateCalendarCellData(this);
            }
        };
        switch (calendarType) {
            //if simple display - build 'display only' calendar
            case display:
                // noinspection JSUnresolvedFunction
                $(calendar).datepicker(parameters);
                break;
            //else attach select date functionality and build calendar
            case active:
            default:
                parameters.onSelect = function (dateString, instance) {
                    onSelect(dateString, instance, this);
                };
                // noinspection JSUnresolvedFunction
                $(calendar).datepicker(parameters);
                break;
        }
        lateUpdateCalendarCellData(calendar);
    }

    //todo: handle in availabilityCalendar.messages
    availabilityCalendar.messages = {};

    // noinspection JSUnresolvedFunction
    $('.availability-calendar').each(initiateCalendar);
});