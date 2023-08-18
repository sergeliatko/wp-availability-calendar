/* global availabilityCalendar, jQuery */
// noinspection JSUnusedGlobalSymbols
jQuery(document).ready(function ($) {

    /**
     * Atom date format to store date key.
     *
     * @type {string}
     */
    const dateKeyFormat = 'yy-mm-dd';

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

    let resizeTimer = null;

    /**
     * Checks if provided parameter is a number and bigger than zero.
     *
     * @param {*} maybeNumber
     * @returns {boolean}
     */
    function numberBiggerThanZero(maybeNumber) {
        return (
            ('number' === typeof maybeNumber)
            && (0 < maybeNumber)
        );
    }

    /**
     * Checks if object has own property of specified type.
     *
     * @param {string|null} key
     * @param {object} object
     * @param {string} type
     * @returns {boolean}
     */
    function objectHasProperty(key, object, type) {
        return (
            ('string' === typeof key)
            && ('object' === typeof object)
            && (object.hasOwnProperty(key))
            && (type === typeof object[key])
        );
    }

    /**
     *
     * @param {string|null} key
     * @param {object} object
     * @param {string} type
     * @returns {undefined|*}
     */
    function getObjectProperty(key, object, type) {
        return objectHasProperty(key, object, type) ? object[key] : undefined;
    }

    /**
     *
     * @param {string} key
     * @param {HTMLElement} element
     * @returns {string}
     */
    function readElementData(key, element) {
        let data = element.getAttribute('data-' + key);
        return (null === data) ? '' : data;
    }

    /**
     *
     * @param {string} key
     * @param {string} value
     * @param {HTMLElement} element
     */
    function writeElementData(key, value, element) {
        element.setAttribute('data-' + key, value);
    }

    /**
     *
     * @param {string} key
     * @param {HTMLElement} element
     */
    function removeElementData(key, element) {
        element.removeAttribute('data-' + key);
    }

    /**
     *
     * @param {Date} date
     * @param {string} format
     * @returns {string}
     */
    function dateToString(date, format) {
        try {
            // noinspection JSUnresolvedVariable,JSUnresolvedFunction
            return $.datepicker.formatDate(format, date);
        } catch (e) {
            console.log(e);
        }
        return '';
    }

    /**
     *
     * @param {string} date
     * @param {string} format
     * @returns {Date|null}
     */
    function stringToDate(date, format) {
        try {
            // noinspection JSUnresolvedVariable,JSUnresolvedFunction
            return $.datepicker.parseDate(format, date);
        } catch (e) {
            console.log(e);
        }
        return null;
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
     * Compares dates by getTime(). (you may not compare two objects with same value using ===)
     * @param {Date} date1
     * @param {Date} date2
     * @returns {boolean}
     */
    function areDatesEqual(date1, date2) {
        if (
            (null === date1)
            || (null === date2)
            || ('function' !== typeof date1.getTime)
            || ('function' !== typeof date2.getTime)
        ) {
            // no function getTime() in at least one of the dates
            return false;
        }
        return date1.getTime() === date2.getTime();
    }

    /**
     * Checks if given date string is prior to another date string in specific format.
     *
     * @param {string} date
     * @param {string} before
     * @param {string} format
     * @returns {boolean}
     */
    function isDateStringBefore(date, before, format) {
        let theDate = stringToDate(date, format);
        let deadLine = stringToDate(before, format);
        return (
            (null !== theDate)
            && (null !== deadLine)
            && (theDate < deadLine)
        );
    }

    /**
     * Checks if given date string is prior to another date string or same in specific format.
     *
     * @param {string} date
     * @param {string} before
     * @param {string} format
     * @returns {boolean}
     */
    function isDateStringBeforeOrEqual(date, before, format) {
        // compare same dates as strings
        if (date === before) {
            return true;
        }
        let theDate = stringToDate(date, format);
        let deadLine = stringToDate(before, format);
        return (
            (null !== theDate)
            && (null !== deadLine)
            && (theDate < deadLine)
        );
    }

    /**
     * Checks if given date string is within period defined by other two date strings in specific format.
     *
     * @param {string} dateString
     * @param {string} startDateString
     * @param {string} endDateString
     * @param {string} format
     * @returns {boolean}
     */
    function isDateStringInRange(dateString, startDateString, endDateString, format) {
        let date = stringToDate(dateString, format);
        let start = stringToDate(startDateString, format);
        let end = stringToDate(endDateString, format);
        return (
            (null !== date)
            && (null !== start)
            && (null !== end)
            && (start <= date)
            && (date <= end)
        );
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
     * @param {string} cssClasses
     * @param {string} outputFormat
     * @returns {string|undefined}
     */
    function extractDateFromCSSClasses(cssClasses, outputFormat) {
        let match = null;
        let regex = /date-key-(\d{4}-\d{2}-\d{2})/;
        if (
            ('string' === typeof cssClasses)
            && (null !== (match = cssClasses.match(regex)))
            && ('string' === typeof match[1])
        ) {
            return convertDate(match[1], dateKeyFormat, outputFormat);
        }
        return undefined;
    }

    /**
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarInstance(calendar) {
        let instance = readElementData('instance', calendar);
        return ('' === instance) ? '0' : instance;
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
     * @returns {HTMLInputElement|null}
     */
    function getCalendarInputField(field, calendar) {
        let id = getCalendarParameter(field + 'Id', calendar);
        return ((null === id) || ('' === id)) ? null : document.getElementById(id);
    }

    /**
     * Returns visible fields for the provided calendar.
     *
     * @param {string} state
     * @param {HTMLElement} calendar
     * @returns {[]}
     */
    function getVisibleInputFields(state, calendar) {
        let fields = [];
        let types = ['', 'Display'];
        for (let type in types) {
            // noinspection JSUnfilteredForInLoop
            let input = getCalendarInputField(state + types[type], calendar);
            let inputType = null;
            if (
                (null !== input)
                && (null !== (inputType = input.getAttribute('type')))
                && ('hidden' !== inputType)
            ) {
                fields.push(input);
            }
        }
        return fields;
    }

    /**
     * Adds alert if readonly display field if clicked.
     * @param {HTMLElement} calendar
     */
    function maybePreventClickOnDisplayFields(calendar) {
        let key = 'Display';
        let fields = [arrival + key, departure + key];
        for (let i = 0; i < fields.length; i++) {
            let input = getCalendarInputField(fields[i], calendar);
            if (
                (null !== input)
                && ('readonly' === input.getAttribute('readonly'))
            ) {
                let title = input.getAttribute('title');
                if (
                    (null !== title)
                    && ('' !== title)
                ) {
                    // noinspection JSUnresolvedFunction
                    $(input).on('click', function () {
                        alert(this.getAttribute('title'));
                    })
                }
            }
        }
    }

    /**
     * Returns calendar date format or default format string.
     *
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarDateFormat(calendar) {
        let format = getCalendarParameter('dateFormat', calendar);
        // noinspection JSUnresolvedVariable
        return (
            ('string' === typeof format)
            && ('' !== format)
        ) ? format : availabilityCalendar.defaults.dateFormat;
    }

    /**
     * Returns calendar display date format or default display format string.
     *
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarDisplayDateFormat(calendar) {
        let format = getCalendarParameter('dateFormatDisplay', calendar);
        // noinspection JSUnresolvedVariable
        return (
            ('string' === typeof format)
            && ('' !== format)
        ) ? format : availabilityCalendar.defaults.dateFormatDisplay;
    }

    /**
     *
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarType(calendar) {
        let currentType = readElementData('type', calendar);
        if ('' === currentType) {
            currentType = (
                (null === getCalendarInputField(arrival, calendar))
                || (null === getCalendarInputField(departure, calendar))
            ) ? display : active;
            writeElementData('type', currentType, calendar);
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
        return (undefined === availabilityCalendar.calendars[i]) ?
            {}
            : availabilityCalendar.calendars[i].availability;
    }

    /**
     *
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarState(calendar) {
        let state = readElementData('state', calendar);
        if ('' === state) {
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
        writeElementData('state', state, calendar);
        highlightInputFields(state, calendar);
        // maybe display calendar prompt message
        displayCalendarPrompt(calendar, state);
    }

    /**
     *
     * @param {HTMLElement} calendar
     * @param {string} state
     */
    function displayCalendarPrompt(calendar, state) {
        let type = getCalendarType(calendar);
        if (type === active) {
            if (state === departure) {
                // noinspection JSUnresolvedVariable
                writeCalendarPrompt(calendar, availabilityCalendar.messages.confirmDepartureDate);
            } else {
                // noinspection JSUnresolvedVariable
                let message = ('' === readElementData('selected-arrival', calendar)) ?
                    availabilityCalendar.messages.selectArrivalDate
                    : availabilityCalendar.messages.modifyArrivalDate;
                writeCalendarPrompt(calendar, message);
            }
        }
    }

    /**
     *
     * @param {HTMLElement} calendar
     * @param {string} message
     */
    function writeCalendarPrompt(calendar, message) {
        let messagesContainer = $(calendar.parentNode).find('.availability-calendar-messages').get(0);
        if (undefined !== messagesContainer) {
            $(messagesContainer).empty();
            let messageContainer = document.createElement('p');
            messageContainer.className = 'prompt-highlight';
            messageContainer.append(document.createTextNode(message));
            messagesContainer.append(messageContainer);
            window.setTimeout(function (element) {
                // noinspection JSUnresolvedFunction
                $(element).css('border-color', 'transparent');
                window.setTimeout(function (element) {
                    // noinspection JSUnresolvedFunction
                    $(element).removeClass('prompt-highlight');
                    element.removeAttribute('style');
                }, 1000, element);
            }, 1500, messageContainer);
        }
    }

    /**
     * Switches calendar state and updates cell data.
     *
     * @param {HTMLElement} calendar
     */
    function switchCalendarState(calendar) {
        // get current calendar state
        let state = getCalendarState(calendar);
        // update calendar state
        let newState = (arrival === state) ? departure : arrival;
        setCalendarState(calendar, newState);
        if (departure === newState) {
            let firstDeparture = $('td.date-key-' + readElementData('first-departure', calendar));
            if (0 === firstDeparture.length) {
                // noinspection JSUnresolvedFunction
                let stepMonths = (1 === $(calendar).datepicker('option', 'numberOfMonths')) ? 1 : 0;
                // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                $.datepicker._adjustInstDate($.datepicker._getInst(calendar), stepMonths, 'M');
                return;
            }
        }
        // update calendar cells
        lateUpdateCalendarCellData(calendar);
    }

    /**
     * Returns calendar default min stay or global min stay default.
     *
     * @param {HTMLElement} calendar
     * @returns {number}
     */
    function getDefaultMinStay(calendar) {
        let parameters = getCalendarParameters(calendar);
        let calendarDefault = getObjectProperty('minStay', parameters, 'number');
        // noinspection JSUnresolvedVariable
        return numberBiggerThanZero(calendarDefault) ?
            calendarDefault
            : availabilityCalendar.defaults.minStay;
    }

    /**
     *
     * @param {string} date
     * @param {object} dates
     * @returns {boolean}
     */
    function hasDateData(date, dates) {
        return objectHasProperty(date, dates, 'object');
    }

    /**
     * Returns date data from dates or empty object.
     *
     * @param {string|null} dateString
     * @param {object} dates
     * @returns {object}
     */
    function getDateData(dateString, dates) {
        let data = getObjectProperty(dateString, dates, 'object');
        return (undefined === data) ? {} : data;
    }

    /**
     * Extracts rate as string from date data.
     *
     * @param {object} dateData
     * @returns {string}
     */
    function getRate(dateData) {
        let rate = getObjectProperty('rate', dateData, 'string');
        return (undefined === rate) ? '' : rate;
    }

    /**
     * Extracts old rate as string from date data.
     *
     * @param {object} dateData
     * @returns {string}
     */
    function getOldRate(dateData) {
        let oldRate = getObjectProperty('oldRate', dateData, 'string');
        return (undefined === oldRate) ? '' : oldRate;
    }

    /**
     * Returns date data available property or false.
     *
     * @param {object} dateData
     * @returns {boolean}
     */
    function isAvailable(dateData) {
        let available = getObjectProperty('available', dateData, 'boolean');
        return (undefined === available) ? false : available;
    }

    /**
     * Returns date data arrival (allowed) property or false.
     *
     * @param {object} dateData
     * @returns {boolean}
     */
    function isArrivalAllowed(dateData) {
        let arrivalAllowed = getObjectProperty('arrival', dateData, 'boolean');
        return (undefined === arrivalAllowed) ? false : arrivalAllowed;
    }

    /**
     * Returns date data departure (allowed) property or false.
     *
     * @param {object} dateData
     * @returns {boolean}
     */
    function isDepartureAllowed(dateData) {
        let departureAllowed = getObjectProperty('departure', dateData, 'boolean');
        return (undefined === departureAllowed) ? false : departureAllowed;
    }

    /**
     * Checks if date provided as string is available for booking within dates.
     *
     * @param {string} date
     * @param {object} dates
     * @returns {boolean}
     */
    function isDateAvailable(date, dates) {
        if (hasDateData(date, dates)) {
            return isAvailable(getDateData(date, dates));
        }
        return false;
    }

    /**
     * Checks if date provided as string is allowed for departures within dates.
     *
     * @param {string} date
     * @param {object} dates
     * @returns {boolean}
     */
    function isDateAllowedForDepartures(date, dates) {
        if (hasDateData(date, dates)) {
            return isDepartureAllowed(getDateData(date, dates))
        }
        return false;
    }

    /**
     * Returns min stay for specific date or calendar default.
     *
     * @param {string} dateString
     * @param {HTMLElement} calendar
     * @returns {number}
     */
    function getMinStay(dateString, calendar) {
        let dates = getCalendarAvailability(calendar);
        if (hasDateData(dateString, dates)) {
            let dateMinStay = getObjectProperty(
                'minStay',
                getDateData(dateString, dates),
                'number'
            );
            if (numberBiggerThanZero(dateMinStay)) {
                return dateMinStay;
            }
        }
        return getDefaultMinStay(calendar);
    }

    /**
     *
     * @param {string} dateString
     * @param {HTMLElement} calendar
     * @returns {number}
     */
    function getMaxStay(dateString, calendar) {
        let dates = getCalendarAvailability(calendar);
        let defaultMaxStay = getCalendarParameter('maxStay', calendar);
        // noinspection JSUnresolvedVariable
        return (
            dates.hasOwnProperty(dateString)
            // make sure it is a number
            && ('number' === typeof dates[dateString].maxStay)
            // make sure it is bigger than zero
            && (0 < dates[dateString].maxStay)
        ) ? dates[dateString].maxStay
            : ((
                // make sure default is a number
                ('number' === typeof defaultMaxStay)
                // and it is bigger than zero
                && (0 < defaultMaxStay)
            ) ? defaultMaxStay : availabilityCalendar.defaults.maxStay);
    }

    /**
     *
     * @param {string} arrivalDateString
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getMinimumStayUntilDateString(arrivalDateString, calendar) {
        // get format to use
        let format = getCalendarDateFormat(calendar);
        return dateToString(
            dateAddDays(
                stringToDate(arrivalDateString, format),
                getMinStay(arrivalDateString, calendar)
            ),
            format
        );
    }

    /**
     *
     * @param {string} arrivalDateString
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getMustDepartOnDateString(arrivalDateString, calendar) {
        // get dates object
        let dates = getCalendarAvailability(calendar);
        // if arrival is not available return it back as first conflict
        // noinspection JSUnresolvedVariable
        if (!isDateAvailable(arrivalDateString, dates)) {
            return arrivalDateString;
        }
        // get format to use
        let format = getCalendarDateFormat(calendar);
        // start by converting arrival to Date
        let arrivalDate = stringToDate(arrivalDateString, format);
        let addDays = 1;
        let newDate = '';
        // get max stay limit for this date in this calendar
        let maxStay = getMaxStay(arrivalDateString, calendar);
        while (isDateAvailable(newDate = dateToString(dateAddDays(arrivalDate, addDays), format), dates)) {
            // if addDays >= maxStay - return newDate now
            if (addDays >= maxStay) {
                return newDate;
            }
            // add another day and restart the loop
            addDays++;
        }
        return newDate;
    }

    /**
     *
     * @param {string} startDateString
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getFirstAllowedDepartureDateString(startDateString, calendar) {
        let dates = getCalendarAvailability(calendar);
        if (isDateAllowedForDepartures(startDateString, dates)) {
            return startDateString;
        }
        // get calendar last date
        let lastDate = getCalendarParameter('lastDate', calendar);
        // get format to use
        let format = getCalendarDateFormat(calendar);
        let addDays = 1;
        let newDate = dateToString(
            dateAddDays(
                stringToDate(startDateString, format),
                addDays),
            format
        );
        while (
            !isDateAllowedForDepartures(newDate, dates)
            && isDateStringBeforeOrEqual(newDate, lastDate, format)
            ) {
            // add another day and restart the loop
            addDays++;
            newDate = dateToString(
                dateAddDays(
                    stringToDate(startDateString, format),
                    addDays),
                format
            )
        }
        return newDate;
    }

    /**
     * Highlights and deems input fields depending the calendar state.
     *
     * @param {string} state
     * @param {HTMLElement} calendar
     */
    function highlightInputFields(state, calendar) {
        let oldState = (arrival === state) ? departure : arrival;
        getVisibleInputFields(state, calendar).forEach(function (element) {
            try {
                // noinspection JSUnresolvedFunction
                $(element.parentNode).removeClass('calendar-deem').addClass('calendar-highlight');
            } catch (e) {
                console.log(e);
            }
        });
        getVisibleInputFields(oldState, calendar).forEach(function (element) {
            try {
                // noinspection JSUnresolvedFunction
                $(element.parentNode).removeClass('calendar-highlight').addClass('calendar-deem');
            } catch (e) {
                console.log(e);
            }
        });
    }

    /**
     *
     * @param {string} newDate
     * @param {string} fieldType
     * @param {HTMLElement} calendar
     * @param {string} format
     * @param {string} displayFormat
     */
    function updateCalendarFields(newDate, fieldType, calendar, format, displayFormat) {
        // update calendar selected date data
        writeElementData('selected-' + fieldType, newDate, calendar);
        // get working input field
        let inputField = getCalendarInputField(fieldType, calendar);
        inputField.value = newDate;
        // update calendar display input if present
        let displayInputField = getCalendarInputField(fieldType + 'Display', calendar);
        if (null !== displayInputField) {
            // update display input field with maybe converted new date
            displayInputField.value = ('' === newDate) ?
                newDate
                : convertDate(
                    newDate,
                    format,
                    displayFormat
                );
        }
    }

    /**
     * Updates calendar and display fields from input fields.
     *
     * @param {HTMLElement} calendar
     */
    function updateCalendarFromInputs(calendar) {
        let fields = [arrival, departure];
        for (let index in fields) {
            // noinspection JSUnfilteredForInLoop
            let field = fields[index];
            let inputField = getCalendarInputField(field, calendar);
            if (
                (null !== inputField)
                && ('string' === typeof inputField.value)
                && ('' !== inputField.value)
            ) {
                writeElementData('selected-' + field, inputField.value, calendar);
                let displayInputField = getCalendarInputField(field + 'Display', calendar);
                if (null !== displayInputField) {
                    displayInputField.value = convertDate(
                        inputField.value,
                        getCalendarDateFormat(calendar),
                        getCalendarDisplayDateFormat(calendar)
                    );
                }
            }
        }
    }

    /**
     *
     * @param {HTMLElement} calendar
     */
    function updateCalendarCellData(calendar) {
        // handle show rates
        if (true === getCalendarParameter('showRates', calendar)) {
            let format = getCalendarDateFormat(calendar);
            let dates = getCalendarAvailability(calendar);
            let hideUnavailableRates = getCalendarParameter('hideUnavailableRates', calendar);
            // noinspection JSUnresolvedFunction
            $(calendar).find(
                '.ui-datepicker-calendar td.has-rate[class*="date-key-"] > *[class*="ui-state"]'
            ).each(function () {
                // extract date from css class
                let date = extractDateFromCSSClasses(this.parentNode.className, format);
                // extract rate data and check all conditions
                if (
                    (0 === $(this.parentNode).find('.rate').length)
                    && (undefined !== date)
                    && hasDateData(date, dates)
                ) {
                    // extract date data
                    let dateData = getDateData(date, dates);
                    // get rate
                    let rate = getRate(dateData);
                    // get availability
                    let available = isAvailable(dateData);
                    if ('' !== rate) {
                        // add rate only if available or not hide unavailable rates option set
                        if (available || (false === hideUnavailableRates)) {
                            // get old rate
                            let oldRate = getOldRate(dateData);
                            // set hasOldsRate flag
                            let hasOldRate = ('' !== oldRate);
                            // append rate element to cell
                            let rateElement = document.createElement('span');
                            rateElement.className = hasOldRate ? 'rate new-rate' : 'rate';
                            rateElement.appendChild(document.createTextNode(rate));
                            this.parentNode.appendChild(rateElement);
                            // append old rate element to cell
                            if (hasOldRate) {
                                let oldRateElement = document.createElement('span');
                                oldRateElement.className = 'rate old-rate';
                                oldRateElement.appendChild(document.createTextNode(oldRate));
                                this.parentNode.appendChild(oldRateElement);
                            }
                        }
                    }

                }
            });
        }
        // handle context menu call
        // noinspection JSUnresolvedFunction
        $(calendar).find('.ui-datepicker-calendar td[title]').contextmenu(function (event) {
            event.preventDefault();
            try {
                alert(this.getAttribute('title').replace(/\.\s?/gi, ".\n"));
            } catch (e) {
                console.log(e);
            }
        });
        // handle available date click when arrival / departure is not allowed
        if (active === getCalendarType(calendar)) {
            let currentState = getCalendarState(calendar);
            let selector = (arrival === currentState) ?
                'td.arrival-available.arrival-prohibited'
                : 'td.departure-available.departure-prohibited';
            // noinspection JSUnresolvedVariable
            let message = (arrival === currentState) ?
                availabilityCalendar.messages.alertNoArrivals
                : availabilityCalendar.messages.alertNoDepartures;
            // noinspection JSUnresolvedFunction
            $(calendar).find(selector).on('click', function () {
                alert(message);
            });
        }
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
     * Filters array to preserve unique values.
     *
     * @param {string} value
     * @param {number} index
     * @param {string[]} array
     * @returns {boolean}
     */
    function unique(value, index, array) {
        return array.indexOf(value) === index;
    }

    /**
     *
     * @param {Date} theDate
     * @returns {*[]}
     */
    function beforeShowDay(theDate) {
        // initiate classes and messages
        let classes = [];
        let messages = [];

        // GET DATA
        // get calendar current state
        let state = getCalendarState(this);
        // get calendar date format
        let format = getCalendarParameter('dateFormat', this);
        // get dates
        let dates = getCalendarAvailability(this);
        // get current date as string to use as key in dates
        let theDateString = dateToString(theDate, format);

        // store current date key in css class
        let theDateKey = dateToString(theDate, dateKeyFormat);
        classes.push('date-key-' + theDateKey);

        // HANDLE FLAGS AND CLASSES
        // BEFORE MIN DATE
        // check if the date is before min date
        let firstDate = stringToDate(getCalendarParameter('firstDate', this), format);
        let beforeMinDate = (theDate < firstDate);
        // handle classes before min date
        if (beforeMinDate) {
            classes.push('before-min-date');
        }
        // AFTER MAX DATE
        // check if the date is after max date
        let afterMaxDate = (theDate > stringToDate(getCalendarParameter('lastDate', this), format));
        // handle class after max date
        if (afterMaxDate) {
            classes.push('after-max-date');
        }
        // DATA
        // check if we have data for the current date
        let hasData = hasDateData(theDateString, dates);
        // handle data class
        classes.push(hasData ? 'has-data' : 'no-data');
        /**
         * Current date data object.
         *
         * @type {object}
         */
        let dateData = getDateData(theDateString, dates);
        // RATE
        // hide unavailable date rates?
        let hideUnavailableRates = getCalendarParameter('hideUnavailableRates', this);
        // set the rate string
        let rate = getRate(dateData);
        // check if we have rates
        let hasRate = ('' !== rate);
        // set the old rate string
        let oldRate = getOldRate(dateData);
        // check if we have old rates
        let hasOldRate = ('' !== oldRate);
        if (
            !beforeMinDate
            && !afterMaxDate
        ) {
            // handle rate class
            classes.push(hasRate ? 'has-rate' : 'no-rate');
            // handle old rate class
            classes.push(hasOldRate ? 'has-old-rate' : 'no-old-rate');
        }
        // AVAILABILITIES
        // check if arrival is available
        // noinspection JSUnresolvedVariable
        let arrivalAvailable = (
            isAvailable(dateData)
            && !(beforeMinDate || afterMaxDate)
        );
        // handle class
        classes.push(arrivalAvailable ? 'arrival-available' : 'arrival-unavailable');
        // check if departure is available
        // get yesterday date
        let yesterdayDate = dateAddDays(theDate, -1);
        let yesterdayDateString = dateToString(yesterdayDate, format);
        let yesterdayData = getDateData(yesterdayDateString, dates);
        // if yesterday is available then departure is also available
        let departureAvailable = (
            isAvailable(yesterdayData)
            && !(beforeMinDate || afterMaxDate)
            && !(yesterdayDate < firstDate)
        );
        // handle class
        classes.push(departureAvailable ? 'departure-available' : 'departure-unavailable');
        // ALLOWANCES
        // check if arrivals are allowed
        let arrivalAllowed = isArrivalAllowed(dateData);
        // handle class
        classes.push(arrivalAllowed ? 'arrival-allowed' : 'arrival-prohibited');
        // check if departures are allowed
        let departureAllowed = isDepartureAllowed(dateData);
        // handle class
        classes.push(departureAllowed ? 'departure-allowed' : 'departure-prohibited');
        // handle basic messages
        if (
            !beforeMinDate
            && !afterMaxDate
        ) {
            // handle rates messages
            if (hasRate && (isAvailable(dateData) || (false === hideUnavailableRates))) {
                // noinspection JSUnresolvedVariable
                messages.push(availabilityCalendar.messages.rate.replace('{rate}', rate));
                // handle old rates messages
                if (hasOldRate) {
                    // noinspection JSUnresolvedVariable
                    messages.push(availabilityCalendar.messages.oldRate.replace('{oldRate}', oldRate));
                }
            }
            // handle minimum stay message
            // noinspection JSUnresolvedVariable
            messages.push(availabilityCalendar.messages.minimumStay.replace(
                '{minimumStay}',
                getMinStay(theDateString, this)
            ));
            // handle availability message
            // noinspection JSUnresolvedVariable
            messages.push(
                arrivalAvailable ?
                    availabilityCalendar.messages.available
                    : availabilityCalendar.messages.unavailable
            );
            // handle arrival allowance messages
            // noinspection JSUnresolvedVariable
            messages.push(
                arrivalAllowed ?
                    availabilityCalendar.messages.arrivalsAllowed
                    : availabilityCalendar.messages.arrivalsNotAllowed
            );
            // handle departure allowance messages
            // noinspection JSUnresolvedVariable
            messages.push(
                departureAllowed ?
                    availabilityCalendar.messages.departuresAllowed
                    : availabilityCalendar.messages.departuresNotAllowed
            );
        }
        // ARRIVAL / DEPARTURE POSSIBILITIES
        let canArrive = (arrivalAvailable && arrivalAllowed);
        let canDepart = (departureAvailable && departureAllowed);
        // STAY PERIOD
        // SELECTED ARRIVAL
        let selectedArrivalDateString = readElementData('selected-arrival', this);
        let selectedArrivalDate = stringToDate(selectedArrivalDateString, format);
        let isSelectedArrival = (
            (null !== selectedArrivalDate)
            && areDatesEqual(theDate, selectedArrivalDate)
        );
        if (isSelectedArrival) {
            classes.push('selected-arrival');
            // noinspection JSUnresolvedVariable
            messages.push(availabilityCalendar.messages.selectedArrival);
            // handle case when unable to arrive
            if (
                !canArrive
                || beforeMinDate
                || afterMaxDate
            ) {
                // evening conflict with rules or availability
                classes.push('arrival-conflict');
                // noinspection JSUnresolvedVariable
                messages.push(availabilityCalendar.messages.selectedArrivalConflict);
            }
        }
        // SELECTED DEPARTURE
        let selectedDepartureDateString = readElementData('selected-departure', this);
        let selectedDepartureDate = stringToDate(selectedDepartureDateString, format);
        let isSelectedDeparture = (
            (null !== selectedDepartureDate)
            && areDatesEqual(theDate, selectedDepartureDate)
        );
        if (isSelectedDeparture) {
            classes.push('selected-departure');
            // noinspection JSUnresolvedVariable
            messages.push(availabilityCalendar.messages.selectedDeparture);
            // handle case when departure is not possible
            if (
                !canDepart
                || beforeMinDate
                || afterMaxDate
            ) {
                // morning conflict with rules or availability
                classes.push('departure-conflict');
                // noinspection JSUnresolvedVariable
                messages.push(availabilityCalendar.messages.selectedDepartureConflict);
            }
        }
        // ARE DATES SELECTED?
        if (
            (null !== selectedArrivalDate)
            && (null !== selectedDepartureDate)
        ) {
            // IS SELECTED STAY
            if ((selectedArrivalDate < theDate) && (theDate < selectedDepartureDate)) {
                classes.push('selected-stay');
                // noinspection JSUnresolvedVariable
                messages.push(availabilityCalendar.messages.selectedStay);
                // handle cases with conflict
                if (
                    (!arrivalAvailable && !departureAvailable)
                    || beforeMinDate
                    || afterMaxDate
                ) {
                    // full day conflict
                    classes.push('stay-conflict');
                    // noinspection JSUnresolvedVariable
                    messages.push(availabilityCalendar.messages.selectedStayConflict);
                } else if (!arrivalAvailable) {
                    // evening conflict
                    classes.push('arrival-conflict');
                    // noinspection JSUnresolvedVariable
                    messages.push(availabilityCalendar.messages.selectedArrivalConflict);
                } else if (!departureAvailable) {
                    // morning conflict
                    classes.push('departure-conflict');
                    // noinspection JSUnresolvedVariable
                    messages.push(availabilityCalendar.messages.selectedDepartureConflict);
                }
            }
            let minimumStayUntilDate = stringToDate(
                getMinimumStayUntilDateString(selectedArrivalDateString, this),
                format
            );
            // are we in case where selected departure is before minimum stay
            if ((selectedDepartureDate < minimumStayUntilDate)) {
                if (isSelectedArrival) {
                    classes.push('arrival-conflict');
                    // noinspection JSUnresolvedVariable
                    messages.push(availabilityCalendar.messages.minimumStayConflict);
                } else if (isSelectedDeparture) {
                    classes.push('departure-conflict');
                    // noinspection JSUnresolvedVariable
                    messages.push(availabilityCalendar.messages.minimumStayConflict);
                } else if ((selectedArrivalDate < theDate) && (theDate < selectedDepartureDate)) {
                    classes.push('stay-conflict');
                    // noinspection JSUnresolvedVariable
                    messages.push(availabilityCalendar.messages.minimumStayConflict);
                }
            }
        }
        // MINIMUM STAY IN DEPARTURE STATE
        let minDepartureDateString = readElementData('first-departure', this);
        let minStayMessage = false;
        if (
            (departure === state)
            && ('' !== minDepartureDateString)
        ) {
            if (
                ('' !== selectedArrivalDateString)
                && (theDateString === selectedArrivalDateString)
            ) {
                // the selected arrival date is in minimum stay requirement
                classes.push('minimum-stay-requirement');
                minStayMessage = true;
            } else if (
                ('' !== selectedArrivalDateString)
                && (isDateStringBefore(selectedArrivalDateString, theDateString, format))
                && (isDateStringBefore(theDateString, minDepartureDateString, format))
            ) {
                // the date is in the minimum stay requirement period
                classes.push('minimum-stay-requirement selected-stay');
                minStayMessage = true;
            } else if (theDateString === minDepartureDateString) {
                classes.push('minimum-stay-requirement selected-departure');
                // noinspection JSUnresolvedVariable
                messages.push(availabilityCalendar.messages.firstAvailableDeparture);
            }
            if (true === minStayMessage) {
                // noinspection JSUnresolvedVariable
                messages.push(availabilityCalendar.messages.minimumStayPeriod);
            }
        }
        // END HANDLE FLAGS, CLASSES AND MESSAGES

        // noinspection JSUnusedAssignment
        let selectable = false;

        // HANDLE RETURN STATEMENTS
        if (arrival === state) {
            // calendar is waiting for arrival date to be inserted
            selectable = canArrive;
        } else {
            // calendar is waiting for departure date to be inserted
            // reject departure dates if user cannot depart or date in not in range
            selectable = (
                canDepart
                && isDateStringInRange(
                    theDateString,
                    readElementData('first-departure', this),
                    readElementData('last-departure', this),
                    format
                )
            );
        }

        // unique classes
        let uniqueClasses = classes.filter(unique);
        // unique messages
        let uniqueMessages = messages.filter(unique);

        return [selectable, uniqueClasses.join(' '), uniqueMessages.join(' ')];
    }

    /**
     *
     * @param {string} dateString
     * @param {Object} instance
     * @param {HTMLElement} calendar
     */
    function onSelect(dateString, instance, calendar) {
        // get current calendar state
        let state = getCalendarState(calendar);
        // handle possible departure date before switching state to departure
        //(or it risks locking the calendar)
        if (arrival === state) {
            // initiate messages
            let messages = [];
            // get format
            let mustDepartOnDateString = getMustDepartOnDateString(dateString, calendar);
            let minimumStayUntilDateString = getMinimumStayUntilDateString(dateString, calendar);
            let firstAllowedDepartureDateString = getFirstAllowedDepartureDateString(
                minimumStayUntilDateString,
                calendar
            );
            // alert guest if they cannot arrive at this date as because they will have to leave before they are allowed to
            // noinspection JSUnresolvedVariable
            if (isDateStringBefore(
                mustDepartOnDateString,
                firstAllowedDepartureDateString,
                instance.settings.dateFormat
            )) {
                // minimum stay requirement is not met - alert guest and return
                // noinspection JSUnresolvedVariable
                messages.push(availabilityCalendar.messages.arrivalImpossible);
                // noinspection JSUnresolvedVariable
                messages.push(availabilityCalendar.messages.selectAnotherDate);
                alert(messages.join("\n"));
                lateUpdateCalendarCellData(calendar);
                return;
            }
            // departure calendar will not be locked at this point as it has at least one selectable departure
            // clear departure fields
            // noinspection JSUnresolvedVariable
            updateCalendarFields(
                '',
                departure,
                calendar,
                instance.settings.dateFormat,
                instance.settings.altFormat
            );
            // store first and last departure dates in calendar itself to limit the selectable range
            writeElementData('first-departure', firstAllowedDepartureDateString, calendar);
            writeElementData('last-departure', mustDepartOnDateString, calendar);
        }
        // calendar got selected departure date - clear first and last departure dates data to remove limits
        else if (departure === state) {
            removeElementData('first-departure', calendar);
            removeElementData('last-departure', calendar);
        }
        // update calendar input fields with newly selected date
        // noinspection JSUnresolvedVariable
        updateCalendarFields(
            dateString,
            state,
            calendar,
            instance.settings.dateFormat,
            instance.settings.altFormat
        );
        // change calendar state
        switchCalendarState(calendar);
    }

    /**
     *
     * @param {HTMLElement} calendar
     * @returns {number}
     */
    function fitCalendars(calendar) {
        let fontSize = window.getComputedStyle(calendar, null).getPropertyValue('font-size') || '16px';
        if ('' === fontSize) {
            fontSize = '16px';
        }
        fontSize = parseFloat(fontSize.replace('/[^\d]/', ''));
        return Math.max(1, Math.floor(calendar.offsetWidth / ((fontSize * 21) + 1)));
    }

    /**
     * Clears calendar dates.
     *
     * @param {HTMLDivElement} calendar
     */
    function clearDates(calendar) {
        // noinspection JSUnresolvedFunction,JSUnresolvedVariable
        let instance = $.datepicker._getInst(calendar);
        // noinspection JSUnresolvedFunction,JSUnresolvedVariable
        let date = $.datepicker.parseDate('yy-m-d', instance.drawYear + '-' + (1 + instance.drawMonth) + '-' + instance.currentDay);
        let fields = [arrival, departure];
        for (let f in fields) {
            // noinspection JSUnresolvedVariable,JSUnfilteredForInLoop
            updateCalendarFields(
                '',
                fields[f],
                calendar,
                instance.settings.dateFormat,
                instance.settings.altFormat
            );
        }
        let attributes = ['selected-arrival', 'selected-departure', 'first-departure', 'last-departure'];
        for (let a in attributes) {
            // noinspection JSUnfilteredForInLoop
            removeElementData(attributes[a], calendar);
        }
        setCalendarState(calendar, arrival);
        // noinspection JSUnresolvedFunction
        $(calendar).datepicker('setDate', null);
        // noinspection JSUnresolvedFunction
        $(calendar).datepicker('refresh');
        // noinspection JSUnresolvedFunction
        $(calendar).datepicker('setDate', date);
        lateUpdateCalendarCellData(calendar);
    }

    /**
     * @param {number} order
     * @param {HTMLElement} calendar
     */
    function initiateCalendar(order, calendar) {
        // populate calendar dates from inputs before drawing calendar
        updateCalendarFromInputs(calendar);
        // on init set calendar to 'arrival' state
        setCalendarState(calendar, arrival);
        // grab currently selected date if any
        let arrivalInput = getCalendarInputField(arrival, calendar);
        let defaultDate = ((null === arrivalInput) || ('' === arrivalInput.value)) ? null : arrivalInput.value;
        // grab calendar parameters
        let calendarParameters = getCalendarParameters(calendar);
        // noinspection JSUnusedGlobalSymbols,JSUnresolvedVariable
        let parameters = {
            // handle days display
            beforeShowDay: beforeShowDay,
            // handle formats
            altFormat: calendarParameters.dateFormatDisplay,
            dateFormat: calendarParameters.dateFormat,
            // handle week start and current day
            firstDay: calendarParameters.weekStart,
            defaultDate: defaultDate,
            gotoCurrent: true,
            // max and min dates
            maxDate: calendarParameters.lastDate,
            minDate: calendarParameters.firstDate,
            // months display
            showOtherMonths: false,
            numberOfMonths: fitCalendars(calendar),
            // show rates
            onChangeMonthYear: function () {
                lateUpdateCalendarCellData(this);
            },
            onSelect: function () {
                lateUpdateCalendarCellData(this);
            }
        };
        // see what type of calendar we have
        let calendarType = getCalendarType(calendar);
        switch (calendarType) {
            // if simple display - build 'display only' calendar
            case display:
                // noinspection JSUnresolvedFunction
                $(calendar).datepicker(parameters);
                break;
            // else attach select date functionality and build calendar
            case active:
            default:
                parameters.onSelect = function (dateString, instance) {
                    onSelect(dateString, instance, this);
                };
                // noinspection JSUnresolvedFunction
                $(calendar).datepicker(parameters);
                maybePreventClickOnDisplayFields(calendar);
                break;
        }
        lateUpdateCalendarCellData(calendar);
    }

    // handle clear dates button click
    // noinspection JSUnresolvedFunction
    $('.availability-calendar-clear .clear-button').on('click', function () {
        try {
            let calendar = $($(this).closest('.availability-calendar-wrapper')[0]).find('.availability-calendar.hasDatepicker')[0];
            if (undefined === calendar) {
                return;
            }
            clearDates(calendar);
        } catch (e) {
            console.log(e);
        }
    });

    // handle help button click
    // noinspection JSUnresolvedFunction
    $('.availability-calendar-help .help-button').on('click', function () {
        // noinspection JSUnresolvedFunction
        $(this.parentNode.parentNode).toggleClass('state-open');
    });

    // noinspection JSUnresolvedFunction
    $('.availability-calendar').each(initiateCalendar);

    // noinspection JSUnresolvedFunction
    $(window).on('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            // noinspection JSUnresolvedFunction
            $('.availability-calendar').each(function (order, calendar) {
                // noinspection JSUnresolvedFunction
                $(calendar).datepicker('option', 'numberOfMonths', fitCalendars(calendar));
                // noinspection JSUnresolvedFunction
                $(calendar).datepicker('refresh');
                lateUpdateCalendarCellData(calendar);
            });
        }, 250);
    });
});
