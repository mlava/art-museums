import iziToast from "izitoast";

const config = {
    tabTitle: "Art Museums",
    settings: [
        {
            id: "met-departments",
            name: "The Met - Departments",
            description: "Preferred list of departments within which to search - ",
            action: { type: "input", placeholder: "Add API key here" },
        },
    ]
};
var artworkID, departmentID, searchTerm;

export default {
    onload: ({ extensionAPI }) => {
        extensionAPI.settings.panel.create(config);

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Random artwork (The Met)",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please focus a block before importing an artwork");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchMet().then(async (blocks) => {
                    if (blocks) {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                        for (var i = 0; i < blocks[0].children.length; i++) {
                            var thisBlock = window.roamAlphaAPI.util.generateUID();
                            await window.roamAlphaAPI.createBlock({
                                location: { "parent-uid": uid, order: i + 1 },
                                block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                            });
                        }
                    }
                });
            }
        });

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Random artwork by department (The Met)",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please focus a block before importing an artwork");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchMetD().then(async (blocks) => {
                    if (blocks) {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                        for (var i = 0; i < blocks[0].children.length; i++) {
                            var thisBlock = window.roamAlphaAPI.util.generateUID();
                            await window.roamAlphaAPI.createBlock({
                                location: { "parent-uid": uid, order: i + 1 },
                                block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                            });
                        }
                    }
                });
            }
        });

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Random artwork by search term (The Met)",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please focus a block before importing an artwork");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchMetS().then(async (blocks) => {
                    if (blocks) {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                        for (var i = 0; i < blocks[0].children.length; i++) {
                            var thisBlock = window.roamAlphaAPI.util.generateUID();
                            await window.roamAlphaAPI.createBlock({
                                location: { "parent-uid": uid, order: i + 1 },
                                block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                            });
                        }
                    }
                });
            }
        });

        const args = {
            text: "RANDOMMET",
            help: "Import a Random artwork from The Met",
            handler: (context) => fetchMet,
        };
        const args1 = {
            text: "RANDOMMETD",
            help: "Import a Random artwork from The Met (by department)",
            handler: (context) => fetchMetD,
        };
        const args2 = {
            text: "RANDOMMETS",
            help: "Import a Random artwork from The Met (by search term)",
            handler: (context) => fetchMetS,
        };
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
            window.roamjs.extension.smartblocks.registerCommand(args1);
            window.roamjs.extension.smartblocks.registerCommand(args2);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args) &&
                    window.roamjs.extension.smartblocks.registerCommand(args1) &&
                    window.roamjs.extension.smartblocks.registerCommand(args2)
            );
        }
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Random artwork (The Met)'
        });
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Random artwork by department (The Met)'
        });
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Random artwork by search term (The Met)'
        });
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("RANDOMMET");
            window.roamjs.extension.smartblocks.unregisterCommand("RANDOMMETD");
            window.roamjs.extension.smartblocks.unregisterCommand("RANDOMMETS");
        }
    }
}

async function fetchMet(artworkID, departmentID, searchTerm) {
    if (artworkID == undefined) {
        artworkID = randomIntFromInterval(1, 893439);
    }
    const response = await fetch("https://collectionapi.metmuseum.org/public/collection/v1/objects/" + artworkID + "");

    if (response.ok) {
        const data = await response.json();
        if (data.primaryImage == "") {
            if (departmentID != undefined && departmentID != null) {
                return fetchMetD(departmentID);
            } else if (searchTerm != undefined) {
                return fetchMetS(searchTerm);
            } else {
                return fetchMet();
            }
        }
        let title = data.title.toString();
        let imageurl = data.primaryImageSmall.toString();

        let meta = [];
        meta.push({ "text": "![](" + imageurl + ")" })

        if (data.artistDisplayName != "") {
            let artist = data.artistDisplayName.toString();
            if (data.artistBeginDate != "" && data.artistEndDate != "" && data.artistNationality != "") {
                meta.push({ "text": "Artist:: [[" + artist + "]] (" + data.artistNationality.toString() + ", " + data.artistBeginDate.toString() + " - " + data.artistEndDate.toString() + ")" });
            } else {
                meta.push({ "text": "Artist:: [[" + artist + "]]" });
            }
        }
        if (data.objectDate != "") {
            meta.push({ "text": "Date:: " + data.objectDate.toString() + "" });
        }
        if (data.classification != "") {
            meta.push({ "text": "Classification:: [[" + data.classification.toString() + "]]" });
        }
        if (data.medium != "") {
            meta.push({ "text": "Medium:: [[" + data.medium.toString() + "]]" });
        }
        if (data.department != "") {
            meta.push({ "text": "Department:: [[" + data.department.toString() + "]]" });
        }
        if (data.culture != "") {
            meta.push({ "text": "Culture:: [[" + data.culture.toString() + "]]" });
        }
        if (data.country != "") {
            meta.push({ "text": "Country:: [[" + data.country.toString() + "]]" });
        }
        if (data.period != "") {
            meta.push({ "text": "Period:: [[" + data.period.toString() + "]]" });
        }
        if (data.creditLine != "") {
            meta.push({ "text": "Credit:: " + data.creditLine.toString() + "" });
        }
        if (data.repository != "") {
            meta.push({ "text": "Repository:: " + data.repository.toString() + "" });
        }
        if (data.additionalImages.length > 0) {
            let imageString = "";
            for (var i = 0; i < data.additionalImages.length; i++) {
                imageString += "[Image](" + encodeURI(data.additionalImages[i]) + ") "
            }
            meta.push({ "text": "**Alternative Images:** " + imageString + "" });
        }
        let final = [];
        final.push({
            text: "**[[" + title + "]]**",
            children: meta
        });
        return final;
    } else if (response.status == "404") {
        if (departmentID != undefined && departmentID != null) {
            return fetchMetD(departmentID);
        } else if (searchTerm != undefined) {
            return fetchMetS(searchTerm);
        } else {
            return fetchMet();
        }
    }
};

