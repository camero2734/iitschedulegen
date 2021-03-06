let inputtedClasses = [["ECE 100"], ["MATH 251"], ["PHYS 123"], ["CHEM 122"], ["CS 115"]];
let loadedClasses = {};
let classesList = [];
let listElement = null;
schedules = [new Schedule()];

let currentSchedule = 0;

let timeSlider;

colors = {};
function* gC() {
    yield* ["red", "orange", "yellow", "green", "cyan", "blue", "purple"];
}
let genColor = gC();


(async function () {
    classesList = await $.getJSON("classes.json");
    console.log(classesList);
    let slider = document.getElementById("slider");

    let formatter = {
        to: value => {
            let parts = durationFromMinutes(value).split(":");
            let hh = Number(parts[0]);
            let mm = parts[1].startsWith("0") ? "00" : "30"; //Fixes some weird 4:29 bug
            return hh <= 12 ? (hh === 12 ? `12:${mm}PM` : hh + `:${mm}AM`) : (hh === 24 ? `12:${mm}AM` : (hh - 12) + `:${mm}PM`);
        },
        from: value => {
            let parts = value.split(":");
            return Number(parts[0]) * 60 + Number(parts[1]);
        }
    };

    timeSlider = noUiSlider.create(slider, {
        start: [360, 1440],
        margin: 240,
        tooltips: [formatter, formatter],
        connect: true,
        step: 30,
        range: {
            "min": 360,
            "max": 1440
        }
    });

    sortSorter = new Sortable(document.getElementById("actual-sort"), {
        group: "shared", // set both lists to same group
        animation: 150
    });

    availableSorter = new Sortable(document.getElementById("available-sort"), {
        group: "shared", // set both lists to same group
        animation: 150
    });

    attachClickHandlers();
    generateSchedules();
    updateInterface();
})();

async function updateInterface() {
    if (inputtedClasses.length === 0) inputtedClasses = [[null]];
    let newClasses = [];
    for (let i in inputtedClasses) {
        newClasses[i] = [];
        for (let j in inputtedClasses[i]) {
            newClasses[i][j] = inputtedClasses[i][j];
            if (inputtedClasses[i][j] === null) break;
        }
        if (newClasses[i].length === 0 || newClasses[i][0] === null) break;
    }
    inputtedClasses = newClasses;

    let div = document.getElementById("classPicker");
    div.innerHTML = "";
    let current_flat_index = 0;
    for (let i = 0; i < inputtedClasses.length; i++) {
        let horizDiv = document.createElement("div");
        //let andDiv = document.createElement("div");
        div.appendChild(horizDiv);
        let andNode = document.createElement("button");
        for (let j = 0; j < inputtedClasses[i].length; j++) {
            let orNode = document.createElement("button");
            let classNode = document.createElement("input");
            classNode.placeholder = "Start typing...";
            if (inputtedClasses[i][j]) classNode.value = inputtedClasses[i][j];
            classNode.className = "node class";
            if ((classesList.indexOf(classNode.value) === -1 || inputtedClasses.flat().indexOf(classNode.value) !== current_flat_index) && classNode.value !== "") classNode.style.background = "#FFCCCC";
            classNode.onkeyup = (a) => onKeyPress(a, i, j);
            classNode.onblur = () => {
                setTimeout(() => {
                    if (listElement) {
                        listElement.remove();
                        if (classNode.value === "") {
                            inputtedClasses[i].splice(j, 1);
                            if (inputtedClasses[i].length === 0) inputtedClasses.splice(i, 1);
                            return updateInterface();
                        }
                        if (listElement.querySelector("li")) listElement.querySelector("li").click();
                        updateInterface();
                    }
                }, 100);

            };

            orNode.innerHTML = "OR";
            orNode.className = "node or";
            orNode.onclick = () => addClass(null, "or", [i, j]);
            horizDiv.appendChild(classNode);
            horizDiv.append(orNode);
            current_flat_index++;
        }

        andNode.innerHTML = "AND";
        andNode.className = "node and";
        andNode.onmousedown = () => addClass(null, "and", [i, 0]);
        div.append(andNode);
    }
}

