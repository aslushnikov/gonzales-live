var editor = null;
document.addEventListener("DOMContentLoaded", function(event) {
    var input = document.querySelector("#input");
    var cm = CodeMirror(input, {
        mode:  "text/x-scss",
        indentUnit: 4
    });
    cm.on("change", onTextChanged);
    var defaultText = "div {\n    color: red;\n}";
    var text = localStorage.getItem("text") || defaultText;
    cm.setValue(text);
    window.editor = cm;
});

function onTextChanged(codemirror)
{
    var text = codemirror.getValue();
    localStorage.setItem("text", text);

    var output = document.querySelector("#output");
    output.innerHTML = "";
    try {
        var tree = gonzales.parse(text, {syntax: "scss", needInfo: true});
        output.appendChild(dumpNode(tree));
    } catch (e) {
        console.error(e);
        var err = div("error", output);
        err.textContent = e.message;
    }
}

var specialCare = new Set([
    "type",
    "start",
    "end",
    "content"
]);

function toggleContainer(element, event)
{
    element.classList.toggle("hide");
    event.preventDefault(true);
    event.stopPropagation();
}

var textMark = null;
function onMouseOver(element, node, event)
{
    element.classList.toggle("mouseover", true);
    if (textMark) {
        textMark.clear();
        textMark = null;
    }
    if (window.editor) {
        var from = {line: node.start.line - 1, ch: node.start.column - 1};
        var to = {line: node.end.line - 1, ch: node.end.column};
        textMark = window.editor.markText(from, to, {className: "highlight-text"});
    }
    event.preventDefault();
    event.stopPropagation();
}

function onMouseOut(element, event)
{
    element.classList.toggle("mouseover", false);
    if (textMark) {
        textMark.clear();
        textMark = null;
    }
    event.preventDefault();
    event.stopPropagation();
}

function dumpNode(node)
{
    var element = div("node");

    var infoNode = div("info", element);
    var leftSide = div("left-side", infoNode);
    var rightSide = div("right-side", infoNode);
    rightSide.addEventListener("click", toggleContainer.bind(null, element), false);
    rightSide.addEventListener("mouseover", onMouseOver.bind(null, element, node), false);
    rightSide.addEventListener("mouseout", onMouseOut.bind(null, element), false);
    span("", rightSide).textContent = "toggle";

    var type = div("node-type", leftSide);
    span("name", type).textContent = node.type;
    span("details", type).textContent = "...";

    var start = div("node-start", leftSide);
    span("name", start).textContent = "start";
    span("value", start).textContent = `{line: ${node.start.line}, column: ${node.start.column}}`;

    var end = div("node-end", leftSide);
    span("name", end).textContent = "end";
    span("value", end).textContent = `{line: ${node.end.line}, column: ${node.end.column}}`;

    for (var key in node) {
        if (specialCare.has(key))
            continue;
        if (!node.hasOwnProperty(key))
            continue;
        var detail = div("node-detail", leftSide);
        span("name", detail).textContent = key;
        var value = node[key];
        var typeString = "object";
        if (typeof value === "string")
            typeString = value;
        else if (typeof value === "number")
            typeString = value;
        else if (typeof value === "boolean")
            typeString = value;
        span("value", detail).textContent = typeString
    }

    if (typeof node.content === "string") {
        var content = div("node-content", leftSide)
        span("name", content).textContent = "content";
        span("value", content).textContent = `"${node.content}"`;
    } else {
        var c = div("children-container", element);
        for (var child of node.content)
            c.appendChild(dumpNode(child));
    }

    return element;
}

function div(className, parent) {
    var d = document.createElement("div");
    if (className)
        d.classList.add(className);
    if (parent)
        parent.appendChild(d);
    return d;
}

function span(className, parent) {
    var s = document.createElement("span");
    if (className)
        s.classList.add(className);
    if (parent)
        parent.appendChild(s);
    return s;
}
