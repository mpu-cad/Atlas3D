var viewerApp;

var infoDiv = document.getElementById("info");
var detailsList = document.getElementById("details-list");

var isAsideVisible = true; // Виден ли сайдбар
var isInfoVisible = true; // Виден ли блок инфрмации

var activeRecuder = {}; // Переменная, которая хранит информацию о текущем выбранном редукторе из списка
var hiddenParts = [];
var isolatedParts = [];

init(); // Вызываем функцию init(), которая добавляет иконки в сайдбар и загружет вьювер с редуктором, и информацию

function init() {
    for (let reducer of reducers) {
        let img = document.createElement("img");
        img.src = reducer.img;
        img.onclick = function () {
            isolatedParts = [];
            hiddenParts = [];
            loadReducer(reducer.id);
        };
        document.getElementById("sidebar").append(img);
    }

    var options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2',  // for models uploaded to EMEA change this option to 'derivativeV2_EU'
        getAccessToken: getForgeToken,
    }

    function getForgeToken(onTokenReady) {
        $.get("/oauth", (data) => {
            var token = data.access_token;
            var timeInSeconds = data.expires_in; // Use value provided by Forge Authentication (OAuth) API
            onTokenReady(token, timeInSeconds);
        });
    }

    // В случае успеха
    Autodesk.Viewing.Initializer(options, function onInitialized() {
        // Инициализация вьювера
        viewerApp = new Autodesk.Viewing.ViewingApplication("viewer"); // Создаем вьювер
        viewerApp.registerViewer(
            viewerApp.k3D,
            Autodesk.Viewing.Private.GuiViewer3D
        );
        loadReducer(1); // По-умолчанию загружаем первый редуктор
    });
}

function updateInfo(title, content) {
    // Поменять содержимое в блоке информации с названием title и содержимым content
    let section = document.createElement("section"); // Создание HTML элемента <section>
    section.innerHTML = `<h5>${title}</h5>` + content; // Вставляем внутри тэга HTML код
    infoDiv.innerHTML = ""; // Сброс текущего содержимого
    infoDiv.append(section); // Добавление нового содержимого
}

function loadReducer(i) {
    // Загрузить и отобразить редуктор с i-тым порядковым номером
    for (let reducer of reducers) {
        if (reducer.id === i) {
            viewerApp.loadDocument(
                reducer.urn,
                onDocumentLoadSuccess,
                onDocumentLoadFailure
            ); // Загрузка модели из URN
            updateInfo(reducer.name, reducer.description); // Вывод информации о редукторе в блок информации

            detailsList.innerHTML = ""; // Сброс списка деталей

            // Добавляем в список основные детали для нового редуктора
            for (let detail of reducer.details) {
                let option = document.createElement("option");
                option.innerText = detail.name;
                option.value = detail.id;
                option.onclick = function () {
                    updateInfo(detail.name, detail.description);
                    NOP_VIEWER.isolate(detail.id);
                };
                detailsList.append(option);
            }

            activeRecuder = reducer; // Меняем переменную выбранного редуктора
        }
    }
}

