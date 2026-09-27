const SUPABASE_URL =
  "https://kbwqabwusxqaomgubzqg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_NV_3lSWmBH-pEOAAMp8ftw_NAEi7DqA";


const PROTOTYPE_ADMINS = [
  {
    username: "JKNN",
    password: "SOTfree"
  }
];


const DEFAULT_SCORING = {
  win: 10,
  mvp: 5,
  quadra: 8,
  penta: 12,
  additionalPoint: 1
};


/* =========================================================
   SUPABASE
   ========================================================= */

let supabaseClient = null;


/* =========================================================
   STATE
   ========================================================= */

let players = [];

let scoring = {
  ...DEFAULT_SCORING
};

let currentMatch = 1;

let tournament = {
  number: 1,
  status: "LIVE"
};

let history = [];

let isAdmin = false;


/* =========================================================
   HELPER
   ========================================================= */

const $ = id =>
  document.getElementById(id);


/* =========================================================
   ERROR HELPER
   ========================================================= */

function showDatabaseError(
  title,
  error
) {

  console.error(
    title,
    error
  );


  const message =
    error?.message ||
    "Unknown database error.";

  const details =
    error?.details ||
    "None";

  const hint =
    error?.hint ||
    "None";

  const code =
    error?.code ||
    "None";


  alert(
    title +
    "\n\n" +
    "Message: " +
    message +
    "\n\n" +
    "Details: " +
    details +
    "\n\n" +
    "Hint: " +
    hint +
    "\n\n" +
    "Code: " +
    code
  );

}


/* =========================================================
   SUPABASE LOADER
   ========================================================= */

function loadSupabaseLibrary() {

  return new Promise(
    (resolve, reject) => {

      if (
        window.supabase &&
        typeof window.supabase.createClient ===
          "function"
      ) {

        resolve();

        return;

      }


      const existingScript =
        document.querySelector(
          'script[src*="supabase-js"]'
        );


      if (existingScript) {

        existingScript.addEventListener(
          "load",
          () => resolve()
        );


        existingScript.addEventListener(
          "error",
          () =>
            reject(
              new Error(
                "Unable to load Supabase library."
              )
            )
        );


        return;

      }


      const script =
        document.createElement("script");


      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


      script.onload =
        () => resolve();


      script.onerror =
        () =>
          reject(
            new Error(
              "Unable to load Supabase library."
            )
          );


      document.head.appendChild(
        script
      );

    }
  );

}


/* =========================================================
   SUPABASE INIT
   ========================================================= */

async function initializeSupabase() {

  await loadSupabaseLibrary();


  if (
    !window.supabase ||
    typeof window.supabase.createClient !==
      "function"
  ) {

    throw new Error(
      "Supabase library is unavailable."
    );

  }


  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );


  if (!supabaseClient) {

    throw new Error(
      "Supabase client could not be created."
    );

  }

}


/* =========================================================
   DATABASE
   ========================================================= */

