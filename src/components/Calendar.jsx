import React, { Component } from 'react';
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import Schedule from "../schedule"
import "../css/calendar.css"
import "@fullcalendar/core/main.css"
import "@fullcalendar/daygrid/main.css"
import "@fullcalendar/timegrid/main.css"
import { Slider } from "@material-ui/core"
import { withStyles } from "@material-ui/styles"
import { Modal, Button, Icon, Popup, Checkbox, Label, Divider } from "semantic-ui-react"

const MySlider = withStyles({
    root: {
        color: '#CB0000',
        height: 8
    },
    thumb: {
        height: 24,
        width: 24,
        backgroundColor: '#fff',
        border: '2px solid currentColor',
        marginTop: -8,
        marginLeft: -12,
        '&:focus,&:hover,&$active': {
            boxShadow: 'inherit',
        },
    },
    active: {},
    valueLabel: {
        left: 'calc(-50% + 4px)',
    },
    track: {
        height: 8,
        borderRadius: 4,
    },
    rail: {
        height: 8,
        borderRadius: 4,
    },
})(Slider);

class Calendar extends Component {
    state = {
        schedules: [],
        scheduleIndex: 0,
        colors: {},
        scrollTime: "06:00:00",
        classPopup: null,
        filterPopup: null,
        filter: { min: 360, max: 1440 },
        days: { M: true, T: true, W: true, R: true, F: true },
        copyText: "Copy CRNs"
    }

    constructor() {
        super()
        this.myRef = React.createRef();
    }

    render() {
        let creditCount = this.state.schedules[this.state.scheduleIndex] ? this.state.schedules[this.state.scheduleIndex].classes.reduce((a, b) => a + b.credits, 0) : 0;
        let crns = this.state.schedules[this.state.scheduleIndex] ? this.state.schedules[this.state.scheduleIndex].classes.map(c => c.crn).join(", ") : ""
        let colorText = this.state.copyText === "Copied!" ? "green" : (creditCount > 18 ? "red" : "black");
        return (
            <React.Fragment>
                <Button as='div' labelPosition='right' onClick={() => { navigator.clipboard.writeText(crns); this.setState({ copyText: "Copied!" }); setTimeout(() => { this.setState({ copyText: "Copy CRNs" }) }, 1000) }}>
                    <Button color={colorText}>
                        <Icon name='copy' />
                        {this.state.copyText}
                    </Button>
                    <Label as='a' basic color={colorText} pointing='left'>
                        {creditCount} credits
                    </Label>
                </Button>
                <Button icon="github" href="https://github.com/camero2734/iitschedulegen/" color="black" />
                <Divider></Divider>
                <FullCalendar
                    ref={this.myRef}
                    minTime={"06:00:00"}
                    slotLabelInterval={"02:00:00"}
                    defaultView="timeGridWeek"
                    plugins={[timeGridPlugin]}
                    weekends={false}
                    height={500}
                    header={{
                        left: "filter",
                        center: "title",
                        right: "prev, next"
                    }}
                    columnHeaderFormat={{ weekday: 'short' }}//{i => this.getDayOfWeek(i.date.marker)}
                    titleFormat={() => this.state.schedules.length === 0 ? "No Schedules" : "Schedule #" + (this.state.scheduleIndex + 1)}
                    customButtons={this.getCustomButtons()}
                    allDaySlot={false}
                    events={this.createEvents()}
                    eventClick={this.onEventClick}
                />

                {this.renderModal()}
            </React.Fragment>
        );
    }

    componentDidMount = async () => {
        this.generateSchedules();
    }

    componentDidUpdate = async (prevProps, prevState, snapshot) => {
        if (prevProps.values.length !== this.props.values.length || prevProps.values.some((v, i) => v !== this.props.values[i])) {
            await this.generateSchedules();
        }
    }

    onEventClick = (info) => {
        let { classObj } = info.event.extendedProps;
        this.setState({ classPopup: classObj });
    }

