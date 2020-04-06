let Schedule = class Schedule {
    constructor(classes = [], freetimes = { M: [[0, 1440]], T: [[0, 1440]], W: [[0, 1440]], R: [[0, 1440]], F: [[0, 1440]] }, teachers = [], startTime = 1440, endTime = 0) {
        this.classes = classes;
        this.freetimes = freetimes;
        this.teachers = teachers;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    addClass(section) {
        let newSchedules = [];

        let allCourses = [];
        for (let teacher in section) {
            for (let crn in section[teacher]) {
                let days = Object.keys(section[teacher][crn].classes);
                if (!days.some(d => section[teacher][crn].classes[d].start === "TBA")) allCourses.push(section[teacher][crn]);
            }
        }

        let lecture_types = ["Lecture", "Lecture/Lab", "Studio", "Clinical", "Dummy Course", "Externship", "Independent Study/Research", "Internship", "Seminar", "Workshop"];
        let lab_types = ["Lab", "Recitation/Discussion"];

        let lectures = allCourses.filter(c => lecture_types.some(t => t.toLowerCase() === c.type.toLowerCase()));
        let labs = allCourses.filter(c => lab_types.some(t => t.toLowerCase() === c.type.toLowerCase()));



        if (lectures.length > 0) {
            for (let lecture of lectures) {
                if (this.canAdd(lecture) !== false) {
                    let newSchedule = this.clone();
                    let replaceTimeSlots = this.canAdd(lecture);
                    for (let crn in replaceTimeSlots) {
                        for (let day in replaceTimeSlots[crn]) {
                            //This array stuff is absolutely a mess
                            /*
                                Basically:
                                [0,1440] <- "originalTime" - this is a block of free time in the current schedule
                                [840, 910] <- "newTime" - this is the class time
                                [0, 840][910, 1440] <- the new freetimes
                            */
                            let originalTime = [newSchedule.freetimes[day][replaceTimeSlots[crn][day]][0], newSchedule.freetimes[day][replaceTimeSlots[crn][day]][1]];
                            let newTime = [lecture.classes[day].start, lecture.classes[day].end];

                            newSchedule.startTime = Math.min(newTime[0], newSchedule.startTime);
                            newSchedule.endTime = Math.max(newTime[1], newSchedule.endTime);
                            newSchedule.freetimes[day].splice(replaceTimeSlots[crn][day], 1, [originalTime[0], newTime[0]], [newTime[1], originalTime[1]]);
                        }
                    }
                    newSchedule.classes.push(lecture);
                    newSchedules.push(newSchedule);
                }
            }
        }
        if (labs.length > 0) {
            let newerSchedules = newSchedules.map(ns => {
                let labSchedules = [];
                let sameTeacherLabs = labs.filter(l => {
                    let foundCourse = ns.classes.find(c => c.course === l.course);
                    return (l.instructors.some(i => foundCourse.instructors.indexOf(i) !== -1))
                });
                for (let lab of sameTeacherLabs) {
                    if (ns.canAdd(lab) !== false) {
                        let newSchedule = ns.clone();
                        let replaceTimeSlots = ns.canAdd(lab);
                        for (let crn in replaceTimeSlots) {
                            for (let day in replaceTimeSlots[crn]) {
                                //This array stuff is absolutely a mess
                                /*
                                    Basically:
                                    [0,1440] <- "originalTime" - this is a block of free time in the current schedule
                                    [840, 910] <- "newTime" - this is the class time
                                    [0, 840][910, 1440] <- the new freetimes
                                */
                                let originalTime = [newSchedule.freetimes[day][replaceTimeSlots[crn][day]][0], newSchedule.freetimes[day][replaceTimeSlots[crn][day]][1]];
                                let newTime = [lab.classes[day].start, lab.classes[day].end];

                                newSchedule.startTime = Math.min(newTime[0], newSchedule.startTime);
                                newSchedule.endTime = Math.max(newTime[1], newSchedule.endTime);

                                newSchedule.freetimes[day].splice(replaceTimeSlots[crn][day], 1, [originalTime[0], newTime[0]], [newTime[1], originalTime[1]]);
                            }
                        }

                        lab.credits = 0; // All of the credits should be in the normal class
                        newSchedule.classes.push(lab);
                        labSchedules.push(newSchedule);
                    }
                }
                return labSchedules;
            });
            return newerSchedules.flat();
        } else {
            return newSchedules;
        }
    }

    clone() {
        let clonedClasses = JSON.parse(JSON.stringify(this.classes));
        let clonedFreetimes = JSON.parse(JSON.stringify(this.freetimes));
        let clonedTeachers = JSON.parse(JSON.stringify(this.teachers));
        return new Schedule(clonedClasses, clonedFreetimes, clonedTeachers, this.startTime, this.endTime);
    }

    equals(schedule) {
        if (this.classes.length !== schedule.classes.length) return false;
        let crns1 = this.classes.map(c => c.crn);
        let crns2 = schedule.classes.map(c => c.crn);
        return !crns1.some(c => crns2.indexOf(c) === -1);
    }

    getcrns() {
        return this.classes.map(c => c.crn);
    }

    canAdd(...args) {
        let slots = {};
        for (let course of args) {
            let times = course.classes;
            for (let day in times) {
                let availableTimeSlot = this.freetimes[day].findIndex(timeSlot => {
                    return (timeSlot[0] <= times[day].start && timeSlot[1] >= times[day].end);
                });

                if (availableTimeSlot !== undefined && availableTimeSlot !== -1) {
                    if (!slots[course.crn]) slots[course.crn] = {};
                    slots[course.crn][day] = availableTimeSlot;
                } else return false;
            }
        }


        return slots;

    }
}

export default Schedule;