const Database = {


  /* =====================================================
     PLAYERS
     ===================================================== */

  async loadPlayers() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("players")
        .select("*");


    if (error) {

      showDatabaseError(
        "Failed to load players from database.",
        error
      );

      return [];

    }


    return (
      data || []
    ).map(
      row => ({

        id:
          row.id,

        name:
          row.name,

        achievements: {

          win:
            Number(row.win) || 0,

          mvp:
            Number(row.mvp) || 0,

          quadra:
            Number(row.quadra) || 0,

          penta:
            Number(row.penta) || 0,

          additionalPoint:
            Number(row.additional_point) || 0

        },

        score:
          Number(row.score) || 0,

        updatedAt:
          row.updated_at ||
          new Date().toISOString()

      })
    );

  },


  /* =====================================================
     SAVE ALL PLAYERS
     ===================================================== */

  async savePlayers(data) {

    if (!supabaseClient) {

      alert(
        "Supabase is not connected."
      );

      return false;

    }


    const {
      data: existingRows,
      error: existingError
    } =
      await supabaseClient
        .from("players")
        .select("id");


    if (existingError) {

      showDatabaseError(
        "Failed to read existing players.",
        existingError
      );

      return false;

    }


    const newIds =
      new Set(
        data.map(
          player => player.id
        )
      );


    const idsToDelete =
      (existingRows || [])
        .map(
          row => row.id
        )
        .filter(
          id =>
            !newIds.has(id)
        );


    if (
      idsToDelete.length
    ) {

      const {
        error
      } =
        await supabaseClient
          .from("players")
          .delete()
          .in(
            "id",
            idsToDelete
          );


      if (error) {

        showDatabaseError(
          "Failed to delete players from database.",
          error
        );

        return false;

      }

    }


    if (!data.length) {

      return true;

    }


    const rows =
      data.map(
        player => ({

          id:
            String(
              player.id
            ),

          name:
            String(
              player.name
            ),

          win:
            Number(
              player.achievements?.win
            ) || 0,

          mvp:
            Number(
              player.achievements?.mvp
            ) || 0,

          quadra:
            Number(
              player.achievements?.quadra
            ) || 0,

          penta:
            Number(
              player.achievements?.penta
            ) || 0,

          additional_point:
            Number(
              player.achievements?.additionalPoint
            ) || 0,

          score:
            Number(
              player.score
            ) || 0

        })
      );


    console.log(
      "Saving players to Supabase:",
      rows
    );


    const {
      data: savedRows,
      error: saveError
    } =
      await supabaseClient
        .from("players")
        .upsert(
          rows,
          {
            onConflict: "id"
          }
        )
        .select();


    if (saveError) {

      showDatabaseError(
        "Failed to save player to database.",
        saveError
      );

      return false;

    }


    console.log(
      "Players saved successfully:",
      savedRows
    );


    return true;

  },


  /* =====================================================
     SCORING
     ===================================================== */

  async loadScoring() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("scoring")
        .select("*")
        .eq(
          "id",
          1
        )
        .maybeSingle();


    if (error) {

      showDatabaseError(
        "Failed to load scoring.",
        error
      );

      return {
        ...DEFAULT_SCORING
      };

    }


    if (!data) {

      return {
        ...DEFAULT_SCORING
      };

    }


    return {

      win:
        Number(data.win) || 0,

      mvp:
        Number(data.mvp) || 0,

      quadra:
        Number(data.quadra) || 0,

      penta:
        Number(data.penta) || 0,

      additionalPoint:
        Number(data.additional_point) || 0

    };

  },


  async saveScoring(data) {

    const {
      error
    } =
      await supabaseClient
        .from("scoring")
        .upsert({

          id: 1,

          win:
            Number(data.win) || 0,

          mvp:
            Number(data.mvp) || 0,

          quadra:
            Number(data.quadra) || 0,

          penta:
            Number(data.penta) || 0,

          additional_point:
            Number(data.additionalPoint) || 0

        });


    if (error) {

      showDatabaseError(
        "Failed to save scoring.",
        error
      );

      return false;

    }


    return true;

  },


  /* =====================================================
     TOURNAMENT
     ===================================================== */

  async loadTournament() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("tournament")
        .select("*")
        .eq(
          "id",
          1
        )
        .maybeSingle();


    if (error) {

      showDatabaseError(
        "Failed to load tournament.",
        error
      );

      return {
        number: 1,
        status: "LIVE"
      };

    }


    if (!data) {

      return {
        number: 1,
        status: "LIVE"
      };

    }


    return {

      number:
        Number(
          data.tournament_number
        ) || 1,

      status:
        "LIVE"

    };

  },


  async saveTournament(data) {

    const {
      error
    } =
      await supabaseClient
        .from("tournament")
        .upsert({

          id: 1,

          current_match:
            Number(currentMatch) || 1,

          tournament_number:
            Number(data.number) || 1

        });


    if (error) {

      showDatabaseError(
        "Failed to save tournament.",
        error
      );

      return false;

    }


    return true;

  },


  /* =====================================================
     MATCH
     ===================================================== */

  async loadMatch() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("tournament")
        .select(
          "current_match"
        )
        .eq(
          "id",
          1
        )
        .maybeSingle();


    if (error) {

      showDatabaseError(
        "Failed to load current match.",
        error
      );

      return 1;

    }


    const number =
      Number(
        data?.current_match
      );


    return number >= 1
      ? number
      : 1;

  },


  async saveMatch(number) {

    const {
      error
    } =
      await supabaseClient
        .from("tournament")
        .upsert({

          id: 1,

          current_match:
            Math.max(
              1,
              Number(number) || 1
            ),

          tournament_number:
            Number(
              tournament.number
            ) || 1

        });


    if (error) {

      showDatabaseError(
        "Failed to save current match.",
        error
      );

      return false;

    }


    return true;

  },


  /* =====================================================
     HISTORY
     ===================================================== */

  async loadHistory() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "tournament_history"
        )
        .select("*")
        .order(
          "archived_at",
          {
            ascending: false
          }
        );


    if (error) {

      showDatabaseError(
        "Failed to load tournament history.",
        error
      );

      return [];

    }


    return (
      data || []
    ).map(
      row => ({

        id:
          row.id,

        tournamentNumber:
          row.tournament_number,

        date:
          row.archived_at,

        matchCount:
          row.players?.matchCount || 1,

        players:
          row.players?.players || []

      })
    );

  },


  async saveHistoryItem(
    tournamentData
  ) {

    const {
      error
    } =
      await supabaseClient
        .from(
          "tournament_history"
        )
        .insert({

          tournament_number:
            tournamentData.tournamentNumber,

          players: {

            players:
              tournamentData.players,

            matchCount:
              tournamentData.matchCount

          },

          archived_at:
            tournamentData.date

        });


    if (error) {

      showDatabaseError(
        "Failed to save tournament history.",
        error
      );

      return false;

    }


    return true;

  }

};


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      await initializeSupabase();


      console.log(
        "Supabase initialized."
      );


      players =
        await Database.loadPlayers();


      scoring =
        await Database.loadScoring();


      tournament =
        await Database.loadTournament();


      currentMatch =
        await Database.loadMatch();


      history =
        await Database.loadHistory();


      recalculateScores();


      loadScoringInputs();


      setupEvents();


      renderEverything();


      console.log(
        "SOT connected to Supabase."
      );

    } catch (error) {

      console.error(
        "SOT startup error:",
        error
      );


      alert(
        "Unable to connect to SOT database.\n\n" +
        (error?.message || error)
      );

    }

  }
);


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

  $("loginBtn").addEventListener(
    "click",
    openLogin
  );


  $("logoutBtn").addEventListener(
    "click",
    logout
  );


  $("loginForm").addEventListener(
    "submit",
    login
  );


  $("playerForm").addEventListener(
    "submit",
    addPlayer
  );


  $("playerName").addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        $("playerForm").requestSubmit();

      }

    }
  );


  $("applyScoring").addEventListener(
    "click",
    applyScoring
  );


  $("updateLeaderboardBtn").addEventListener(
    "click",
    updateLeaderboard
  );


  $("newTournamentBtn").addEventListener(
    "click",
    newTournament
  );


  $("generateResultBtn").addEventListener(
    "click",
    generateResultImage
  );


  $("currentMatch").addEventListener(
    "change",
    event => {

      setMatch(
        event.target.value
      );

    }
  );


  $("search").addEventListener(
    "input",
    renderLeaderboard
  );


  const addPlayerShortcut =
    $("addPlayerShortcutBtn");


  if (
    addPlayerShortcut
  ) {

    addPlayerShortcut.addEventListener(
      "click",
      focusAddPlayer
    );

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

function openLogin() {

  $("loginPanel").style.display =
    "block";


  $("loginUsername").focus();

}


function login(event) {

  event.preventDefault();


  const username =
    $("loginUsername")
      .value
      .trim();


  const password =
    $("loginPassword")
      .value;


  const valid =
    PROTOTYPE_ADMINS.some(
      admin =>
        admin.username === username &&
        admin.password === password
    );


  if (!valid) {

    $("loginMessage").style.display =
      "block";


    $("loginMessage").textContent =
      "Invalid username or password.";


    $("loginMessage").style.color =
      "#ff5260";


    return;

  }


  isAdmin = true;


  $("loginPanel").style.display =
    "none";


  $("adminControls").style.display =
    "grid";


  $("loginBtn").style.display =
    "none";


  $("logoutBtn").style.display =
    "inline-block";


  $("authStatus").textContent =
    "ADMIN";


  $("loginForm").reset();


  $("loginMessage").style.display =
    "none";


  renderEverything();

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

  isAdmin = false;


  $("adminControls").style.display =
    "none";


  $("loginBtn").style.display =
    "inline-block";


  $("logoutBtn").style.display =
    "none";


  $("authStatus").textContent =
    "VIEWER";


  $("loginPanel").style.display =
    "none";


  renderEverything();

}


/* =========================================================
   ADD PLAYER PANEL
   ========================================================= */

function focusAddPlayer() {

  if (!isAdmin) return;


  const panel =
    $("addPlayerPanel");


  const input =
    $("playerName");


  if (
    !panel ||
    !input
  ) return;


  panel.scrollIntoView({

    behavior: "smooth",

    block: "center"

  });


  setTimeout(
    () => {

      input.focus();

    },
    300
  );

}


/* =========================================================
   PLAYER
   ========================================================= */

function createPlayer(name) {

  return {

    id:
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID ===
        "function"

        ? crypto.randomUUID()

        : (
            Date.now().toString() +
            "-" +
            Math.random()
              .toString(36)
              .slice(2)
          ),

    name,

    achievements: {

      win: 0,

      mvp: 0,

      quadra: 0,

      penta: 0,

      additionalPoint: 0

    },

    score: 0,

    updatedAt:
      new Date().toISOString()

  };

}


async function addPlayer(event) {

  event.preventDefault();


  if (!isAdmin) {

    return;

  }


  const name =
    $("playerName")
      .value
      .trim();


  if (!name) {

    return;

  }


  const exists =
    players.some(
      player =>
        player.name
          .toLowerCase() ===
        name.toLowerCase()
    );


  if (exists) {

    alert(
      "Player already exists."
    );


    $("playerName").focus();


    return;

  }


  const player =
    createPlayer(name);


  const oldPlayers =
    [...players];


  players.push(
    player
  );


  recalculateScores();


  console.log(
    "Attempting to add player:",
    player
  );


  const success =
    await Database.savePlayers(
      players
    );


  if (!success) {

    players =
      oldPlayers;


    return;

  }


  $("playerForm").reset();


  renderEverything();


  $("playerName").focus();


  console.log(
    "Player added successfully:",
    player.name
  );

}


async function editPlayer(id) {

  if (!isAdmin) return;


  const player =
    players.find(
      p =>
        p.id === id
    );


  if (!player) return;


  const name =
    prompt(
      "Enter new player name:",
      player.name
    );


  if (
    name === null
  ) return;


  const cleaned =
    name.trim();


  if (!cleaned) return;


  const duplicate =
    players.some(
      p =>
        p.id !== id &&
        p.name
          .toLowerCase() ===
        cleaned.toLowerCase()
    );


  if (duplicate) {

    alert(
      "Player already exists."
    );


    return;

  }


  const oldName =
    player.name;


  player.name =
    cleaned;


  player.updatedAt =
    new Date().toISOString();


  const success =
    await Database.savePlayers(
      players
    );


  if (!success) {

    player.name =
      oldName;


    return;

  }


  renderEverything();

}


async function deletePlayer(id) {

  if (!isAdmin) return;


  const player =
    players.find(
      p =>
        p.id === id
    );


  if (!player) return;


  if (
    !confirm(
      `Delete ${player.name}?`
    )
  ) {

    return;

  }


  const oldPlayers =
    [...players];


  players =
    players.filter(
      p =>
        p.id !== id
    );


  const success =
    await Database.savePlayers(
      players
    );


  if (!success) {

    players =
      oldPlayers;


    return;

  }


  renderEverything();

}


/* =========================================================
   SCORING
   ========================================================= */

function calculateScore(player) {

  const a =
    player.achievements;


  return (

    a.win *
      scoring.win +

    a.mvp *
      scoring.mvp +

    a.quadra *
      scoring.quadra +

    a.penta *
      scoring.penta +

    a.additionalPoint *
      scoring.additionalPoint

  );

}


function recalculateScores() {

  players.forEach(
    player => {

      player.score =
        calculateScore(
          player
        );

    }
  );

}


async function changeAchievement(
  playerId,
  type,
  amount
) {

  if (!isAdmin) return;


  const player =
    players.find(
      p =>
        p.id === playerId
    );


  if (!player) return;


  if (
    !Object.prototype.hasOwnProperty.call(
      player.achievements,
      type
    )
  ) return;


  const oldValue =
    player.achievements[type];


  player.achievements[type] =
    Math.max(
      0,
      player.achievements[type] +
        amount
    );


  player.score =
    calculateScore(
      player
    );


  player.updatedAt =
    new Date().toISOString();


  const success =
    await Database.savePlayers(
      players
    );


  if (!success) {

    player.achievements[type] =
      oldValue;


    player.score =
      calculateScore(
        player
      );


    return;

  }


  renderEverything();

}


/* =========================================================
   SCORING SETTINGS
   ========================================================= */

function loadScoringInputs() {

  $("winPoints").value =
    scoring.win;


  $("mvpPoints").value =
    scoring.mvp;


  $("quadraPoints").value =
    scoring.quadra;


  $("pentaPoints").value =
    scoring.penta;


  $("additionalPointPoints").value =
    scoring.additionalPoint;

}


function getNumber(id) {

  const value =
    Number(
      $(id).value
    );


  if (
    Number.isFinite(value) &&
    value >= 0
  ) {

    return Math.floor(
      value
    );

  }


  return 0;

}


async function applyScoring() {

  if (!isAdmin) return;


  const oldScoring =
    {
      ...scoring
    };


  scoring = {

    win:
      getNumber(
        "winPoints"
      ),

    mvp:
      getNumber(
        "mvpPoints"
      ),

    quadra:
      getNumber(
        "quadraPoints"
      ),

    penta:
      getNumber(
        "pentaPoints"
      ),

    additionalPoint:
      getNumber(
        "additionalPointPoints"
      )

  };


  const scoringSaved =
    await Database.saveScoring(
      scoring
    );


  if (!scoringSaved) {

    scoring =
      oldScoring;


    loadScoringInputs();


    return;

  }


  recalculateScores();


  const playersSaved =
    await Database.savePlayers(
      players
    );


  if (!playersSaved) {

    alert(
      "Scoring saved, but player scores could not be updated."
    );

  }


  renderEverything();


  alert(
    "Scoring updated successfully."
  );

}


/* =========================================================
   LIVE MATCH
   ========================================================= */

async function changeMatch(
  amount
) {

  if (!isAdmin) return;


  const oldMatch =
    currentMatch;


  currentMatch =
    Math.max(
      1,
      currentMatch +
        amount
    );


  const success =
    await Database.saveMatch(
      currentMatch
    );


  if (!success) {

    currentMatch =
      oldMatch;


    return;

  }


  updateMatchDisplay();

}


async function setMatch(
  value
) {

  if (!isAdmin) return;


  const number =
    Math.floor(
      Number(value)
    );


  const oldMatch =
    currentMatch;


  currentMatch =
    Math.max(
      1,
      Number.isFinite(number)
        ? number
        : 1
    );


  const success =
    await Database.saveMatch(
      currentMatch
    );


  if (!success) {

    currentMatch =
      oldMatch;


    return;

  }


  updateMatchDisplay();

}


function updateMatchDisplay() {

  $("currentMatch").value =
    currentMatch;


  $("adminLiveMatchDisplay").textContent =
    `LIVE — MATCH ${currentMatch}`;


  $("viewerLiveMatchDisplay").textContent =
    `LIVE — MATCH ${currentMatch}`;

}


/* =========================================================
   LEADERBOARD
   ========================================================= */

async function updateLeaderboard() {

  if (!isAdmin) return;


  recalculateScores();


  players.sort(
    (a, b) => {

      const scoreDifference =
        b.score -
        a.score;


      if (
        scoreDifference !== 0
      ) {

        return scoreDifference;

      }


      return a.name.localeCompare(
        b.name
      );

    }
  );


  const success =
    await Database.savePlayers(
      players
    );


  if (!success) {

    return;

  }


  renderEverything();


  alert(
    "Leaderboard updated."
  );

}


/* =========================================================
   NEW TOURNAMENT
   ========================================================= */

async function newTournament() {

  if (!isAdmin) return;


  if (!players.length) {

    alert(
      "There are no players to archive."
    );


    return;

  }


  const confirmed =
    confirm(
      "Archive this tournament and start a new one?"
    );


  if (!confirmed) return;


  recalculateScores();


  const archivedTournament = {

    tournamentNumber:
      tournament.number,

    date:
      new Date().toISOString(),

    matchCount:
      currentMatch,

    players:
      JSON.parse(
        JSON.stringify(
          players
        )
      )

  };


  const historySaved =
    await Database.saveHistoryItem(
      archivedTournament
    );


  if (!historySaved) {

    return;

  }


  const oldTournamentNumber =
    tournament.number;


  tournament = {

    number:
      tournament.number +
      1,

    status:
      "LIVE"

  };


  currentMatch =
    1;


  players =
    [];


  const tournamentSaved =
    await Database.saveTournament(
      tournament
    );


  if (!tournamentSaved) {

    alert(
      "Tournament archived, but new tournament setup failed."
    );


    return;

  }


  const playersSaved =
    await Database.savePlayers(
      players
    );


  if (!playersSaved) {

    alert(
      "Tournament archived, but player reset failed."
    );


    return;

  }


  const matchSaved =
    await Database.saveMatch(
      currentMatch
    );


  if (!matchSaved) {

    alert(
      "Tournament archived, but match reset failed."
    );


    return;

  }


  history =
    await Database.loadHistory();


  renderEverything();


  alert(
    `Tournament ${oldTournamentNumber} archived.`
  );

}


/* =========================================================
   STATS
   ========================================================= */

function renderStats() {

  $("totalPlayers").textContent =
    players.length;


  const sorted =
    [...players].sort(
      (a, b) =>
        b.score -
        a.score
    );


  if (!sorted.length) {

    $("topScore").textContent =
      "0";


    $("leaderName").textContent =
      "—";


    return;

  }


  $("topScore").textContent =
    sorted[0].score;


  $("leaderName").textContent =
    sorted[0].name;

}


/* =========================================================
   LEADERBOARD RENDER
   ========================================================= */

function achievementCell(
  player,
  type
) {

  const value =
    player.achievements[type];


  if (!isAdmin) {

    return `
      <td>
        ${value}
      </td>
    `;

  }


  return `

    <td>

      <div class="achievement-control">

        <button
          type="button"
          onclick="
            changeAchievement(
              '${player.id}',
              '${type}',
              -1
            )
          "
        >
          −
        </button>


        <strong>
          ${value}
        </strong>


        <button
          type="button"
          onclick="
            changeAchievement(
              '${player.id}',
              '${type}',
              1
            )
          "
        >
          +
        </button>

      </div>

    </td>

  `;

}


function renderLeaderboard() {

  const tbody =
    $("leaderboard");


  const search =
    $("search")
      .value
      .trim()
      .toLowerCase();


  const sorted =
    [...players].sort(
      (a, b) => {

        const scoreDifference =
          b.score -
          a.score;


        if (
          scoreDifference !== 0
        ) {

          return scoreDifference;

        }


        return a.name.localeCompare(
          b.name
        );

      }
    );


  const filtered =
    sorted.filter(
      player =>
        player.name
          .toLowerCase()
          .includes(search)
    );


  $("emptyState").style.display =
    players.length === 0
      ? "block"
      : "none";


  if (!filtered.length) {

    tbody.innerHTML =
      "";


    return;

  }


  tbody.innerHTML =
    filtered
      .map(
        player => {

          const rank =
            sorted.findIndex(
              p =>
                p.id ===
                player.id
            ) + 1;


          return `

            <tr>

              <td>
                #${rank}
              </td>


              <td>
                ${escapeHTML(
                  player.name
                )}
              </td>


              ${achievementCell(
                player,
                "win"
              )}


              ${achievementCell(
                player,
                "mvp"
              )}


              ${achievementCell(
                player,
                "quadra"
              )}


              ${achievementCell(
                player,
                "penta"
              )}


              ${achievementCell(
                player,
                "additionalPoint"
              )}


              <td>
                ${player.score}
              </td>


              <td>

                ${
                  isAdmin

                    ? `

                      <button
                        type="button"
                        onclick="
                          editPlayer(
                            '${player.id}'
                          )
                        "
                      >
                        EDIT
                      </button>


                      <button
                        type="button"
                        onclick="
                          deletePlayer(
                            '${player.id}'
                          )
                        "
                      >
                        DELETE
                      </button>

                    `

                    : `

                      <span>
                        —
                      </span>

                    `
                }

              </td>

            </tr>

          `;

        }
      )
      .join("");

}


/* =========================================================
   TOP 5
   ========================================================= */

function renderTopFive() {

  const container =
    $("topFiveList");


  const top =
    [...players]
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        5
      );


  if (!top.length) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          NO PLAYERS YET
        </h3>

        <p>
          Players will appear here once they are added.
        </p>

      </div>

    `;


    return;

  }


  container.innerHTML =
    top
      .map(
        (player, index) => `

          <div class="top-player-card">

            <div class="top-player-rank">
              #${index + 1}
            </div>


            <div class="top-player-name">
              ${escapeHTML(
                player.name
              )}
            </div>


            <div class="top-player-score">
              ${player.score}
            </div>

          </div>

        `
      )
      .join("");

}


/* =========================================================
   HISTORY
   ========================================================= */

function renderHistory() {

  const container =
    $("historyList");


  if (!history.length) {

    container.innerHTML = `

      <div class="empty-state">

        <h3>
          NO TOURNAMENT HISTORY
        </h3>

        <p>
          Previous tournaments will appear here.
        </p>

      </div>

    `;


    return;

  }


  container.innerHTML =
    history
      .map(
        tournamentData => {

          const sorted =
            [...tournamentData.players]
              .sort(
                (a, b) =>
                  b.score -
                  a.score
              );


          const leader =
            sorted[0];


          return `

            <div class="history-card">

              <div>

                <strong>
                  TOURNAMENT
                  ${tournamentData.tournamentNumber}
                </strong>


                <span>

                  ${formatDate(
                    tournamentData.date
                  )}

                  ·

                  ${tournamentData.matchCount}

                  match${
                    tournamentData.matchCount ===
                    1
                      ? ""
                      : "es"
                  }

                </span>

              </div>


              <div>

                <strong>

                  ${
                    leader
                      ? escapeHTML(
                          leader.name
                        )
                      : "—"
                  }

                </strong>


                <span>

                  ${
                    leader
                      ? leader.score
                      : 0
                  }

                  SOT

                </span>

              </div>

            </div>

          `;

        }
      )
      .join("");

}


/* =========================================================
   RESULT IMAGE
   ========================================================= */

function generateResultImage() {

  if (!isAdmin) return;


  if (!players.length) {

    alert(
      "Add players before generating the result."
    );


    return;

  }


  recalculateScores();


  const sorted =
    [...players].sort(
      (a, b) => {

        if (
          b.score !==
          a.score
        ) {

          return (
            b.score -
            a.score
          );

        }


        return a.name.localeCompare(
          b.name
        );

      }
    );


  const canvas =
    document.createElement(
      "canvas"
    );


  const width =
    1800;


  const headerHeight =
    220;


  const tableHeaderHeight =
    80;


  const rowHeight =
    88;


  const footerHeight =
    70;


  canvas.width =
    width;


  canvas.height =
    headerHeight +
    tableHeaderHeight +
    sorted.length *
      rowHeight +
    footerHeight;


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.fillStyle =
    "#07090d";


  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "#e3263f";


  ctx.fillRect(
    0,
    0,
    width,
    18
  );


  ctx.fillStyle =
    "#ff8a24";


  ctx.fillRect(
    0,
    canvas.height -
      12,
    width,
    12
  );


  ctx.textAlign =
    "left";


  ctx.fillStyle =
    "#f5f7fa";


  ctx.font =
    "900 58px Arial";


  ctx.fillText(
    "SOT SCOREBOARD",
    70,
    85
  );


  ctx.fillStyle =
    "#ff8a24";


  ctx.font =
    "900 25px Arial";


  ctx.fillText(
    "SATURDAY OPEN TOURNAMENT",
    73,
    125
  );


  ctx.fillStyle =
    "#9aa4b2";


  ctx.font =
    "20px Arial";


  ctx.fillText(
    `TOURNAMENT ${tournament.number}  •  MATCH ${currentMatch}`,
    74,
    160
  );


  const columns = {

    rank: 70,

    player: 145,

    win: 620,

    mvp: 750,

    quadra: 875,

    penta: 1000,

    additionalPoint: 1200,

    score: 1635

  };


  const tableY =
    headerHeight;


  ctx.fillStyle =
    "#151b24";


  ctx.fillRect(
    40,
    tableY,
    width - 80,
    tableHeaderHeight
  );


  ctx.fillStyle =
    "#f5f7fa";


  ctx.font =
    "900 19px Arial";


  ctx.textAlign =
    "left";


  ctx.fillText(
    "#",
    columns.rank,
    tableY + 49
  );


  ctx.fillText(
    "PLAYER",
    columns.player,
    tableY + 49
  );


  ctx.textAlign =
    "center";


  ctx.fillText(
    "WIN",
    columns.win,
    tableY + 49
  );


  ctx.fillText(
    "MVP",
    columns.mvp,
    tableY + 49
  );


  ctx.fillText(
    "QD",
    columns.quadra,
    tableY + 49
  );


  ctx.fillText(
    "PT",
    columns.penta,
    tableY + 49
  );


  ctx.fillText(
    "ADDITIONAL",
    columns.additionalPoint,
    tableY + 49
  );


  ctx.fillStyle =
    "#ff8a24";


  ctx.fillText(
    "SCORE",
    columns.score,
    tableY + 49
  );


  sorted.forEach(
    (player, index) => {

      const y =
        tableY +
        tableHeaderHeight +
        index *
          rowHeight;


      ctx.fillStyle =
        index % 2 === 0
          ? "#11161e"
          : "#0d1118";


      ctx.fillRect(
        40,
        y,
        width - 80,
        rowHeight
      );


      ctx.fillStyle =
        "#252c36";


      ctx.fillRect(
        40,
        y +
          rowHeight -
          1,
        width - 80,
        1
      );


      ctx.textAlign =
        "left";


      ctx.font =
        "900 23px Arial";


      ctx.fillStyle =
        index < 3
          ? "#ffb04a"
          : "#f5f7fa";


      ctx.fillText(
        `#${index + 1}`,
        columns.rank,
        y + 55
      );


      ctx.fillStyle =
        "#f5f7fa";


      ctx.font =
        "900 21px Arial";


      let playerName =
        String(
          player.name
        );


      if (
        playerName.length >
        25
      ) {

        playerName =
          playerName.substring(
            0,
            22
          ) + "...";

      }


      ctx.fillText(
        playerName,
        columns.player,
        y + 55
      );


      ctx.textAlign =
        "center";


      ctx.font =
        "900 21px Arial";


      ctx.fillStyle =
        "#dfe4eb";


      const achievements =
        player.achievements ||
        {};


      ctx.fillText(
        achievements.win ||
          0,
        columns.win,
        y + 55
      );


      ctx.fillText(
        achievements.mvp ||
          0,
        columns.mvp,
        y + 55
      );


      ctx.fillText(
        achievements.quadra ||
          0,
        columns.quadra,
        y + 55
      );


      ctx.fillText(
        achievements.penta ||
          0,
        columns.penta,
        y + 55
      );


      ctx.fillText(
        achievements.additionalPoint ||
          0,
        columns.additionalPoint,
        y + 55
      );


      ctx.fillStyle =
        "#ff8a24";


      ctx.font =
        "900 25px Arial";


      ctx.fillText(
        player.score ||
          0,
        columns.score,
        y + 55
      );

    }
  );


  const footerY =
    tableY +
    tableHeaderHeight +
    sorted.length *
      rowHeight;


  ctx.fillStyle =
    "#0b1018";


  ctx.fillRect(
    40,
    footerY,
    width - 80,
    footerHeight
  );


  ctx.textAlign =
    "left";


  ctx.fillStyle =
    "#9aa4b2";


  ctx.font =
    "18px Arial";


  ctx.fillText(
    "SOT • Saturday Open Tournament",
    70,
    footerY + 43
  );


  ctx.textAlign =
    "right";


  ctx.fillText(
    "YEGK NoName",
    width - 70,
    footerY + 43
  );


  $("resultImage").src =
    canvas.toDataURL(
      "image/png"
    );


  $("resultPreview").style.display =
    "block";

}


