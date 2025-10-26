/* Adivina Quién — Liga MX (Sí/No)
   Árbol binario con aprendizaje y persistencia en localStorage.
    */

const LS_KEY = "AQ_LigaMX_Arbol_v1";

// ---- Estructuras ----
function defaultTree() {
  return {
    q: "¿El equipo es de la Ciudad de México (CDMX)?",
    yes: {
      q: "¿Su apodo es 'Águilas'?",
      yes: { guess: "Club América" },
      no: {
        q: "¿Juega en CU como local?",
        yes: { guess: "Pumas UNAM" },
        no: { guess: "Cruz Azul" }
      }
    },
    no: {
      q: "¿El equipo es de Jalisco?",
      yes: {
        q: "¿Sus colores principales incluyen rojo y blanco en franjas?",
        yes: { guess: "Chivas de Guadalajara" },
        no: { guess: "Atlas" }
      },
      no: {
        q: "¿El equipo es del norte y tiene un tigre como mascota?",
        yes: { guess: "Tigres UANL" },
        no: { guess: "Rayados de Monterrey" }
      }
    }
  };
}

// ---- Persistencia ----
function loadTree() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : defaultTree();
  } catch {
    return defaultTree();
  }
}
function saveTree(tree) {
  localStorage.setItem(LS_KEY, JSON.stringify(tree));
}

// ---- Variables globales ----
let tree = loadTree();
let current = null;
let path = [];
let awaiting = "idle";
let newTeamName = "";
let newQuestion = "";
let newTeamAnswerYes = true;

// ---- Elementos ----
const promptEl = document.getElementById("prompt");
const btnYes = document.getElementById("btnYes");
const btnNo = document.getElementById("btnNo");
const btnStart = document.getElementById("btnStart");
const btnReset = document.getElementById("btnReset");
const btnExport = document.getElementById("btnExport");
const btnImport = document.getElementById("btnImport");
const ioBox = document.getElementById("ioBox");

function setPrompt(t) { promptEl.textContent = t; }

// ---- Lógica principal ----
function startGame() {
  current = tree;
  path = [];
  awaiting = "asking";
  setPrompt(current.q || `¿Tu equipo es ${current.guess}?`);
}

function handleYes() {
  if (awaiting === "asking") {
    if (current.q) {
      path.push({ node: current, branch: "yes" });
      current = current.yes;
      setPrompt(current.q || `¿Tu equipo es ${current.guess}?`);
    } else {
      setPrompt(`¡Adiviné! Era ${current.guess}. ¿Jugar otra vez?`);
      awaiting = "idle";
    }
  } else if (awaiting === "learn_question") {
    newTeamAnswerYes = true;
    awaiting = "confirm_insert";
    setPrompt(`Si la respuesta es "Sí" → ${newTeamName}; "No" → ${current.guess}. ¿Confirmar inserción?`);
  } else if (awaiting === "confirm_insert") {
    insertLearnedRule();
  }
}

function handleNo() {
  if (awaiting === "asking") {
    if (current.q) {
      path.push({ node: current, branch: "no" });
      current = current.no;
      setPrompt(current.q || `¿Tu equipo es ${current.guess}?`);
    } else {
      awaiting = "learn_team";
      setPrompt("No acerté 😅. Escribe el nombre del equipo en el cuadro y pulsa Importar.");
      ioBox.value = "";
    }
  } else if (awaiting === "learn_question") {
    newTeamAnswerYes = false;
    awaiting = "confirm_insert";
    setPrompt(`Si la respuesta es "Sí" → ${current.guess}; "No" → ${newTeamName}. ¿Confirmar inserción?`);
  } else if (awaiting === "confirm_insert") {
    awaiting = "idle";
    setPrompt("Aprendizaje cancelado. ¿Iniciar una nueva partida?");
  }
}

function insertLearnedRule() {
  const oldGuess = current.guess;
  const newNode = {
    q: newQuestion,
    yes: newTeamAnswerYes ? { guess: newTeamName } : { guess: oldGuess },
    no: newTeamAnswerYes ? { guess: oldGuess } : { guess: newTeamName }
  };

  if (path.length === 0) {
    tree = newNode;
  } else {
    const parentInfo = path[path.length - 1];
    parentInfo.node[parentInfo.branch] = newNode;
  }

  saveTree(tree);
  awaiting = "idle";
  setPrompt(`¡Gracias! Aprendí sobre "${newTeamName}". ¿Iniciar nueva partida?`);
}

// ---- Botones Import/Export ----
btnImport.addEventListener("click", () => {
  if (awaiting === "learn_team") {
    const name = ioBox.value.trim();
    if (!name) return setPrompt("Escribe el nombre del equipo y vuelve a presionar Importar.");
    newTeamName = name;
    ioBox.value = "";
    awaiting = "learn_question";
    setPrompt(`Escribe una pregunta SÍ/NO que distinga a "${newTeamName}" de "${current.guess}". Luego pulsa Importar.`);
  } else if (awaiting === "learn_question") {
    const q = ioBox.value.trim();
    if (!q || !q.endsWith("?")) return setPrompt("La pregunta debe terminar con '?'.");
    newQuestion = q;
    ioBox.value = "";
    setPrompt(`Para "${newTeamName}", ¿la respuesta es SÍ? Usa los botones Sí/No.`);
  } else {
    try {
      tree = JSON.parse(ioBox.value.trim());
      saveTree(tree);
      setPrompt("Base de conocimiento importada correctamente.");
    } catch {
      setPrompt("JSON inválido.");
    }
  }
});

btnExport.addEventListener("click", () => {
  ioBox.value = JSON.stringify(tree, null, 2);
  setPrompt("Base exportada en el cuadro de texto.");
});

btnReset.addEventListener("click", () => {
  if (confirm("¿Reiniciar el árbol de conocimiento?")) {
    tree = defaultTree();
    saveTree(tree);
    setPrompt("Árbol reiniciado. Pulsa Iniciar partida.");
  }
});

btnStart.addEventListener("click", startGame);
btnYes.addEventListener("click", handleYes);
btnNo.addEventListener("click", handleNo);

setPrompt("Pulsa 'Iniciar partida' para comenzar.");
