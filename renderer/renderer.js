// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const ipc = require("electron").ipcRenderer;
const $ = require("jquery");
const alerta = require("bootstrap-sweetalert");

$.fn.extend({
    animateCss: function (animationName, remove) {
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        $(this).removeClass('hidden');
        this.addClass('animated ' + animationName).one(animationEnd, function() {
            $(this).removeClass('animated ' + animationName);
            if(remove == true) $(this).addClass('hidden');
        });
    }
});
/* Alert feedback */
ipc.on("feedback", (event, arg)=>{
  console.log(arg)
  Materialize.toast(arg.text, 3000, 'rounded')
  //alerta(arg);
})
/* LOGIN */
$("#openLoginWindow").click(() => {
    ipc.send("openLoginWindow");
})
$("#code").click(() => {
    ipc.send("code", $("input#code-field").val());
})

/* Main process found episodes */
ipc.on("found", (event, found, sai, ep) => {
    console.log(found);
    console.log(sai);
    console.log(ep);
    $.each(found, (index, value) => {
        let row = $("<tr>",{"data-saison":sai, "data-episode":ep, "data-serie":value});
        $("<td>", {
            text : value
        }).appendTo(row);
        $("<td>", {
            text : sai
        }).appendTo(row);
        $("<td>", {
            text : ep
        }).appendTo(row);
        let button = $("<button>", {
            text:"Save on Trakt",
            class:"btn btn-success postToTrakt"
        });

        button.click((event)=>{
          console.log($(event.target).parent().parent().data("serie"));
          let tr = $(event.target).parent().parent()
          ipc.send("postToTrakt", {"show":tr.data("serie"), "saison":tr.data("saison"), "ep":tr.data("episode")})
        })
        $("<td>").append(button).appendTo(row)
        console.log($("#add-episode tbody"))
        $("#add-episode tbody").append(row);
    });
})
/* POST to api */


/* HOLDER File drop */
const holder = document
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
};
/* TABS */
$("ul.tabs").tabs();
