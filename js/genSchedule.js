(async function() {
    let classes = await $.getJSON("classes.json");
    console.log(classes);
})();