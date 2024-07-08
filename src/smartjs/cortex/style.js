import { doc } from "/smartjs/lib/common";

const CORTEX_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');

.cortex-titlebar-root {
    background-color: #2f4f4f;
    color: lightgray;
    border: 2px solid #100c08;
    border-width: 2px 2px 0 2px;
    border-radius: 5px 5px 0 0;
    padding: 2px 6px 2px 6px;
}

.cortex-button-base {
    padding: 3px;
}

.cortex-window-root {
    font-family: "Rubik", sans-serif;
    font-weight: 500;
    font-size: 1rem;
    color: green;
    z-index: 50;
}

.cortex-window-root *::selection {
    background-color: limegreen;
}

.cortex-window-unfoused {
    z-index: 51;
}

.cortex-window-focused {
    z-index: 52;
}

.cortex-window-content-root {
    padding: 6px;
    background-color: black;
    border: 2px solid #100c08;
    border-width: 0 2px 2px 2px;
    border-radius: 0 0 5px 5px;
}

.cortex-infotable {
    overflow: ellipsis;
    user-select: none;
}

.cortex-infotable th {
    padding: 0 4px 0 4px;
    color: black;
    background: green;
    border: none;
    border-radius: 4px;
}

.cortex-infotable td {
    overflow: ellipsis;
    padding: 0 4px 0 4px;
}

.cortex-button-base:hover {
    cursor: pointer;
}

.cortex-root-base {
    font-family: "Rubik", sans-serif;
    font-weight: 500;
    font-size: 1.2rem;
    user-select: none;
}

.cortex-root-base div::selection {
    background-color: lightgray;
}

.cortex-scrollable {
    display: block;
    overflow: auto;
}

.cortex-scrollable::-webkit-scrollbar-track {
    background: black;
}

.cortex-scrollable::-webkit-scrollbar-thumb {
    background: green;
    border-radius: 0;
    border: none;
}

.cortex-scrollable::-webkit-scrollbar:horizontal {
    display: block;
    height: 12px;
}

.cortex-scrollable::-webkit-scrollbar:vertical {
    display: block;
    width: 12px;
}

.cortex-scrollable::-webkit-scrollbar-corner {
    background: transparent;
}

.cortex-resizable {
    overflow: hidden;
}

.cortex-resizable.horizontal {
    resize: horizontal;
}

.cortex-resizable.vertical {
    resize: vertical;
}

.cortex-resizable.cortex-resizable-both {
    resize: both;
}

.cortex-selectable::selection {
    background-color: #0c0;
}


.smartjs-root {
    padding: 6px;
    background-color: black;
    color: #0c0;
    font-family: "Lucida Console", "Lucida Sans Unicode", "Fira Mono", Consolas, "Courier New", Courier, monospace, "Times New Roman";
    font-weight: 400;
    font-size: 0.9rem;
    user-select: none;
    border: 1px solid rgb(68, 68, 68);
}

.smartjs-root::selection {
    background-color: #0c0;
}

.smartjs-clickable {
    background-color: black;
    color: #0c0;
    border: 1px solid green;
    font-family: inherit;
    font-weight: 600;
    font-size: 0.75rem;
    padding: 3px;
    /*cursor: pointer;*/
}

.smartjs-clickable:hover {
    background-color: green;
}

.smartjs-scrollable {
    overflow: scroll;
}

.smartjs-scrollable::-webkit-scrollbar:vertical {
    display: block;
    width: 12px;
}

.smartjs-scrollable::-webkit-scrollbar-track {
    background: black;
}

.smartjs-scrollable::-webkit-scrollbar-thumb {
    background: green;
    border-radius: 0;
    border: 0;
}

/*.smartjs-scrollable::-webkit-scrollbar-thumb:horizontal {
    background: black;
    border-radius: 0;
    border: 0;
}*/

.smartjs-focusable:focus {
    outline: none;
}

.smartjs-infotable th {
    border: 1px solid green;
}

.smartjs-infotable td {
    overflow: ellipsis;
    padding: 0 0 0 6px;
}

.smartjs-select::selection {
    background-color: darkgreen;
}

.smartjs-select div::selection {
    background-color: darkgreen;
}

.smartjs-input {
    padding: 4px;
    background-color: black;
    color: green;
    border: 2px solid green;
    font-family: inherit;
    font-weight: 600;
}

.smartjs-input::selection {
    background-color: #0c0;
}

.smartjs-input:focus {
    outline: none;
}

input.smartjs-checkbox {
    display: block;
    opacity: 0;
    cursor: pointer;
    width: 0;
    height: 0;
}

span.smartjs-checkbox {
    display: block;
    height: 11px;
    width: 11px;
    background-color: transparent;
    border-radius: 0;
    border: 2px solid green;
    cursor: pointer;
}

span.smartjs-checkbox::after {
    display: block;
    content: "";
    height: 0;
    width: 0;
    border-radius: 0;
    border: solid black;
    border-width: 0 3px 3px 0;
    -webkit-transform: rotate(0) scale(0);
    -ms-transform: rotate(0) scale(0);
    transform: rotate(0) scale(0);
    opacity: 1;
}

input.smartjs-checkbox:checked ~ span.smartjs-checkbox {
    background-color: black;
    border-radius: 0;
    -webkit-transform: rotate(0) scale(1);
    -ms-transform: rotate(0) scale(1);
    transform: rotate(0) scale(1);
    opacity: 1;
    border: 2px solid green;
}

input.smartjs-checkbox:checked ~ span.smartjs-checkbox::after {
    margin: 1px 0 0 3px;
    -webkit-transform: rotate(45deg) scale(1);
    -ms-transform: rotate(45deg) scale(1);
    transform: rotate(45def) scale(1);
    opacity: 1;
    height: 6px;
    width: 3px;
    border: solid green;
    border-width: 0 2px 2px 0;
    background-color: transparent;
    border-radius: 0;
}
`;

export function initStyle () {
    let style = doc.getElementById("cortex-style");
    if ( style ) style.remove();
    style = doc.createElement("style");
    style.id = "cortex-style";
    style.innerHTML = CORTEX_STYLE;
    doc.head.appendChild( style );
};