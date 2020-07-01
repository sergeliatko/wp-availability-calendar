/* global availabilityCalendar, jQuery */
jQuery(document).ready(function ($) {

    /**
     * @param {number} order
     * @param {HTMLElement} calendar
     */
    function initiateCalendar(order, calendar) {
        //grab calendar parameters
        let calendarParameters = getCalendarParameters(calendar);
        //see what type of calendar we have
        let calendarType = getCalendarType(calendar);
        switch (calendarType) {
            //if simple display - build 'display only' calendar
            case 'display':
                // noinspection JSUnresolvedFunction,JSUnresolvedVariable
                $(calendar).datepicker({
                    beforeShowDay: displayBeforeShowDay,
                    altFormat: calendarParameters.dateFormatDisplay,
                    dateFormat: calendarParameters.dateFormat,
                    defaultDate: null,
                    firstDay: calendarParameters.weekStart,
                    gotoCurrent: true,
                    maxDate: calendarParameters.lastDate,
                    minDate: calendarParameters.firstDate,
                    showOtherMonths: false
                });
                break;
            //else attach select date functionality and build calendar
            case 'active':
            default:
                // noinspection JSUnresolvedFunction,JSUnresolvedVariable
                $(calendar).datepicker({
                    altFormat: calendarParameters.dateFormatDisplay,
                    dateFormat: calendarParameters.dateFormat,
                    defaultDate: null,
                    firstDay: calendarParameters.weekStart,
                    gotoCurrent: true,
                    maxDate: calendarParameters.lastDate,
                    minDate: calendarParameters.firstDate,
                    showOtherMonths: false
                });
                break;
        }
    }

    /**
     *
     * @param {Date} current
     * @returns {*[]}
     */
    function displayBeforeShowDay(current) {
        let dates = getCalendarAvailability(this);
        let format = getCalendarParameter('dateFormat', this);
        //reject dates before min date
        if (current < stringToDate(getCalendarParameter('firstDate', this), format)) {
            return [false, 'disabled', ''];
        }
        //reject dates after max date
        if (current > stringToDate(getCalendarParameter('lastDate', this), format)) {
            return [false, 'disabled', ''];
        }
        //get current date as string to use as key in dates
        let date = dateToString(current, format);
        //see if key is present in dates and return unavailable if not
        if (!dates.hasOwnProperty(date)) {
            return [false, 'disabled', ''];
        }
        //see if date is available
        // noinspection JSUnresolvedVariable
        let available = (true === dates[date].available);
        //see if date is allowed for arrivals
        let arrival = (true === dates[date].arrival);
        //see if date is allowed for departures
        let departure = (true === dates[date].departure);
        //see yesterday's availability
        let yesterday = dateToString(dateAddDays(current, -1), format);
        // noinspection JSUnresolvedVariable
        let arrivalOnly = dates.hasOwnProperty(yesterday) ? !(true === dates[yesterday].available) : true;
        let departureOnly = !available && !arrivalOnly;
        //prepare classes and messages
        let classes = [];
        let messages = [];
        //is date selectable
        let selectable = (available && arrival);
        if (selectable) {
            classes.push('available');
            messages.push('Available.');
            if (arrivalOnly) {
                classes.push('arrival-only');
                messages.push('Available only for arrivals.')
            }
        } else {
            classes.push('unavailable');
            messages.push('Unavailable.');
            if (departureOnly) {
                classes.push('departure-only');
                messages.push('Departures only.');
            }
        }

        return [selectable, classes.join(' '), messages.join(' ')];
    }

    /**
     * Adds days to provided date returning new date object.
     * @param {Date} date
     * @param {number} days
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
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarType(calendar) {
        return (
            (null === getCalendarInputField('arrival', calendar))
            || (null === getCalendarInputField('departure', calendar))
        ) ? 'display' : 'active';
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
     * @param {HTMLElement} calendar
     * @returns {string}
     */
    function getCalendarInstance(calendar) {
        return calendar.getAttribute('data-instance');
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
     * @param {HTMLElement} calendar
     * @returns {object}
     */
    function getCalendarAvailability(calendar) {
        let i = getCalendarInstance(calendar);
        // noinspection JSUnresolvedVariable
        return (undefined === availabilityCalendar.calendars[i]) ? {} : availabilityCalendar.calendars[i].availability;
    }

    // noinspection JSUnresolvedFunction
    $('.availability-calendar').each(initiateCalendar);
});