async function loadJSON(path) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                return JSON.parse(xhr.responseText);
            } else {
                console.log("error fetching json");
                return {};
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}

!(async function() {
    let classes = loadJSON("classes.json");
    console.log(classes);
})();