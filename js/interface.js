let inputtedClasses = [[null]];
let loadedClasses = {};
let listElement = null;

(async function() {
    loadedClasses = await $.getJSON("classes.json");
    console.log(loadedClasses);

    updateInterface();
})();

async function updateInterface() {
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
        for (let j = 0; j < inputtedClasses[i].length; j++) {
            let classNode = document.createElement("input");
            classNode.placeholder = "Start typing...";
            if (inputtedClasses[i][j]) classNode.value = inputtedClasses[i][j];
            classNode.className = "node class";
            if (!loadedClasses.hasOwnProperty(classNode.value) && classNode.value !== "") classNode.style.background = "#FFCCCC";
            classNode.onkeyup = (a) => onKeyPress(a, i, j);
            classNode.onblur = () => listElement && listElement.remove();
            let orNode = document.createElement("button");
            orNode.innerHTML = "OR";
            orNode.className = "node or";
            orNode.onclick = () => addClass(null, "or", [i, j]);
            horizDiv.appendChild(classNode);
            horizDiv.append(orNode);
        }
        let andNode = document.createElement("button");
        andNode.innerHTML = "AND";
        andNode.className = "node and";
        andNode.onmousedown = () => addClass(null, "and", [i, 0]);
        div.append(andNode);
    }
}

function addClass(cls, type, arr) {
    console.log("Adding type " + type);
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
        };
        listElement.appendChild(listItem);
    }

    document.body.appendChild(listElement);
}