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