/* =========================================================
   ADMIN / VIEWER UI
   ========================================================= */

function updatePermissionUI() {

  const addPlayerPanel =
    $("addPlayerPanel");


  const addPlayerShortcut =
    $("addPlayerShortcutBtn");


  if (
    addPlayerPanel
  ) {

    addPlayerPanel.style.display =
      isAdmin
        ? "block"
        : "none";

  }


  if (
    addPlayerShortcut
  ) {

    addPlayerShortcut.style.display =
      isAdmin
        ? "inline-block"
        : "none";

  }


  $("adminControls").style.display =
    isAdmin
      ? "grid"
      : "none";


  $("currentMatch").disabled =
    !isAdmin;


  [
    "winPoints",
    "mvpPoints",
    "quadraPoints",
    "pentaPoints",
    "additionalPointPoints"
  ].forEach(
    id => {

      $(id).disabled =
        !isAdmin;

    }
  );


  [
    "applyScoring",
    "updateLeaderboardBtn",
    "newTournamentBtn",
    "generateResultBtn"
  ].forEach(
    id => {

      $(id).disabled =
        !isAdmin;

    }
  );

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

  recalculateScores();


  renderStats();


  renderLeaderboard();


  renderTopFive();


  renderHistory();


  updateMatchDisplay();


  updatePermissionUI();

}


/* =========================================================
   SECURITY / HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(
  dateString
) {

  return new Date(
    dateString
  ).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );

}


/* =========================================================
   DEBUG
   ========================================================= */

window.SOT = {

  getPlayers:
    () =>
      players,

  getScoring:
    () =>
      scoring,

  getHistory:
    () =>
      history,

  getMatch:
    () =>
      currentMatch,

  getDatabase:
    () =>
      supabaseClient,

  resetAll() {

    alert(
      "Database reset is disabled from this prototype."
    );

  }

};
