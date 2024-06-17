button = document.getElementById("button");
box = document.getElementById("box");

button.onclick = function(){
    let score = Number(box.value);
    if (score < 0) {
        window.location.pathname = "/schools/results/3.html";
    }
    else if (score == 0) {
        window.location.pathname = "/schools/results/2.html";
    }
    else if (0 < score && score <= 650) {
        window.location.pathname = "/schools/results/1.html";
    }
    else {
        alert("你要去火星吗？")
    }
}