    renderModal = () => {
        console.log(this.state.schedules)
        if (this.state.classPopup !== null) {
            let classObj = this.state.classPopup;
            return (
                <Modal
                    defaultOpen={true}
                    onClose={() => { this.setState({ classPopup: null }) }}
                >
                    <Modal.Header>{classObj.name} - {classObj.course}</Modal.Header>
                    <Modal.Content>
                        <Modal.Description>
                            <p><b>Credits: </b>{classObj.credits}</p>
                            <p><b>Instructor{classObj.instructors.length === 1 ? "" : "s"}: </b>{classObj.instructors.join(", ")}</p>
                            <p><b>Type: </b>{classObj.type}</p>
                        </Modal.Description>
                    </Modal.Content>
                    <Modal.Actions>
                        <Popup inverted content={"Class capacity, seating, prerequisites, and requirements"} trigger={
                            <Button color='purple' onClick={() => window.open(classObj.link)}>
                                <Icon name='info' /> Class Details
                            </Button>
                        } />

                        <Popup inverted content="Course description and attributes" trigger={
                            <Button color='blue' onClick={() => window.open(classObj.catalog)}>
                                <Icon name='newspaper outline' /> Course Catalog
                            </Button>
                        } />

                        <Button color='red' onClick={() => this.setState({ classPopup: null })}>
                            <Icon name='close' /> Close
                        </Button>
                    </Modal.Actions>
                </Modal>)
        } else if (this.state.filterPopup !== null) {
            return (
                <Modal
                    defaultOpen={true}
                    onClose={() => { this.setState({ filterPopup: null }) }}
                >
                    <Modal.Header>Filter/Sort</Modal.Header>
                    <Modal.Content>
                        <Modal.Description>
                            <b>Start/End Time:</b>
                            <MySlider
                                marks
                                max={1440}
                                min={360}
                                defaultValue={[this.state.filter.min, this.state.filter.max]}
                                step={30}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(x) => this.durationFromMinutes(x, false)}
                                onChangeCommitted={(e, value) => { this.setState({ filter: { ...this.state.filter, min: value[0], max: value[1] } }); this.generateSchedules() }}
                            />
                            <b>Class Days:</b><br></br>
                            <Checkbox label='M' checked={this.state.days.M} onChange={() => { let d = this.state.days; d.M = !d.M; this.setState({ days: d }); this.generateSchedules() }} />
                            <Checkbox label='T' checked={this.state.days.T} onChange={() => { let d = this.state.days; d.T = !d.T; this.setState({ days: d }); this.generateSchedules() }} />
                            <Checkbox label='W' checked={this.state.days.W} onChange={() => { let d = this.state.days; d.W = !d.W; this.setState({ days: d }); this.generateSchedules() }} />
                            <Checkbox label='R' checked={this.state.days.R} onChange={() => { let d = this.state.days; d.R = !d.R; this.setState({ days: d }); this.generateSchedules() }} />
                            <Checkbox label='F' checked={this.state.days.F} onChange={() => { let d = this.state.days; d.F = !d.F; this.setState({ days: d }); this.generateSchedules() }} />
                        </Modal.Description>
                    </Modal.Content>
                    {/* <Modal.Actions>
                        <Popup inverted content={"Class capacity, seating, prerequisites, and requirements"} trigger={
                            <Button color='purple' onClick={() => console.log}>
                                <Icon name='info' /> Class Details
                            </Button>
                        } />
                    </Modal.Actions> */}
                </Modal >)
        } else return <React.Fragment></React.Fragment>
    }

    generateSchedules = async () => {
        let colors = { ...this.state.colors };
        let loadedCourses = { ...this.props.loadedCourses };
        let inputtedCourses = this.props.values;
        let Schedules = [new Schedule()];
        if (inputtedCourses.length === 0) Schedules = [];
        for (let course of inputtedCourses) {
            if (!colors[course]) {
                colors[course] = this.gc.next().value
            }
            let allNew = [];
            if (!loadedCourses[course]) try {
                let fetchedCourse = await (await fetch(`./classes/${course.split(" ").join("-")}.json`)).json();
                loadedCourses[course] = fetchedCourse;
            } catch (e) { }

            if (loadedCourses[course]) {
                for (let i in Schedules) {
                    let sc = Schedules[i];
                    let newSchedules = sc.addClass({ ...loadedCourses[course] });

                    allNew = [...allNew, ...newSchedules];
                }
            }
            Schedules = allNew;
            console.log(Schedules.length + ` schedules after adding ${course}`)
            if (Schedules.length === 0) break;
        }

        if (Object.keys(this.props.loadedCourses).length !== Object.keys(loadedCourses).length) this.props.handleCourseLoad(loadedCourses);
        if (this.props.loading) this.props.finishedLoading();

        Schedules = this.filterSchedules(Schedules);

        let equals = true;
        if (Schedules.length === this.state.schedules.length) {
            for (let i in Schedules) {
                if (!Schedules[i].equals(this.state.schedules[i])) {
                    equals = false;
                    break;
                }
            }
        } else equals = false;

        if (!equals) {
            this.scrollToDuration(this.durationFromMinutes(Schedules[0] && Schedules[0].startTime !== 1440 ? Schedules[0].startTime - 120 : 360))
            this.setState({ schedules: Schedules, scheduleIndex: 0, colors, currentCourses: inputtedCourses });
        }
    }

    filterSchedules = (Schedules) => {
        let f1 = Schedules.filter(s => s.startTime >= this.state.filter.min && s.endTime <= this.state.filter.max);
        return f1.filter(s => {
            return !s.classes.some(c => {
                let days = Object.keys(c.classes);
                for (let d of days) if (!this.state.days[d]) return true;
                return false;
            });
        });
    }

    createEvents = () => {
        if (!this.state.schedules || this.state.schedules.length === 0) return [];

        let schedule = this.state.schedules[this.state.scheduleIndex];
        let events = [];
        let days = ["S", "M", "T", "W", "R", "F", "A"];
        let colors = { ...this.state.colors };

        if (!schedule || schedule.length <= 0) return [];
        for (let course of schedule.classes) {
            for (let day in course.classes) {
                let event = {
                    title: `${course.course} ${course.type} (${course.crn})`,
                    startTime: this.durationFromMinutes(course.classes[day].start),
                    endTime: this.durationFromMinutes(course.classes[day].end),
                    daysOfWeek: [days.indexOf(day)],
                    color: colors[course.course],
                    borderColor: colors[course.course],
                    classNames: ["calendarEvent"],
                    classObj: course,
                };
                events.push(event);
            }
        }
        if (Object.keys(this.state.colors).length !== Object.keys(colors).length) this.setState({ colors });
        events.renderedIndex = this.state.scheduleIndex;
        return events;
    }

    getCustomButtons = () => {
        return {
            filter: {
                text: "Filter/Sort",
                click: () => {
                    this.setState({ filterPopup: true })
                }
            },
            next: {
                text: "Next",
                click: () => {
                    let scheduleIndex = this.state.scheduleIndex + 1 < this.state.schedules.length ? this.state.scheduleIndex + 1 : 0;
                    this.scrollToDuration(this.durationFromMinutes(this.state.schedules[scheduleIndex] && this.state.schedules[scheduleIndex].startTime !== 1440 ? this.state.schedules[scheduleIndex].startTime - 120 : 360))
                    this.setState({ scheduleIndex })
                }
            },
            prev: {
                text: "Prev",
                click: () => {
                    let scheduleIndex = this.state.scheduleIndex - 1 < 0 ? this.state.schedules.length - 1 : this.state.scheduleIndex - 1
                    this.scrollToDuration(this.durationFromMinutes(this.state.schedules[scheduleIndex] && this.state.schedules[scheduleIndex].startTime !== 1440 ? this.state.schedules[scheduleIndex].startTime - 120 : 360))
                    this.setState({ scheduleIndex })
                }
            }
        }
    }

    scrollToDuration = async (duration) => {
        const numSteps = 25;
        let currentParts = this.state.scrollTime.split(":").map(n => Number(n));
        let currentMinutes = 60 * currentParts[0] + currentParts[1];
        let newParts = duration.split(":").map(n => Number(n));
        let newMinutes = 60 * newParts[0] + newParts[1];

        let step = (newMinutes - currentMinutes) / numSteps;
        while (currentMinutes !== newMinutes) {
            if (step < 0 && currentMinutes <= newMinutes) break;
            if (step >= 0 && currentMinutes >= newMinutes) break;
            currentMinutes += step;
            let newDuration = this.durationFromMinutes(currentMinutes);
            this.myRef.current.getApi().scrollToTime(newDuration)
            await new Promise(next => setTimeout(next, 1));
        }


        this.myRef.current.getApi().scrollToTime(duration)
        this.setState({ scrollTime: duration })
    }

    durationFromMinutes(minutes, includeSeconds = true) {
        // "HH:MM:SS"
        let hh = Math.floor(minutes / 60);
        let mm = Math.floor(minutes - hh * 60);
        return `${hh < 10 ? "0" + hh : hh}:${mm < 10 ? "0" + mm : mm}${includeSeconds ? ":00" : ""}`;
    }

    gc = (() => {
        let generator = function* () {
            let arr = [];
            while (arr.length < 5) arr = [...arr, ...["#d11141", "#00b159", "#00aedb", "#f37735", "#7D27A5", "#ffc425"]];
            yield* arr.flat();
        }
        return generator();
    })();
}

export default Calendar;