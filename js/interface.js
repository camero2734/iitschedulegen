let inputtedClasses = [["ECE 100"], ["MATH 251"], ["PHYS 123"], ["CHEM 122"], ["CS 115"]];
let loadedClasses = {};
let listElement = null;
schedules = [new Schedule()];

let currentSchedule = 0;


colors = {};
function* gC() {
    yield* ["red", "orange", "#c9c170", "green", "cyan", "blue", "purple"];
}
let genColor = gC();


(async function() {
    loadedClasses = await $.getJSON("classes.json");
    console.log(loadedClasses);
    let slider = document.getElementById("slider");

    let formatter = {
        to: value => {
            let parts = durationFromMinutes(value).split(":");
            let hh = Number(parts[0]);
            let mm = parts[1].startsWith("0") ? "00" : "30"; //Fixes some weird 4:29 bug
            return hh <= 12 ? (hh === 12 ? `12:${mm}PM` : hh + `:${mm}AM`) : (hh - 12) + `:${mm}PM`; 
        },
        from: value => {
            let parts = value.split(":");
            return Number(parts[0]) * 60 + Number(parts[1]);
        }
    };

    let a = noUiSlider.create(slider, {
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
    a.on("update", function (values, handle) {
        console.log(values);
    });
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
            if (!loadedClasses.hasOwnProperty(classNode.value) && classNode.value !== "") classNode.style.background = "#FFCCCC";
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

    let names = Object.keys(loadedClasses).filter(n => n.toLowerCase().startsWith(a.target.value.toLowerCase())).slice(0, 5);

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
        plugins: [ "timeGrid" ],
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
        titleFormat: `Schedule #${currentSchedule + 1}`,
        events: createEvents(schedules[currentSchedule]),
        customButtons: {
            next: {
                text: "Next",
                click: function() {
                    currentSchedule = currentSchedule + 1 >= schedules.length ? 0 : currentSchedule + 1;
                    drawSchedule();
                }
            },
            prev: {
                text: "Prev",
                click: function() {
                    currentSchedule = currentSchedule - 1 < 0 ? schedules.length - 1 : currentSchedule - 1;
                    drawSchedule();
                }
            },
            generate: {
                text: "Generate Schedules",
                click: function() {
                    generateSchedules();
                }
            }
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
                title: `${course.course}\n${course.crn}`, 
                startTime: durationFromMinutes(course.classes[day].start),
                endTime: durationFromMinutes(course.classes[day].end),
                daysOfWeek: [days.indexOf(day)],
                color: colors[course.course],
                borderColor: "black",
                classNames: ["font"]
            };
            events.push(event);
        }
    }
    return events;
}

function generateSchedules() {
    let classes = inputtedClasses.map(ic => ic[0]).filter(ic => ic && loadedClasses.hasOwnProperty(ic));
    schedules = [new Schedule()];
    for (let c of classes) {
        let allNew = [];
        for (let s of schedules) {
            let ns = s.addClass(loadedClasses[c]);
            allNew = allNew.concat(ns);
        }
        schedules = allNew;
    }
    schedules = applyFilters(schedules);
    console.log(schedules.length + " schedules");
    drawSchedule();
}

function durationFromMinutes(minutes) {
    // "HH:MM:SS"
    let hh = Math.floor(minutes / 60);
    let mm = Math.floor(minutes - hh * 60);
    return `${hh < 10 ? "0" + hh : hh}:${mm < 10 ? "0" + mm : mm}:00`;
}

function applyFilters(schedules) {
    return schedules;
}