"use strict";
class SimpleBookingCalendar {
    /**
     * Simple Booking and Availibility Calendar Liberary
     *  
     * @param {string} element ID of calendar element
     * @param {string|object} evtSrc ajax url string or jquery like ajax options object
     */
    constructor(element, evtSrc) {
        let elem = document.getElementById(element);
        if (elem) {
            this._initProps()
            this.calendarElement = elem;
            this.ajaxSrc = evtSrc
            this.init();
        } else {
            throw "Element ID is required";
        }
    }
    _initProps() {
        this.calendarElement = null;
        this.calendarBody = null;
        this.ajaxSrc = null;
        this.ajaxResponse = null;
        this.selectedStart = null;
        this.selectedEnd = null;
        this.selectedGate = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this._evts = [];
        this.monthText = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    }
    /**
     * Returns selected start date if any
     * 
     * @returns {string}
     */
    get startDate() {
        return this.selectedStart;
    }
    /**
     * Returns selected end date if any
     * 
     * @returns {string}
     */
    get endDate() {
        return this.selectedEnd;
    }
    /**
     * Ajax options creator
     * @param {string|object} src JQuery like ajax options object or url
     * @param {object} complete callback when ajax is complete
     * @returns {object} AJAX options
     */
    ajaxOpts(src, complete = null) {
        function success(res) {
            this.ajaxResponse = res;
        }
        if (typeof src == 'string') {
            return {
                url: src,
                type: 'GET',
                data: {
                    date: this.toFullDateString(this.currentYear, this.currentMonth)
                },
                success: success.bind(this),
                complete: complete
            }
        }
        if (typeof src == 'object') {
            return src
        }
    }
    init() {
        this.calendarElement.innerHTML = '<table class="calendar"><caption class="calendar__banner--month"><h1 id="period_label"></h1></caption><thead><tr><th class="calendar__day__header">Sun</th><th class="calendar__day__header">Mon</th><th class="calendar__day__header">Tue</th><th class="calendar__day__header">Wed</th><th class="calendar__day__header">Thu</th><th class="calendar__day__header">Fri</th><th class="calendar__day__header">Sat</th></tr></thead><tbody id="calendarBody"></tbody></table>';
        this.calendarBody = document.getElementById('calendarBody');
        this.calendarBody.addEventListener("mouseenter", (function (_this) {
            return function (e) {
                for (var target = e.target; target && target != this; target = target.parentNode) {
                    if (target.classList && target.classList.contains('calendar__day__cell')) {
                        if (!_this.selectedEnd) {
                            target.classList.add('hover_day')
                            let currDate = _this._dateToUTC(target.getAttribute('data-date'));
                            if (_this.selectedStart) {
                                _this.selectedGate = false;
                                _this.calendarBody.querySelectorAll('td').forEach(element => {
                                    element.classList.remove('hover_day')
                                    if (_this._dateToUTC(element.getAttribute('data-date')) <= currDate && _this._dateToUTC(element.getAttribute('data-date')) > _this._dateToUTC(_this.selectedStart)) {
                                        if (element.classList.contains('calendar__day__booked') || _this.selectedGate) {
                                            _this.selectedGate = element.getAttribute('data-date');
                                            return;
                                        }
                                        element.classList.add('hover_day');
                                    }
                                });
                            }
                        }
                        break;
                    }
                }
            }
        })(this), true);
        this.calendarBody.addEventListener("mouseout", (function (_this) {
            return function (e) {
                for (var target = e.target; target && target != this; target = target.parentNode) {
                    if (target.classList && target.classList.contains('calendar__day__cell') && !_this.selectedEnd) {
                        target.classList.remove('hover_day')
                        break;
                    }
                }
            }
        })(this), true);
        this.calendarBody.addEventListener("click", (function (_this) {
            return function (e) {
                for (var target = e.target; target && target != this; target = target.parentNode) {
                    if (target.classList && target.classList.contains('calendar__day__cell')) {
                        if (!_this.selectedStart) {
                            _this.selectedStart = target.getAttribute('data-date');
                            target.classList.add('selected_day')

                            _this._evts['select'] && _this._evts['select'].forEach(function (evt) {
                                evt('start', _this.selectedStart);
                            })
                        } else if (target.getAttribute('data-date') == _this.selectedStart && !_this.selectedEnd) {
                            _this._evts['unselect'] && _this._evts['unselect'].forEach(function (evt) {
                                evt('start', _this.selectedStart);
                            })

                            _this.selectedStart = null
                            target.classList.remove('selected_day')
                        } else if (!_this.selectedEnd && !_this.selectedGate && _this._dateToUTC(target.getAttribute('data-date')) > _this._dateToUTC(_this.selectedStart)) {
                            _this.selectedEnd = target.getAttribute('data-date');
                            target.classList.add('selected_day')

                            _this._evts['select'] && _this._evts['select'].forEach(function (evt) {
                                evt('end', _this.selectedEnd);
                            })
                            _this._evts['rangeselect'] && _this._evts['rangeselect'].forEach(function (evt) {
                                evt(_this.selectedStart, _this.selectedEnd, _this)
                            })
                        } else if (target.getAttribute('data-date') == _this.selectedEnd) {
                            _this._evts['unselect'] && _this._evts['unselect'].forEach(function (evt) {
                                evt('end', _this.selectedEnd);
                            })

                            target.classList.remove('selected_day')
                            _this.selectedEnd = null
                        }
                        break;
                    }
                }
            }
        })(this), true);
        this.render();
    }
    toFullDateString(year, month, day) {
        return new Date(year || this.currentYear, month || this.currentMonth, day || 2).toISOString().substr(0, 10);
    }
    next() {
        this.currentYear = (this.currentMonth === 11) ? this.currentYear + 1 : this.currentYear;
        this.currentMonth = (this.currentMonth + 1) % 12;
        this.render();
    }
    previous() {
        this.currentYear = (this.currentMonth === 0) ? this.currentYear - 1 : this.currentYear;
        this.currentMonth = (this.currentMonth === 0) ? 11 : this.currentMonth - 1;
        this.render();
    }
    jump(month, year) {
        this.currentYear = parseInt(year);
        this.currentMonth = parseInt(month);
        this.render();
    }
    render(month = this.currentMonth, year = this.currentYear) {
        if (this.ajaxSrc) {
            function complete() {
                this._render(month, year)
            }
            this._ajax(this.ajaxOpts(this.ajaxSrc, complete.bind(this)));
        } else {
            this._render(month, year);
        }
    }
    _render(month, year) {
        document.getElementById('period_label').innerText = `${this.monthText[month]} ${year}`;
        let days = 32 - new Date(year, month, 32).getDate();
        let offset = 0;
        let tdata = '<tr>';
        for (let index = 1; index <= days; index++) {
            if (index === 1) {
                let dayoftheweek = new Date(year, month, index).getDay();
                for (let index = 0; index < dayoftheweek; index++) {
                    offset++;
                    tdata += '<td class="calendar__day__booked"></td>';
                }
            }
            if (this.ajaxResponse[this.toFullDateString(year, month, index + 1)]) {
                tdata += `<td class="calendar__day__booked" data-moon-phase="Booked" data-date="${this.toFullDateString(year, month, index+1)}">${index}</td>`;
            } else if (this.selectedStart && !this.selectedEnd) {
                tdata += `<td class="calendar__day__cell ${this.toFullDateString(year, month, index+1) == this.selectedStart ? 'hover_day' : null}"  data-date="${this.toFullDateString(year, month, index+1)}">${index}</td>`;
            } else if (this.selectedStart && this.selectedEnd) {
                tdata += `<td class="calendar__day__cell ${(this.toFullDateString(year, month, index+1) >= this.selectedStart && this.toFullDateString(year, month, index+1) <= this.selectedEnd) ? 'hover_day' : null}"  data-date="${this.toFullDateString(year, month, index+1)}">${index}</td>`;
            } else {
                tdata += `<td class="calendar__day__cell"  data-date="${this.toFullDateString(year, month, index+1)}">${index}</td>`;
            }
            if (index === days) {
                let lastdayoftheweek = new Date(year, month, index).getDay() + 1;
                for (let index = lastdayoftheweek; index < 7; index++) {
                    tdata += '<td class="calendar__day__booked"></td>';
                }
            }
            if ((index + offset) % 7 == 0) {
                tdata += '</tr>';
            }
        }
        this.calendarBody.innerHTML = tdata;
    }
    /**
     * Bind an event
     * 
     * @param {string} evt Event name
     * @param {object} func Event callback function
     */
    on(evt, func) {
        if (!this._evts[evt]) {
            this._evts[evt] = []
        }
        this._evts[evt].push(func)
    }
    _ajax(opts) {
        let request;
        if (window.XMLHttpRequest) {
            request = new XMLHttpRequest();
        } else {
            request = new ActiveXObject("Microsoft.XMLHTTP");
        }
        request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status === 200) {
                    let res = this.responseText;
                    if (this.getResponseHeader('content-type') == 'application/json') {
                        try {
                            res = JSON.parse(res)
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    opts.success && opts.success(res, this.status)
                } else {
                    opts.error && opts.error()
                }
                opts.complete && opts.complete()
            }
        }
        if (opts.type == 'GET') {
            opts.url += `?${this._object2param(opts.data)}`;
            opts.data = null;
        }
        request.open(opts.type, opts.url, true);
        opts.beforeSend && opts.beforeSend()
        request.send(opts.data && this._object2param(opts.data));
    }
    _object2param(object) {
        return Object.entries(object).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
    }
    _dateToUTC(date) {
        return new Date(date).getTime();
    }
}