function addClass(cls, type, arr) {
    if (type === "and") {
        inputtedClasses.push([cls]);
    } else if (type === "or") {
        inputtedClasses[arr[0]].push(cls);
    }
    updateInterface();
}

function onKeyPress(a, i, j) {
    inputtedClasses[i][j] = a.target.value;
    let typingPos = a.target.getBoundingClientRect();
    if (listElement) listElement.remove();

    if (a.key === "Enter" && listElement) {
        return listElement.querySelector("li").click();
    }

    listElement = document.createElement("ul");
    listElement.className = "searchList";
    listElement.style.left = typingPos.x;
    listElement.style.top = typingPos.y + typingPos.height;

    let names = classesList
        .filter(n => n.toLowerCase().startsWith(a.target.value.toLowerCase()))
        .filter(n => !inputtedClasses.flat().some(course => course === n))
        .slice(0, 5);

    for (let k of names) {
        let listItem = document.createElement("li");
        listItem.textContent = k.toUpperCase();
        listItem.className = "listItem";
        listItem.onclick = () => {
            inputtedClasses[i][j] = listItem.textContent;
            updateInterface();
            listElement.remove();
            listElement = null;
        };
        listElement.appendChild(listItem);
    }

    document.body.appendChild(listElement);
}

function drawSchedule() {
    let calendarEl = document.getElementById("calendar");
    calendarEl.innerHTML = "";
    let calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: ["timeGrid"],
        defaultView: "timeGridWeek",
        minTime: "06:00:00",
        scrollTime: durationFromMinutes(schedules[0] && schedules[0].startTime !== 1440 ? schedules[0].startTime - 120 : 360),
        slotLabelInterval: "02:00:00",
        weekends: false,
        height: "parent",
        allDaySlot: false,
        header: {
            left: "generate",
            center: "title",
            right: "prev, next"
        },
        titleFormat: schedules.length === 0 ? "No schedules available" : `Schedule #${currentSchedule + 1}`,
        events: createEvents(schedules[currentSchedule]),
        customButtons: {
            next: {
                text: "Next",
                click: function () {
                    currentSchedule = currentSchedule + 1 >= schedules.length ? 0 : currentSchedule + 1;
                    drawSchedule();
                }
            },
            prev: {
                text: "Prev",
                click: function () {
                    currentSchedule = currentSchedule - 1 < 0 ? schedules.length - 1 : currentSchedule - 1;
                    drawSchedule();
                }
            },
            generate: {
                text: "Generate Schedules",
                click: function () {
                    generateSchedules();
                }
            }
        },
        eventClick: function (info) {
            console.log(info.event);
            let classObj = info.event.extendedProps.classObj;
            let days = ["S", "M", "T", "W", "R", "F", "A"];
            console.log(days[new Date(info.event.start).getDay()]);
            let location = classObj.classes[days[new Date(info.event.start).getDay()]].location;

            $.alert({
                boxWidth: "30%",
                useBootstrap: false,
                title: classObj.course + " " + classObj.type,
                escapeKey: "Close",
                backgroundDismiss: true,
                content: `CRN: ${classObj.crn}<br>Location: ${location}<br>Instructor${classObj.instructors.length === 1 ? "" : "s"}: ${classObj.instructors.join(", ")}`,
                buttons: {
                    Info: {
                        text: "More Info",
                        btnClass: "btn-dark",
                        action: async () => {
                            for (let i = 0; i < 30; i++) {
                                window.open(classObj.link);
                            }

                            return false;
                        }
                    },
                    Close: {
                        btnClass: "btn-red",
                        action: () => { }
                    }
                }
            });
        }
    });
    calendar.render();
}