async function fetchMetD(departmentID) {
    if (departmentID == undefined) {
        let string = "In which department do you wish to search?";
        let selectString = "<select><option value=\"\">Select</option><option value=\"1\">American Decorative Arts</option>";
        selectString += "<option value=\"3\">Ancient Near Eastern Art</option>";
        selectString += "<option value=\"4\">Arms and Armor</option>";
        selectString += "<option value=\"5\">Arts of Africa, Oceania, and the Americas</option>";
        selectString += "<option value=\"6\">Asian Art</option>";
        selectString += "<option value=\"7\">The Cloisters</option>";
        selectString += "<option value=\"8\">The Costume Institute</option>";
        selectString += "<option value=\"9\">Drawings and Prints</option>";
        selectString += "<option value=\"10\">Egyptian Art</option>";
        selectString += "<option value=\"11\">European Paintings</option>";
        selectString += "<option value=\"12\">European Sculpture and Decorative Arts</option>";
        selectString += "<option value=\"13\">Greek and Roman Art</option>";
        selectString += "<option value=\"14\">Islamic Art</option>";
        selectString += "<option value=\"15\">The Robert Lehman Collection</option>";
        selectString += "<option value=\"16\">The Libraries</option>";
        selectString += "<option value=\"17\">Medieval Art</option>";
        selectString += "<option value=\"18\">Musical Instruments</option>";
        selectString += "<option value=\"19\">Photographs</option>";
        selectString += "<option value=\"21\">Modern Art</option>";
        selectString += "</select>";
        departmentID = await prompt(string, selectString, 1);
    }
    const response = await fetch("https://collectionapi.metmuseum.org/public/collection/v1/objects?departmentIds=" + departmentID + "");
    const data = await response.json();
    let departmentTotal = parseInt(data.total);
    let random = randomIntFromInterval(1, departmentTotal);
    let artworkID = data.objectIDs[random];

    return fetchMet(artworkID, departmentID);
};

async function fetchMetS(searchTerm) {
    if (searchTerm == undefined) {
        let string = "What do you want to search for?";
        searchTerm = await prompt(string, null, 2);
    }
    const response = await fetch("https://collectionapi.metmuseum.org/public/collection/v1/search?q=" + searchTerm + "&hasImages=true");
    const data = await response.json();
    let searchTotal = parseInt(data.total);
    let random = randomIntFromInterval(1, searchTotal);
    let artworkID = data.objectIDs[random];

    return fetchMet(artworkID, null, searchTerm);
};

function sendConfigAlert(key) {
    if (key == "API") {
        alert("Please set your NASA API key in the configuration settings via the Roam Depot tab.");
    }
}

async function prompt(string, selectString, type) {
    if (type == 1) {
        return new Promise((resolve) => {
            iziToast.question({
                theme: 'light',
                color: 'black',
                layout: 2,
                drag: false,
                timeout: 20000,
                close: false,
                overlay: true,
                title: "Art Museums",
                message: string,
                position: 'center',
                inputs: [
                    [selectString, 'change', function (instance, toast, select, e) { }]
                ],
                buttons: [
                    ['<button><b>Confirm</b></button>', function (instance, toast, button, e, inputs) {
                        instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                        resolve(inputs[0].options[inputs[0].selectedIndex].value);
                    }, false], // true to focus
                    [
                        "<button>Cancel</button>",
                        function (instance, toast, button, e) {
                            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                        },
                    ],
                ]
            });
        })
    } else if (type == 2) {
        return new Promise((resolve) => {
            iziToast.question({
                theme: 'light',
                color: 'black',
                layout: 2,
                drag: false,
                timeout: 20000,
                close: false,
                overlay: true,
                displayMode: 2,
                id: "question",
                title: "Art Museums",
                message: string,
                position: "center",
                inputs: [
                    [
                        '<input type="text" placeholder="">',
                        "keyup",
                        function (instance, toast, input, e) {
                            if (e.code === "Enter") {
                                instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                                resolve(e.srcElement.value);
                            }
                        },
                        true,
                    ],
                ],
                buttons: [
                    [
                        "<button><b>Confirm</b></button>",
                        async function (instance, toast, button, e, inputs) {
                            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                            resolve(inputs[0].value);
                        },
                        false,
                    ],
                    [
                        "<button>Cancel</button>",
                        async function (instance, toast, button, e) {
                            instance.hide({ transitionOut: "fadeOut" }, toast, "button");
                        },
                    ],
                ],
                onClosing: function (instance, toast, closedBy) { },
                onClosed: function (instance, toast, closedBy) { },
            });
        })
    }
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}