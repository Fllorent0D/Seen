// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const ipc = require("electron").ipcRenderer;
const $ = require("jquery");
$("#code").click(() => {
    ipc.send("code", $("input#code-field").val());
})

$("#test").click(()=>{
   ipc.send("api");
});
$("#search").click(() => {
    ipc.send("textSearch", $("#txt-search").val());

});
ipc.on("found", (event, found, sai, ep) => {
    console.log(found);
    console.log(sai);
    console.log(ep);
    $.each(found, (index, value) => {
        let row = $("<tr>");
        $("<td>", {
            text : value
        }).appendTo(row);
        $("<td>", {
            text : sai
        }).appendTo(row);
        $("<td>", {
            text : ep
        }).appendTo(row);
        $("<td>").append($("<button>", {
            text:"Ajouter à Trakt",
            class:"btn btn-success add-to-trakt"
        })).appendTo(row)

        $("#found tbody").append(row);
    });
})

const holder = document.getElementById('holder')
holder.ondragover = () => {
    return false;
}
holder.ondragleave = holder.ondragend = () => {
    return false;
}
holder.ondrop = (e) => {
    e.preventDefault()
    for (let f of e.dataTransfer.files) {
        console.log('File(s) you dragged here: ', f.path);
        ipc.send("file", f.path);
    }
    return false;
}