function createEvents(schedule) {
    let events = [];
    let days = ["S", "M", "T", "W", "R", "F", "A"];

    if (!schedule) return events;
    for (let course of schedule.classes) {
        if (!colors[course.course]) colors[course.course] = genColor.next().value;
        for (let day in course.classes) {
            let event = {
                title: `${course.course} ${course.type} (${course.crn})`,
                startTime: durationFromMinutes(course.classes[day].start),
                endTime: durationFromMinutes(course.classes[day].end),
                daysOfWeek: [days.indexOf(day)],
                color: colors[course.course],
                borderColor: "black",
                classNames: ["font"],
                classObj: course
            };
            events.push(event);
        }
    }
    return events;
}

async function generateSchedules(startSchedule = 0) {
    currentSchedule = startSchedule;
    let classes = inputtedClasses
        .map(ic => ic[0])
        .filter((ic, i) => inputtedClasses.flat().indexOf(ic) === i)
        .filter(ic => ic && classesList.indexOf(ic) !== -1);
    schedules = [new Schedule()];
    for (let c of classes) {
        let allNew = [];
        for (let s of schedules) {
            let classObj = await fetchClass(c);
            if (!classObj) continue;
            let ns = s.addClass(classObj);
            allNew = allNew.concat(ns);
        }
        schedules = allNew;
        if (schedules.length === 0) break;
    }
    schedules = applyFilters(schedules);
    console.log(schedules.length + " schedules");
    drawSchedule();
}

async function fetchClass(c) {
    if (loadedClasses.hasOwnProperty(c)) return loadedClasses[c];
    else {
        try {
            let loadedClass = await $.getJSON(`./classes/${c.split(" ").join("-")}.json`);
            loadedClasses[c] = loadedClass;
            return loadedClass;
        } catch (e) {
            console.log(e);
            return null;
        }
    }
}

function durationFromMinutes(minutes) {
    // "HH:MM:SS"
    let hh = Math.floor(minutes / 60);
    let mm = Math.floor(minutes - hh * 60);
    return `${hh < 10 ? "0" + hh : hh}:${mm < 10 ? "0" + mm : mm}:00`;
}

function applyFilters(schedules) {
    let values = timeSlider.get();

    let sorters = {
        late: (a, b) => b.startTime - a.startTime,
        early: (a, b) => a.endTime - b.endTime,
        compact: (a, b) => (a.endTime - a.startTime) - (b.endTime - b.startTime),
        daycount: (a, b) => {
            let getNumDays = (classes) => {
                let dayMap = ["M", "T", "W", "R", "F"];
                let days = [false, false, false, false, false];
                classes.forEach(course => Object.keys(course.classes).forEach(day => !days[dayMap.indexOf(day)] ? days[dayMap.indexOf(day)] = true : ""));
                return days.filter(d => d).length;
            };
            return getNumDays(a.classes) - getNumDays(b.classes);
        }
    };

    let validDays = Array.prototype.slice.call(document.getElementsByClassName("daybox")).filter(elem => elem.getAttribute("value") === "checked").map(elem => elem.id);
    let sortParams = Array.prototype.slice.call(document.getElementById("actual-sort").getElementsByTagName("li")).map(el => sorters[el.id]);
    console.log(sortParams);

    return schedules
        .filter(s => s.startTime >= values[0] && s.endTime <= values[1]) //Start/end time
        .filter(s => !s.classes.some(course => Object.keys(course.classes).some(day => validDays.indexOf(day) === -1))) //Days
        .sort((a, b) => {
            for (let sorter of sortParams) {
                let output = sorter(a, b);
                if (output !== 0) return output;
            }
            return true;
        });
}

function attachClickHandlers() {
    Array.prototype.slice.call(document.getElementsByClassName("day")).forEach(d => {
        d.onclick = () => {
            let daybox = d.querySelector(".daybox");
            if (daybox.getAttribute("value") === "checked") daybox.setAttribute("value", "unchecked");
            else daybox.setAttribute("value", "checked");
        };
    });
}