function onDocumentLoadSuccess(doc) {
    // Функция, которая вызывается после успешного получения модели с сервера Forge
    var viewables = viewerApp.bubble.search({ type: "geometry" });
    if (viewables.length === 0) {
        console.error("Не удалось загрузить модель");
        return;
    }

    viewerApp.selectItem(viewables[0].data, onItemLoadSuccess, onItemLoadFail); // Загрузить модель после получения с сервера во вьюевер

    let btn = document.createElement("button");
    btn.id = "hideBtnSidebar";
    btn.innerText = isAsideVisible ? "<" : ">";
    btn.onclick = function () {
        if (isAsideVisible) {
            document.getElementById("viewer").style["gridColumnStart"] = 1;
            isAsideVisible = false;
            btn.innerText = ">";
            hiddenParts = NOP_VIEWER.getHiddenNodes();
            isolatedParts = NOP_VIEWER.getIsolatedNodes();
            viewerApp = new Autodesk.Viewing.ViewingApplication("viewer"); // Пересоздаем вьювер
            viewerApp.registerViewer(
                viewerApp.k3D,
                Autodesk.Viewing.Private.GuiViewer3D
            );
            loadReducer(activeRecuder.id);
        } else {
            document.getElementById("viewer").style["gridColumnStart"] = 2;
            btn.innerText = "<";
            isAsideVisible = true;
            hiddenParts = NOP_VIEWER.getHiddenNodes();
            isolatedParts = NOP_VIEWER.getIsolatedNodes();
            viewerApp = new Autodesk.Viewing.ViewingApplication("viewer"); // Пересоздаем вьювер
            viewerApp.registerViewer(
                viewerApp.k3D,
                Autodesk.Viewing.Private.GuiViewer3D
            );
            loadReducer(activeRecuder.id);
        }
    };
    document.getElementById("viewer").append(btn);

    let btn2 = document.createElement("button");
    btn2.id = "hideBtnInfo";
    btn2.innerText = isInfoVisible ? ">" : "<";
    btn2.onclick = function () {
        if (isInfoVisible) {
            document.getElementById("viewer").style["gridColumnEnd"] = 4;
            isInfoVisible = false;
            btn2.innerText = "<";
            hiddenParts = NOP_VIEWER.getHiddenNodes();
            isolatedParts = NOP_VIEWER.getIsolatedNodes();
            viewerApp = new Autodesk.Viewing.ViewingApplication("viewer"); // Пересоздаем вьювер
            viewerApp.registerViewer(
                viewerApp.k3D,
                Autodesk.Viewing.Private.GuiViewer3D
            );
            loadReducer(activeRecuder.id);
        } else {
            document.getElementById("viewer").style["gridColumnEnd"] = 3;
            isInfoVisible = true;
            btn2.innerText = ">";
            hiddenParts = NOP_VIEWER.getHiddenNodes();
            isolatedParts = NOP_VIEWER.getIsolatedNodes();
            viewerApp = new Autodesk.Viewing.ViewingApplication("viewer"); // Пересоздаем вьювер
            viewerApp.registerViewer(
                viewerApp.k3D,
                Autodesk.Viewing.Private.GuiViewer3D
            );
            loadReducer(activeRecuder.id);
        }
    };
    document.getElementById("viewer").append(btn2);

    viewerApp
        .getViewer()
        .addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, (e) => {
            // Функция, срабатывает после полной загрузки модели
            NOP_VIEWER.setLightPreset(1); // Сделать фон серым
            if (exploded) NOP_VIEWER.explode(0.5);
            if (isolatedParts.length > 0) {
                NOP_VIEWER.isolate(isolatedParts);
            } else {
                reset(); // Скрыть крышку редуктора по-умолчанию после загрузки
                NOP_VIEWER.hide(hiddenParts);
            }
        });

    viewerApp
        .getViewer()
        .addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (e) => {
            // Функция, срабатывает после выбора какой-то детали
            console.log(e.dbIdArray); // Вывести в консоль номер выбранной детали

            if (isInfoVisible) {
                for (let option of detailsList.children) {
                    option.selected = false;
                }

                let found = false;

                for (let option of detailsList.children) {
                    let ids = option.value.split(",").map(function (item) {
                        return parseInt(item, 10);
                    });

                    if (ids.includes(e.dbIdArray[0])) {
                        option.selected = true;
                        option.click();
                        found = true;
                    }
                }

                if (!found) {
                    updateInfo(activeRecuder.name, activeRecuder.description);
                }
            }
        });
}

function onDocumentLoadFailure(viewerErrorCode) {
    console.error(
        "Не удалось загрузить модель с сервера. Код ошибки: " + viewerErrorCode
    );
}

function onItemLoadSuccess(viewer, item) {
    console.log("Модель успешно загружена!");
}

function onItemLoadFail(errorCode) {
    console.error("Не удалось загрузить модель. Код ошибки: " + errorCode);
}

var exploded = false;
function explode() {
    exploded = !exploded;
    if (exploded) {
        NOP_VIEWER.explode(0.5);
        for (let but of document.getElementsByClassName("explode")) {
            but.innerText = "Обычный вид";
        }
    } else {
        NOP_VIEWER.explode(0);
        for (let but of document.getElementsByClassName("explode")) {
            but.innerText = "Разнесенный вид";
        }
    }
}

function reset() {
    NOP_VIEWER.isolate(0);
    NOP_VIEWER.hide(activeRecuder.hide);
}
