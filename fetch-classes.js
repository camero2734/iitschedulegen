
/*
Fetches all classes and creates a JSON file

*/

// Term takes the format [YEAR][SEMESTER] where:
//     YEAR = The year the spring semester falls in (Fall 2020 -> 2021)
//     SEMESTER = 10 for Fall, 20 for Spring
//     Fall 2020 -> 202110
//     Spring 2020 -> 202120

const TERM = "202120"; // Spring 2020

const lecture_types = ["Lecture", "Lecture/Lab", "Studio", "Clinical", "Dummy Course", "Externship", "Independent Study/Research", "Internship", "Seminar", "Workshop"];
const lab_types = ["Lab", "Recitation/Discussion"];

const fetch = require("node-fetch");
const fs = require("fs-extra");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
fetch("https://ssb.iit.edu/bnrprd/bwckschd.p_get_crse_unsec", {
    "credentials": "omit",
    "headers": {
        "content-type": "application/x-www-form-urlencoded",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
    },
    "referrer": "https://ssb.iit.edu/bnrprd/bwckgens.p_proc_term_date",
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": `term_in=${TERM}&sel_subj=dummy&sel_day=dummy&sel_schd=dummy&sel_insm=dummy&sel_camp=dummy&sel_levl=dummy&sel_sess=dummy&sel_instr=dummy&sel_ptrm=dummy&sel_attr=dummy&sel_subj=AS&sel_subj=ARCH&sel_subj=AURB&sel_subj=AAH&sel_subj=BIOL&sel_subj=BME&sel_subj=BUS&sel_subj=CHE&sel_subj=CHEM&sel_subj=CAE&sel_subj=COM&sel_subj=CS&sel_subj=CSP&sel_subj=ECON&sel_subj=ECE&sel_subj=EG&sel_subj=EMGT&sel_subj=ELP&sel_subj=ENVE&sel_subj=EMS&sel_subj=EXCH&sel_subj=FDSC&sel_subj=FDSN&sel_subj=GLS&sel_subj=GCS&sel_subj=HIST&sel_subj=HUM&sel_subj=IT-D&sel_subj=INT&sel_subj=IT&sel_subj=IT-M&sel_subj=IT-O&sel_subj=IT-S&sel_subj=IT-T&sel_subj=ITMD&sel_subj=ITMM&sel_subj=ITMO&sel_subj=ITMS&sel_subj=ITMT&sel_subj=INTM&sel_subj=ITM&sel_subj=IDX&sel_subj=IDN&sel_subj=IPMM&sel_subj=IEP&sel_subj=INTR&sel_subj=IPRO&sel_subj=LA&sel_subj=LAW&sel_subj=LCS&sel_subj=LCHS&sel_subj=LIT&sel_subj=MBA&sel_subj=MSC&sel_subj=MAX&sel_subj=MSF&sel_subj=MS&sel_subj=MATH&sel_subj=MSED&sel_subj=MMAE&sel_subj=MILS&sel_subj=NS&sel_subj=PHIL&sel_subj=PHYS&sel_subj=PS&sel_subj=PCA&sel_subj=PESL&sel_subj=PD&sel_subj=PL&sel_subj=PSYC&sel_subj=PA&sel_subj=SCI&sel_subj=SSCI&sel_subj=SOC&sel_subj=SSB&sel_subj=STDA&sel_crse=&sel_title=&sel_schd=%25&sel_insm=%25&sel_from_cred=&sel_to_cred=&sel_camp=%25&sel_levl=CE&sel_levl=GR&sel_levl=GM&sel_levl=GD&sel_levl=LW&sel_levl=LM&sel_levl=PL&sel_levl=UG&sel_ptrm=%25&sel_instr=%25&sel_attr=%25&begin_hh=0&begin_mi=0&begin_ap=a&end_hh=0&end_mi=0&end_ap=a`,
    "method": "POST",
    "mode": "cors"
}).then(async r => {
    let html = await r.text();
    const { document } = (new JSDOM(html)).window;
    let rows = document.getElementsByClassName("datadisplaytable")[0].querySelector("tbody").children;

    let classes = {};

    let currentHeader = null;
    for (let i = 0; i < rows.length; i++) {
        let headerArr = getHeaderArray(rows[i]);
        if (headerArr.hasOwnProperty("name")) { //Is Header row
            currentHeader = headerArr;
        } else {
            let classInfo = getClassInfo(rows[i]);
            let mergedInfo = { ...currentHeader, ...classInfo };
            if (Object.keys(mergedInfo.classes).length > 0) {
                if (!classes[mergedInfo.course]) classes[mergedInfo.course] = {};
                if (!classes[mergedInfo.course][mergedInfo.instructors.join("|")]) classes[mergedInfo.course][mergedInfo.instructors.join("|")] = {};
                classes[mergedInfo.course][mergedInfo.instructors.join("|")][mergedInfo.crn] = mergedInfo;
            }
        }
    }

    //Empty/create classes folder
    await fs.emptyDir("./public/classes");


    // These classes are loaded only when requested to (dramatically) reduce the overhead
    for (let course in classes) {
        await fs.writeJSON(`./public/classes/${course.split(" ").join("-")}.json`, classes[course]);
    }

    // This is an index of all available classes to enable choosing classes
    // The relevant ./public/classes json file is loaded
    await fs.writeJSON("./src/json/allClasses.json", Object.keys(classes));

    console.log("done");

    function getHeaderArray(element) {
        if (!element.querySelector(".ddtitle")) return {};
        else {
            let match = /^(.+?) - (\d+) - ([A-Z-]{1,4} \d+) - ([A-Z]{0,1}\d+|WC)$/.exec(element.querySelector(".ddtitle").querySelector("a").innerHTML.replace(/\n/g, ""));
            if (!match || match.length < 5) return {};
            else return {
                name: match[1],
                crn: match[2],
                course: match[3],
                section: match[4],
                link: "https://ssb.iit.edu" + element.querySelector(".ddtitle").querySelector("a").href
            };
        }
    }

    function getClassInfo(element) {
        try {
            let area = element.querySelector(".dddefault");
            let innerNodes = area.childNodes;
            let nodeStart = 0;
            for (let i in innerNodes) {
                if (innerNodes[i].textContent === "Associated Term: ") nodeStart = i - 1;
            }

            let info = {
                term: innerNodes[2 + nodeStart].textContent.trim(),
                registration: innerNodes[6 + nodeStart].textContent.trim(),
                levels: innerNodes[10 + nodeStart].textContent.trim(),
                attributes: innerNodes[14 + nodeStart].textContent.trim(),
                campus: innerNodes[18 + nodeStart].textContent.trim(),
                // type: innerNodes[20 + nodeStart].textContent.trim().split(" ")[0],
                instructional_method: innerNodes[22 + nodeStart].textContent.trim(),
                credits: parseInt(innerNodes[24 + nodeStart].textContent.trim().split(" ")[0]),
                catalog: "https://ssb.iit.edu" + Array.prototype.slice.call(area.querySelectorAll("a")).find(a => a.textContent === "View Catalog Entry").href
            };


            let classes = {};
            let tableRows = area.querySelector("table").querySelector("tbody").rows;

            for (let r of tableRows) {
                let parts = r.children;
                if (!parts || parts[0].textContent !== "Class") continue;
                let instructors = Array.prototype.slice.call(parts[6].childNodes);
                instructors = instructors.map(a => {
                    if (!a.textContent) return null;
                    let matched = a.textContent.replace(/ +/g, " ").match(/(\w\.{0,1} {0,1}){2,}/);
                    if (matched && matched[0]) return matched[0].trim();
                    return null;
                }).filter(a => a);
                let start = getStart(parts[1].textContent);
                let end = getEnd(parts[1].textContent);
                let times = {};
                for (let d of parts[2].textContent.split("")) {
                    if (/[MTWRF]/.test(d)) classes[d] = { start, end, location: parts[3].textContent };
                }
                info.instructors = instructors;

                // Fix for some labs being "attached" to the class times
                if (!info.type) info.type = parts[5].textContent;
                else if (!lab_types.some(l => l.toLowerCase() === parts[5].textContent.toLowerCase())) {
                    info.type = parts[5].textContent;
                }
                info.dateRange = parts[4].textContent;
            }
            info.classes = classes;
            return info;
        } catch (e) {
            return { classes: {} };
        }

    }

    function getStart(str) {
        if (!/^\d{1,2}:\d{2} [ap]m - \d{1,2}:\d{2} [ap]m$/.test(str)) return "TBA";
        let start = str.split("-")[0].trim();
        let timeParts = start.split(" ");
        let hm = timeParts[0].split(":");

        return (~~hm[0] % 12) * 60 + ~~hm[1] + 12 * 60 * (timeParts[1] === "pm" ? 1 : 0);
    }

    function getEnd(str) {
        if (!/^\d{1,2}:\d{2} [ap]m - \d{1,2}:\d{2} [ap]m$/.test(str)) return "TBA";
        let end = str.split("-")[1].trim();
        let timeParts = end.split(" ");
        let hm = timeParts[0].split(":");

        return (~~hm[0] % 12) * 60 + ~~hm[1] + 12 * 60 * (timeParts[1] === "pm" ? 1 : 0);
    }
});
