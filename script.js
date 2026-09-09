/* =========================================================
   CRYSTAL BOUTIK
   GESTIONNAIRE DE JEUX-CONCOURS
   VERSION 2
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       ETAT GLOBAL
    ====================================================== */

    const state = {
    currentGame: null,
    participants: [],
    eligibleParticipants: [],
    missionParticipants: [],
    winners: [],
    giftResults: [],
    keywords: [],
    history: []
};

    /* =====================================================
       OUTILS
    ====================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function showSection(id) {

        document.querySelectorAll(".page-section").forEach(section => {
            section.classList.remove("active");
        });

        const section = $(id);

        if (section) {
            section.classList.add("active");
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    function showToast(message) {

        const toast = $("toast");

        if (!toast) {
            return;
        }

        toast.textContent = message;

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function normalizeName(name) {

        return String(name || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    }


    function randomIndex(max) {

        if (!max || max <= 0) {
            return -1;
        }

        return Math.floor(Math.random() * max);

    }


    function shuffle(array) {

        const copy = [...array];

        for (let i = copy.length - 1; i > 0; i--) {

            const j = randomIndex(i + 1);

            [copy[i], copy[j]] = [copy[j], copy[i]];

        }

        return copy;

    }


    /* =====================================================
       PARTICIPANT DEJA GAGNANT
    ====================================================== */

    function participantADejaGagne(participant) {

    if (!participant) {
        return false;
    }


    return state.winners.some(
        winner => {

            if (!winner) {
                return false;
            }


            /*
             * Comparaison par ID.
             */

            const memeID =
                participant.id &&
                winner.id &&
                participant.id === winner.id;


            /*
             * Comparaison par nom.
             */

            const memeNom =
                normalizeName(
                    participant.name
                )
                ===
                normalizeName(
                    winner.name
                );


            /*
             * Une personne est considérée
             * comme déjà gagnante si :
             *
             * - son ID est identique
             * OU
             * - son nom est identique.
             */

            return memeID || memeNom;

        }
    );

}

    /* =====================================================
       PARTICIPANTS DISPONIBLES POUR LE TIRAGE
    ====================================================== */

    function obtenirParticipantsDisponibles(participants) {

        const liste = [...participants];

        if (
            !state.currentGame ||
            !state.currentGame.unSeulGain
        ) {

            return liste;

        }

        return liste.filter(
            participant =>
                !participantADejaGagne(participant)
        );

    }


    /* =====================================================
       STOCKAGE LOCAL
    ====================================================== */

    function saveState() {

    try {

        localStorage.setItem(
            "crystalBoutikHistory",
            JSON.stringify(
                state.history
            )
        );

    } catch (error) {

        console.error(
            "Erreur lors de la sauvegarde de l'historique :",
            error
        );

    }

}

    function loadHistory() {

    try {

        const data = localStorage.getItem(
            "crystalBoutikHistory"
        );

        if (data) {

            state.history =
                JSON.parse(data);

        }

    } catch (error) {

        console.error(
            "Erreur lors du chargement de l'historique :",
            error
        );

        state.history = [];

    }

    renderHistory();

}

    /* =====================================================
       TYPES DE JEUX
    ====================================================== */

    function getGameType() {

        const checked = document.querySelector(
            'input[name="typeJeu"]:checked'
        );

        return checked ? checked.value : "simple";

    }


    function updateGameOptions() {

        const type = getGameType();

        const container = $("contenuOptionsJeu");

        let html = "";


        /* -----------------------------------------------
           TIRAGE SIMPLE
        ------------------------------------------------ */

        if (type === "simple") {

            html = `

                <p class="help-text">
                    Tous les participants éligibles seront placés
                    dans un même tirage.
                </p>

            `;

        }


        /* -----------------------------------------------
           CADEAUX
        ------------------------------------------------ */

        else if (type === "cadeaux") {

            html = `

                <div class="form-group">

                    <label>
                        Comment le participant choisit-il son cadeau ?
                    </label>

                    <select id="modeChoixCadeau">

                        <option value="commentaire">
                            Dans son commentaire
                        </option>

                        <option value="colonne">
                            Dans une colonne du CSV
                        </option>

                    </select>

                </div>

                <p class="help-text">
                    Exemple : A, B ou C.
                    Le choix sera détecté dans les données importées.
                </p>

            `;

        }


        /* -----------------------------------------------
           QUESTION
        ------------------------------------------------ */

        else if (type === "question") {

            html = `

                <div class="form-group">

                    <label for="questionJeu">
                        Question
                    </label>

                    <textarea
                        id="questionJeu"
                        rows="3"
                        placeholder="Ex : Quel est le nom de notre page ?"
                    ></textarea>

                </div>


                <div class="form-group">

                    <label for="bonneReponse">
                        Bonne réponse
                    </label>

                    <input
                        type="text"
                        id="bonneReponse"
                        placeholder="Ex : Crystal Boutik"
                    >

                </div>


                <label class="checkbox-label">

                    <input
                        type="checkbox"
                        id="ignorerMajuscules"
                        checked
                    >

                    <span>
                        Ne pas tenir compte des majuscules/minuscules
                    </span>

                </label>

            `;

        }


        /* -----------------------------------------------
           NOMBRE
        ------------------------------------------------ */

        else if (type === "nombre") {

            html = `

                <div class="form-grid">

                    <div class="form-group">

                        <label for="nombreMinimum">
                            Nombre minimum
                        </label>

                        <input
                            type="number"
                            id="nombreMinimum"
                            value="1"
                        >

                    </div>


                    <div class="form-group">

                        <label for="nombreMaximum">
                            Nombre maximum
                        </label>

                        <input
                            type="number"
                            id="nombreMaximum"
                            value="100"
                        >

                    </div>

                </div>


                <div class="form-group">

                    <label for="nombreCible">
                        Nombre gagnant
                    </label>

                    <input
                        type="number"
                        id="nombreCible"
                        placeholder="Ex : 57"
                    >

                </div>


                <p class="help-text">
                    Le tirage pourra retenir les participants
                    ayant donné le nombre gagnant.
                </p>

            `;

        }


        /* -----------------------------------------------
           MISSION
        ------------------------------------------------ */

        else if (type === "mission") {

            html = `

                <div class="form-group">

                    <label for="missionPrincipale">
                        Mission à réaliser
                    </label>

                    <textarea
                        id="missionPrincipale"
                        rows="3"
                        placeholder="Ex : inviter 5 amis à suivre la page"
                    ></textarea>

                </div>


                <div class="form-group">

                    <label for="preuvePrincipale">
                        Preuve demandée
                    </label>

                    <input
                        type="text"
                        id="preuvePrincipale"
                        placeholder="Ex : capture d'écran"
                    >

                </div>

            `;

        }


        /* -----------------------------------------------
           PERSONNALISE
        ------------------------------------------------ */

        else if (type === "personnalise") {

            html = `

                <div class="form-group">

                    <label for="reglePersonnalisee">
                        Règle du jeu
                    </label>

                    <textarea
                        id="reglePersonnalisee"
                        rows="5"
                        placeholder="Décris ici la règle particulière du jeu..."
                    ></textarea>

                </div>


                <div class="form-group">

                    <label for="methodePersonnalisee">
                        Méthode de sélection
                    </label>

                    <select id="methodePersonnalisee">

                        <option value="aleatoire">
                            Tirage aléatoire
                        </option>

                        <option value="manuel">
                            Validation manuelle puis tirage
                        </option>

                    </select>

                </div>

            `;

        }


        container.innerHTML = html;

    }


    /* =====================================================
       LOTS
    ====================================================== */

    function ajouterLot(nom = "", quantite = 1) {

        const container = $("listeLots");

        const index = container.children.length + 1;


        const div = document.createElement("div");

        div.className = "lot-item";


        div.innerHTML = `

            <div class="lot-header">

                <span class="lot-number">
                    🎁 Lot ${index}
                </span>

                <button
                    type="button"
                    class="btn btn-danger btn-supprimer-lot"
                >
                    Supprimer
                </button>

            </div>


            <div class="lot-grid">

                <div class="form-group">

                    <label>
                        Nom du lot
                    </label>

                    <input
                        type="text"
                        class="lot-nom"
                        value="${escapeHTML(nom)}"
                        placeholder="Ex : Bracelet Attack on Titan"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Quantité
                    </label>

                    <input
                        type="number"
                        class="lot-quantite"
                        min="1"
                        value="${quantite}"
                    >

                </div>

            </div>

        `;


        container.appendChild(div);


        div.querySelector(
            ".btn-supprimer-lot"
        ).addEventListener("click", function () {

            div.remove();

            renumeroterLots();

        });

    }


    function renumeroterLots() {

        document.querySelectorAll(".lot-item").forEach(
            (item, index) => {

                const number =
                    item.querySelector(".lot-number");

                number.textContent =
                    `🎁 Lot ${index + 1}`;

            }
        );

    }


    function getLots() {

        const lots = [];


        document.querySelectorAll(".lot-item").forEach(item => {

            const nom =
                item.querySelector(".lot-nom").value.trim();


            const quantite =
                Number(
                    item.querySelector(".lot-quantite").value
                );


            if (nom) {

                lots.push({

                    nom,

                    quantite:
                        Math.max(
                            1,
                            quantite || 1
                        )

                });

            }

        });


        return lots;

    }

   /* =====================================================
   AFFICHER LES MOTS-CLES
===================================================== */

function afficherMotsCles() {

    const container =
        $("listeMotsCles");

    if (!container) {
        return;
    }

    if (
        !state.keywords ||
        state.keywords.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                Aucun mot-clé ajouté.
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    state.keywords.forEach(
        (motCle, index) => {

            const div =
                document.createElement("div");

            div.className =
                "keyword-item";

            div.innerHTML = `

                <span>
                    🔑 ${escapeHTML(motCle)}
                </span>

                <button
                    type="button"
                    class="btn btn-danger btn-supprimer-mot-cle"
                >
                    Supprimer
                </button>

            `;

            container.appendChild(div);

            div.querySelector(
                ".btn-supprimer-mot-cle"
            ).addEventListener(
                "click",
                () => {

                    state.keywords.splice(
                        index,
                        1
                    );

                    afficherMotsCles();

                }
            );

        }
    );
}
   
/* =====================================================
   GENERER LES CHOIX DES CADEAUX
===================================================== */

function obtenirChoixCadeaux() {

    if (
        !state.currentGame ||
        !Array.isArray(state.currentGame.lots)
    ) {
        return [];
    }

    return state.currentGame.lots.map(
        (_, index) =>
            String.fromCharCode(65 + index)
    );
}

    /* =====================================================
       CONDITIONS
    ====================================================== */

    function ajouterCondition(value = "") {

        const container =
            $("listeConditions");


        const div =
            document.createElement("div");


        div.className =
            "condition-item";


        div.innerHTML = `

            <input
                type="text"
                class="condition-input"
                value="${escapeHTML(value)}"
                placeholder="Ex : Suivre la page"
            >

            <button
                type="button"
                class="btn btn-danger btn-supprimer-condition"
            >
                ✕
            </button>

        `;


        container.appendChild(div);


        div.querySelector(
            ".btn-supprimer-condition"
        ).addEventListener("click", function () {

            div.remove();

        });

    }


    function getConditions() {

        return [
            ...document.querySelectorAll(".condition-input")
        ]
            .map(input => input.value.trim())
            .filter(Boolean);

    }


    /* =====================================================
       CREATION DU JEU
    ====================================================== */

    function creerJeu() {

        const nom =
            $("nomJeu").value.trim();


        if (!nom) {

            showToast(
                "⚠️ Donne un nom au jeu."
            );

            $("nomJeu").focus();

            return;

        }


        const type =
            getGameType();


        const nombreGagnants =
            Math.max(
                1,
                Number(
                    $("nombreGagnants").value
                ) || 1
            );


        const lots =
            getLots();


        const conditions =
            getConditions();


        const missionActive =
            $("activerMission").checked;


        state.currentGame = {

            id: Date.now(),

            nom,

            description:
                $("descriptionJeu").value.trim(),

            type,

            nombreGagnants,

            unSeulGain:
    $("unSeulGain").checked,

keywords:
    [...state.keywords],

lots,

            conditions,

            mission:
                missionActive
                    ? {

                        active: true,

                        condition:
                            $("conditionMission")
                                .value.trim(),

                        recompense:
                            $("recompenseMission")
                                .value.trim(),

                        preuve:
                            $("preuveMission").checked

                    }
                    : {

                        active: false

                    },

            options:
                lireOptionsJeu(type),

            createdAt:
                new Date().toISOString()

        };


        state.participants = [];

        state.eligibleParticipants = [];

        state.missionParticipants = [];

        state.winners = [];

        state.giftResults = [];

        afficherJeuActif();

        showSection("jeuActif");


        showToast(
            "✅ Jeu créé avec succès."
        );

    }


    /* =====================================================
       LECTURE DES OPTIONS
    ====================================================== */

    function lireOptionsJeu(type) {

        const options = {};


        if (type === "cadeaux") {

            const mode =
                $("modeChoixCadeau");


            options.modeChoix =
                mode
                    ? mode.value
                    : "commentaire";

        }


        if (type === "question") {

            options.question =
                $("questionJeu")
                    ? $("questionJeu").value.trim()
                    : "";


            options.bonneReponse =
                $("bonneReponse")
                    ? $("bonneReponse").value.trim()
                    : "";


            options.ignorerMajuscules =
                $("ignorerMajuscules")
                    ? $("ignorerMajuscules").checked
                    : true;

        }


        if (type === "nombre") {

            options.minimum =
                Number(
                    $("nombreMinimum")
                        ? $("nombreMinimum").value
                        : 1
                );


            options.maximum =
                Number(
                    $("nombreMaximum")
                        ? $("nombreMaximum").value
                        : 100
                );


            options.cible =
                Number(
                    $("nombreCible")
                        ? $("nombreCible").value
                        : NaN
                );

        }


        if (type === "mission") {

            options.mission =
                $("missionPrincipale")
                    ? $("missionPrincipale")
                        .value.trim()
                    : "";


            options.preuve =
                $("preuvePrincipale")
                    ? $("preuvePrincipale")
                        .value.trim()
                    : "";

        }


        if (type === "personnalise") {

            options.regle =
                $("reglePersonnalisee")
                    ? $("reglePersonnalisee")
                        .value.trim()
                    : "";


            options.methode =
                $("methodePersonnalisee")
                    ? $("methodePersonnalisee").value
                    : "aleatoire";

        }


        return options;

    }


    /* =====================================================
       AFFICHAGE JEU ACTIF
    ====================================================== */

    function afficherJeuActif() {

        if (!state.currentGame) {
            return;
        }

      state.keywords =
    Array.isArray(
        state.currentGame.keywords
    )
        ? [...state.currentGame.keywords]
        : [];
       
        $("titreJeuActif").textContent =
            `🎮 ${state.currentGame.nom}`;


        $("descriptionJeuActif").textContent =
            state.currentGame.description ||
            "Jeu-concours Crystal Boutik";


        const mission =
            state.currentGame.mission;


        if (
            mission &&
            mission.active
        ) {

            $("zoneMissionJeu")
                .classList.remove("hidden");


            $("missionDescription").textContent =
                mission.condition ||
                "Mission spéciale";


            $("missionRecompense").textContent =
                mission.recompense ||
                "Récompense";

        } else {

            $("zoneMissionJeu")
                .classList.add("hidden");

        }


        if (
            state.currentGame.type === "cadeaux"
        ) {

            $("zoneChoixCadeaux")
                .classList.remove("hidden");


            renderChoixCadeaux();

        } else {

            $("zoneChoixCadeaux")
                .classList.add("hidden");

        }


        updateStats();

        renderParticipants();

    }


    /* =====================================================
       CSV
    ====================================================== */

    function parseCSV(text) {

        const rows = [];

        let row = [];

        let cell = "";

        let inQuotes = false;


        for (
            let i = 0;
            i < text.length;
            i++
        ) {

            const char =
                text[i];


            const next =
                text[i + 1];


            if (
                char === '"' &&
                inQuotes &&
                next === '"'
            ) {

                cell += '"';

                i++;

                continue;

            }


            if (char === '"') {

                inQuotes =
                    !inQuotes;

                continue;

            }


            if (
                char === "," &&
                !inQuotes
            ) {

                row.push(
                    cell.trim()
                );

                cell = "";

                continue;

            }


            if (
                char === ";" &&
                !inQuotes
            ) {

                row.push(
                    cell.trim()
                );

                cell = "";

                continue;

            }


            if (
                (
                    char === "\n" ||
                    char === "\r"
                ) &&
                !inQuotes
            ) {

                if (
                    char === "\r" &&
                    next === "\n"
                ) {

                    i++;

                }


                row.push(
                    cell.trim()
                );

                cell = "";


                if (
                    row.some(
                        value => value !== ""
                    )
                ) {

                    rows.push(row);

                }


                row = [];

                continue;

            }


            cell += char;

        }


        if (
            cell !== "" ||
            row.length > 0
        ) {

            row.push(
                cell.trim()
            );


            if (
                row.some(
                    value => value !== ""
                )
            ) {

                rows.push(row);

            }

        }


        return rows;

    }


    function findColumn(headers, names) {

        for (const name of names) {

            const index =
                headers.findIndex(
                    header =>
                        header
                            .toLowerCase()
                            .trim() === name
                );


            if (index !== -1) {

                return index;

            }

        }


        return -1;

    }


    function parseParticipantsCSV(text) {

        const rows =
            parseCSV(text);


        if (!rows.length) {
            return [];
        }


        const headers =
            rows[0].map(
                value =>
                    value
                        .toLowerCase()
                        .trim()
            );


        const nameIndex =
            findColumn(
                headers,
                [
                    "nom",
                    "name",
                    "participant",
                    "pseudo",
                    "prenom",
                    "facebook",
                    "utilisateur",
                    "username"
                ]
            );


        const commentIndex =
            findColumn(
                headers,
                [
                    "commentaire",
                    "comment",
                    "message",
                    "texte",
                    "text"
                ]
            );


        const choiceIndex =
            findColumn(
                headers,
                [
                    "choix",
                    "choice",
                    "cadeau",
                    "gift"
                ]
            );


        const answerIndex =
            findColumn(
                headers,
                [
                    "reponse",
                    "réponse",
                    "answer"
                ]
            );


        const numberIndex =
            findColumn(
                headers,
                [
                    "nombre",
                    "number",
                    "numero",
                    "numéro"
                ]
            );


        const start =
            (
                nameIndex !== -1 ||
                commentIndex !== -1 ||
                choiceIndex !== -1
            )
                ? 1
                : 0;


        const participants = [];


        for (
            let i = start;
            i < rows.length;
            i++
        ) {

            const row =
                rows[i];


            const name =
                (
                    nameIndex !== -1
                        ? row[nameIndex]
                        : row[0]
                ) || "";


            const comment =
                (
                    commentIndex !== -1
                        ? row[commentIndex]
                        : row[1]
                ) || "";


            const choice =
                (
                    choiceIndex !== -1
                        ? row[choiceIndex]
                        : ""
                ) || "";


            const answer =
                (
                    answerIndex !== -1
                        ? row[answerIndex]
                        : ""
                ) || "";


            const number =
                (
                    numberIndex !== -1
                        ? row[numberIndex]
                        : ""
                ) || "";


            if (!name.trim()) {
                continue;
            }


            participants.push({

                id:
                    `p-${Date.now()}-${i}-${Math.random()
                        .toString(36)
                        .slice(2, 8)}`,

                name:
                    name.trim(),

                comment:
                    comment.trim(),

                choice:
                    choice.trim(),

                answer:
                    answer.trim(),

                number:
                    number.trim(),

                eligible:
                    true,

                reason:
                    ""

            });

        }


        return participants;

    }


    /* =====================================================
       IMPORT PARTICIPANTS
    ====================================================== */

    async function handleParticipantsFile(file) {

        if (!file) {
            return;
        }


        try {

            const text =
                await file.text();


            const participants =
                parseParticipantsCSV(text);


            state.participants =
                participants;


            state.eligibleParticipants =
                [];


            state.winners =
                [];

            state.giftResults =
    [];

            $("etatImport").textContent =
                `📥 ${participants.length} participant(s) importé(s).`;


            updateStats();

            renderParticipants();


            $("resultatValidation").innerHTML =
                "";


            showToast(
                `✅ ${participants.length} participant(s) chargé(s).`
            );

        } catch (error) {

            console.error(error);


            $("etatImport").textContent =
                "❌ Impossible de lire le fichier.";


            showToast(
                "❌ Erreur lors de la lecture du CSV."
            );

        }

    }

  /* =====================================================
   IMPORT COMMENTAIRES FACEBOOK
===================================================== */

function importerCommentairesFacebook() {

    const textarea =
        $("commentairesFacebook");

    const commentaires =
        textarea.value.trim();

    if (!commentaires) {

        showToast(
            "⚠️ Aucun commentaire à importer."
        );

        return;
    }

    const lignes =
        commentaires
            .split(/\r?\n/)
            .map(
                ligne => ligne.trim()
            )
            .filter(Boolean);

    const participants = [];

    lignes.forEach(
        (ligne, index) => {

            let nom = "";
            let commentaire = "";

            /*
             * Format :
             * Nom : commentaire
             * Nom - commentaire
             * Nom | commentaire
             */

            const separation =
                ligne.match(
                    /^(.+?)\s*(?::|-|\|)\s*(.+)$/
                );

            if (separation) {

                nom =
                    separation[1].trim();

                commentaire =
                    separation[2].trim();

            } else {

                nom =
                    `Participant ${index + 1}`;

                commentaire =
                    ligne;
            }

            if (!nom || !commentaire) {
                return;
            }

            participants.push({

                id:
                    `fb-${Date.now()}-${index}-${Math.random()
                        .toString(36)
                        .slice(2, 8)}`,

                name:
                    nom,

                comment:
                    commentaire,

                choice:
                    "",

                answer:
                    "",

                number:
                    "",

                eligible:
                    true,

                reason:
                    ""

            });

        }
    );

    state.participants =
        participants;

    state.eligibleParticipants =
        [];

    state.winners =
        [];

    state.giftResults =
        [];

    $("etatImportCommentaires").textContent =
        `💬 ${participants.length} commentaire(s) importé(s).`;

    $("etatImport").textContent =
        `📥 ${participants.length} participant(s) importé(s) depuis Facebook.`;

    updateStats();

    renderParticipants();

    $("resultatValidation").innerHTML =
        "";

    showToast(
        `✅ ${participants.length} participant(s) importé(s).`
    );

}
   
    /* =====================================================
       DEMO
    ====================================================== */

    function loadDemoParticipants() {

        if (!state.currentGame) {

            showToast(
                "⚠️ Crée d'abord un jeu."
            );

            return;

        }


        const type =
            state.currentGame.type;


        if (type === "cadeaux") {

            state.participants = [

                {
                    id: "demo-1",
                    name: "Alice",
                    comment: "Je participe A",
                    choice: "A",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-2",
                    name: "Bruno",
                    comment: "Je choisis B",
                    choice: "B",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-3",
                    name: "Caroline",
                    comment: "Mon choix C",
                    choice: "C",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-4",
                    name: "David",
                    comment: "Je prends A",
                    choice: "A",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-5",
                    name: "Emma",
                    comment: "Choix B",
                    choice: "B",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                }

            ];

        } else if (
            type === "question"
        ) {

            const bonne =
                state.currentGame.options.bonneReponse ||
                "Crystal Boutik";


            state.participants = [

                {
                    id: "demo-1",
                    name: "Alice",
                    comment: bonne,
                    choice: "",
                    answer: bonne,
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-2",
                    name: "Bruno",
                    comment: "Mauvaise réponse",
                    choice: "",
                    answer: "Mauvaise réponse",
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-3",
                    name: "Caroline",
                    comment: bonne,
                    choice: "",
                    answer: bonne,
                    number: "",
                    eligible: true,
                    reason: ""
                }

            ];

        } else if (
            type === "nombre"
        ) {

            const cible =
                state.currentGame.options.cible;


            state.participants = [

                {
                    id: "demo-1",
                    name: "Alice",
                    comment: String(cible),
                    choice: "",
                    answer: "",
                    number: String(cible),
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-2",
                    name: "Bruno",
                    comment: "25",
                    choice: "",
                    answer: "",
                    number: "25",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-3",
                    name: "Caroline",
                    comment: String(cible),
                    choice: "",
                    answer: "",
                    number: String(cible),
                    eligible: true,
                    reason: ""
                }

            ];

        } else {

            state.participants = [

                {
                    id: "demo-1",
                    name: "Alice",
                    comment: "Je participe",
                    choice: "",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-2",
                    name: "Bruno",
                    comment: "Je participe",
                    choice: "",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-3",
                    name: "Caroline",
                    comment: "Je participe",
                    choice: "",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                },

                {
                    id: "demo-4",
                    name: "David",
                    comment: "Je participe",
                    choice: "",
                    answer: "",
                    number: "",
                    eligible: true,
                    reason: ""
                }

            ];

        }


        state.eligibleParticipants =
            [];

        state.winners =
            [];

 
        state.giftResults =
    [];

        $("etatImport").textContent =
            `🧪 ${state.participants.length} participants de démonstration chargés.`;


        updateStats();

        renderParticipants();


        showToast(
            "🧪 Démonstration chargée."
        );

    }


    /* =====================================================
       VALIDATION
    ====================================================== */

    function validateParticipants() {

        if (!state.participants.length) {

            showToast(
                "⚠️ Aucun participant."
            );

            return;

        }


        let list =
            [...state.participants];


        /* -----------------------------------------------
           DOUBLONS
        ------------------------------------------------ */

        if (
            $("supprimerDoublons").checked
        ) {

            const seen =
                new Set();


            list =
                list.filter(
                    participant => {

                        const key =
                            normalizeName(
                                participant.name
                            );


                        if (
                            seen.has(key)
                        ) {

                            return false;

                        }


                        seen.add(key);

                        return true;

                    }
                );

        }


        /* -----------------------------------------------
           RESET
        ------------------------------------------------ */

        list.forEach(
            participant => {

                participant.eligible =
                    true;

                participant.reason =
                    "";

            }
        );


        const type =
            state.currentGame.type;


        /* -----------------------------------------------
           CHOIX CADEAUX
        ------------------------------------------------ */

        if (
            type === "cadeaux" &&
            $("exigerChoix").checked
        ) {

            list.forEach(
                participant => {

                    const choice =
                        detectChoice(
                            participant
                        );


                    participant.choice =
                        choice;


                   const choixDisponibles =
    obtenirChoixCadeaux();


if (
    !choixDisponibles.includes(choice)
) {

    participant.eligible =
        false;

    participant.reason =
        `Choix ${choixDisponibles.join("/")} non trouvé.`;

}

                }
            );

        }


        /* -----------------------------------------------
           QUESTION
        ------------------------------------------------ */

        if (
            type === "question"
        ) {

            const bonne =
                state.currentGame
                    .options
                    .bonneReponse;


            list.forEach(
                participant => {

                    const answer =
                        participant.answer ||
                        extractAnswer(
                            participant
                        );


                    participant.answer =
                        answer;


                    if (
                        !answersEqual(
                            answer,
                            bonne,
                            state.currentGame
                                .options
                                .ignorerMajuscules
                        )
                    ) {

                        participant.eligible =
                            false;

                        participant.reason =
                            "Mauvaise réponse.";

                    }

                }
            );

        }


        /* -----------------------------------------------
           NOMBRE
        ------------------------------------------------ */

        if (
            type === "nombre"
        ) {

            const cible =
                state.currentGame
                    .options
                    .cible;


            list.forEach(
                participant => {

                    const number =
                        Number(
                            participant.number ||
                            extractNumber(
                                participant
                            )
                        );


                    participant.number =
                        number;


                    if (
                        !Number.isFinite(number) ||
                        number !== cible
                    ) {

                        participant.eligible =
                            false;

                        participant.reason =
                            "Nombre incorrect.";

                    }

                }
            );

        }


        state.eligibleParticipants =
            list.filter(
                participant =>
                    participant.eligible
            );


        /*
         * Important :
         * Lors d'une nouvelle validation,
         * les anciens gagnants sont conservés.
         * Le système pourra donc toujours empêcher
         * un ancien gagnant de regagner.
         */


        renderParticipants();

        updateStats();

        renderChoixCadeaux();


        $("resultatValidation").innerHTML = `

            <div class="status-box">

                ✅ Validation terminée.

                <strong>
                    ${state.eligibleParticipants.length}
                </strong>

                participant(s) éligible(s).

            </div>

        `;


        showToast(
            `✅ ${state.eligibleParticipants.length} participant(s) éligible(s).`
        );

    }

   /* =====================================================
   DETECTION MOTS-CLES
===================================================== */

function detectMotsCles(participant) {

    if (
        !state.keywords ||
        !state.keywords.length
    ) {
        return [];
    }

    const texte =
        `${participant.comment || ""} ${participant.name || ""}`
            .toLowerCase();

    return state.keywords.filter(
        motCle => {

            const mot =
                String(motCle || "")
                    .trim()
                    .toLowerCase();

            if (!mot) {
                return false;
            }

            return texte.includes(mot);

        }
    );

}

    /* =====================================================
       DETECTION CHOIX
    ====================================================== */

    function detectChoice(participant) {

        const direct =
            String(
                participant.choice || ""
            )
                .trim()
                .toUpperCase();

        const choixDisponibles =
    obtenirChoixCadeaux();


if (
    choixDisponibles.includes(direct)
) {

    return direct;

}

        const text =
            `${participant.comment} ${participant.name}`
                .toUpperCase();

        const choixPattern =
    choixDisponibles
        .map(
            choix =>
                choix.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )
        )
        .join("|");


const match =
    text.match(
        new RegExp(
            `(?:CHOIX|CADEAU|OPTION|GIFT)?\\s*[:\\-]?\\s*\\b(${choixPattern})\\b`
        )
    );


        if (match) {

            return match[1];

        }


        return "";

    }


    /* =====================================================
       REPONSE
    ====================================================== */

    function extractAnswer(participant) {

        return (
            participant.answer ||
            participant.comment ||
            ""
        ).trim();

    }


    function answersEqual(
        a,
        b,
        ignoreCase
    ) {

        let first =
            String(a || "").trim();


        let second =
            String(b || "").trim();


        if (ignoreCase) {

            first =
                first.toLowerCase();


            second =
                second.toLowerCase();

        }


        return first === second;

    }


    /* =====================================================
       NOMBRE
    ====================================================== */

    function extractNumber(participant) {

        const text =
            participant.number ||
            participant.comment ||
            "";


        const match =
            String(text)
                .match(/\b\d+\b/);


        return match
            ? Number(match[0])
            : NaN;

    }


    /* =====================================================
       AFFICHAGE PARTICIPANTS
    ====================================================== */

    function renderParticipants() {

        const container =
            $("listeParticipants");


        const list =
            state.eligibleParticipants.length
                ? state.eligibleParticipants
                : state.participants;


        $("badgeParticipants").textContent =
            list.length;


        if (!list.length) {

            container.innerHTML = `

                <div class="empty-state">
                    Aucun participant.
                </div>

            `;

            return;

        }


        container.innerHTML =
            list.map(
                participant => {

                    const choice =
                        participant.choice
                            ? `🎁 ${escapeHTML(
                                participant.choice
                            )}`
                            : "";


                    const info =
                        participant.comment
                            ? escapeHTML(
                                participant.comment
                                    .slice(0, 120)
                            )
                            : "Aucun commentaire";


                    return `

                        <div class="participant">

                            <div>

                                <div class="participant-name">

                                    ${escapeHTML(
                                        participant.name
                                    )}

                                </div>

                                <div class="participant-info">

                                    ${info}

                                </div>

                            </div>

                            <div class="participant-choice">

                                ${choice}

                            </div>

                        </div>

                    `;

                }
            ).join("");

    }

   /* =====================================================
   STATS
====================================================== */

function updateStats() {

    $("statTotal").textContent =
        state.participants.length;


    $("statEligibles").textContent =
        state.eligibleParticipants.length;


    /*
     * Nombre de personnes différentes ayant gagné.
     *
     * Pour les jeux avec cadeaux, une personne peut
     * gagner plusieurs cadeaux lorsque "unSeulGain"
     * est désactivé.
     */

    if (
        state.currentGame &&
        state.currentGame.type === "cadeaux"
    ) {

        const nomsGagnants =
            state.winners
                .filter(
                    winner =>
                        winner &&
                        winner.name
                )
                .map(
                    winner =>
                        normalizeName(
                            winner.name
                        )
                );


        const gagnantsUniques =
            new Set(
                nomsGagnants
            );


        $("statGagnants").textContent =
            gagnantsUniques.size;


    } else {

        $("statGagnants").textContent =
            state.winners.length;

    }

}

          /* =====================================================
   LANCER LE TIRAGE
===================================================== */

function lancerTirage() {

    if (
        !state.currentGame
    ) {

        showToast(
            "⚠️ Aucun jeu n'est configuré."
        );

        return;
    }


    /*
     * Vérifier qu'il existe des participants
     * éligibles.
     */

    if (
        !state.eligibleParticipants.length
    ) {

        showToast(
            "⚠️ Aucun participant éligible."
        );

        return;
    }


    /*
     * JEU AVEC CADEAUX
     */

    if (
        state.currentGame.type === "cadeaux"
    ) {

        /*
         * Vérifier s'il reste au moins
         * un cadeau disponible.
         */

        const choix =
    obtenirChoixCadeaux();

        const cadeauDisponible =
            choix.some(
                choice =>
                    obtenirQuantiteRestante(
                        choice
                    ) > 0
            );

        /*
         * Si tous les cadeaux sont épuisés,
         * ne pas relancer le tirage.
         */

        if (!cadeauDisponible) {

            showToast(
                "⚠️ Tous les cadeaux ont déjà été attribués."
            );

            renderChoixCadeaux();

            return;
        }


        /*
         * Lancer le tirage des cadeaux.
         */

        tirageParCadeau();

        return;
    }


    /*
     * AUTRES TYPES DE JEUX
     */

    const disponibles =
        obtenirParticipantsDisponibles(
            state.eligibleParticipants
        );


    if (!disponibles.length) {

        showToast(
            "⚠️ Tous les participants disponibles ont déjà gagné."
        );

        return;
    }


    /*
     * Tirage classique.
     */

    const gagnants = [];


    const nombreGagnants =
        Math.min(
            state.currentGame.nombreGagnants,
            disponibles.length
        );


    const participantsDisponibles =
        [...disponibles];


    while (
        gagnants.length <
        nombreGagnants
    ) {

        const index =
            randomIndex(
                participantsDisponibles.length
            );


        const winner =
            participantsDisponibles.splice(
                index,
                1
            )[0];


        gagnants.push(
            winner
        );

    }


    /*
     * Ajouter les gagnants.
     */

    state.winners.push(
        ...gagnants
    );


    afficherResultatTirage();


    enregistrerHistorique();

    updateStats();


    showToast(
        "🏆 Tirage terminé."
    );

}
     
         /* =====================================================
        GESTION DES QUANTITES DE CADEAUX
        ====================================================== */

    function obtenirResultatsCadeau(choice) {

        return state.giftResults.filter(
            result =>
                String(result.choice)
                    .toUpperCase() === choice
        );

    }


    function obtenirQuantiteLot(choice) {

        const choix = obtenirChoixCadeaux();

const lotIndex =
    choix.indexOf(
        String(choice).toUpperCase()
    );

const lot =
    state.currentGame &&
    state.currentGame.lots
        ? state.currentGame.lots[lotIndex]
        : null;

        if (!lot) {
            return 1;
        }

        return Math.max(
            1,
            Number(lot.quantite) || 1
        );

    }


    function obtenirQuantiteRestante(choice) {

        const quantite =
            obtenirQuantiteLot(choice);

        const dejaAttribues =
            obtenirResultatsCadeau(choice)
                .length;

        return Math.max(
            0,
            quantite - dejaAttribues
        );

    }


    function cadeauEstEpuise(choice) {

        return obtenirQuantiteRestante(choice) <= 0;

    }

    /* =====================================================
   TIRAGE CADEAUX
===================================================== */

function tirageParCadeau() {

    const choix = obtenirChoixCadeaux();

    const nouveauxResultats = [];

    /*
     * IMPORTANT :
     * Pour un nouveau tirage automatique,
     * on affiche uniquement les résultats
     * de ce tirage.
     */
    const container =
        $("resultatTirage");

    container.innerHTML = "";


    choix.forEach(choice => {

        let quantiteRestante =
            obtenirQuantiteRestante(choice);


        if (quantiteRestante <= 0) {
            return;
        }


        /*
         * Participants ayant choisi ce cadeau.
         */
        let participants =
            state.eligibleParticipants.filter(
                participant =>
                    String(participant.choice)
                        .toUpperCase() === choice
            );


        /*
         * Si "un seul gain" est activé,
         * retirer tous les participants
         * ayant déjà gagné.
         */
        participants =
            obtenirParticipantsDisponibles(
                participants
            );


        if (!participants.length) {
            return;
        }


        /*
 * Nom du cadeau.
 */
const choix =
    obtenirChoixCadeaux();

const lotIndex =
    choix.indexOf(
        String(choice).toUpperCase()
    );

const lot =
    state.currentGame &&
    state.currentGame.lots
        ? state.currentGame.lots[lotIndex]
        : null;

        const nomCadeau =
            lot && lot.nom
                ? lot.nom
                : `Cadeau ${choice}`;


        /*
         * Tirage jusqu'à épuisement
         * du stock ou des participants.
         */
        while (
            quantiteRestante > 0 &&
            participants.length > 0
        ) {

            const index =
                randomIndex(
                    participants.length
                );


            const winner =
                participants.splice(
                    index,
                    1
                )[0];


            const resultat = {

                participant: winner,

                choice: choice,

                lot: nomCadeau

            };


            /*
             * Enregistrer le cadeau gagné.
             */
            state.giftResults.push(
                resultat
            );


            nouveauxResultats.push(
                resultat
            );


            /*
             * IMPORTANT :
             * si un seul gain est autorisé,
             * ajouter immédiatement le gagnant
             * dans state.winners.
             *
             * Ainsi, il sera exclu des prochains
             * choix A / B / C.
             */
            if (
                state.currentGame &&
                state.currentGame.unSeulGain
            ) {

                state.winners.push(
                    winner
                );

            }


            quantiteRestante--;

        }

    });


    /*
     * Aucun nouveau cadeau attribué.
     */
    if (!nouveauxResultats.length) {

        showToast(
            "⚠️ Aucun cadeau ne peut être attribué."
        );

        renderChoixCadeaux();

        return;
    }

  
    /*
     * Si "un seul gain" est désactivé,
     * les gagnants sont quand même enregistrés
     * pour les statistiques et l'historique.
     */
    if (
        !(
            state.currentGame &&
            state.currentGame.unSeulGain
        )
    ) {

        nouveauxResultats.forEach(
            resultat => {

                state.winners.push(
                    resultat.participant
                );

            }
        );

    }

    afficherResultatTirage();

    enregistrerHistorique();

    updateStats();

    renderChoixCadeaux();


    showToast(
        `🏆 ${nouveauxResultats.length} cadeau(x) attribué(s) !`
    );

}

     /* =====================================================
   AFFICHER RESULTAT
===================================================== */

function afficherResultatTirage() {

    const container =
        $("resultatTirage");


    container.classList.remove(
        "hidden"
    );


    /*
     * =================================================
     * JEUX AVEC CADEAUX
     * =================================================
     */

    if (
        state.currentGame &&
        state.currentGame.type === "cadeaux"
    ) {

        if (!state.giftResults.length) {

            container.innerHTML =
                "<strong>Aucun cadeau attribué.</strong>";

            return;
        }


        /*
         * Regrouper les résultats par cadeau.
         */

        const groupes = {};


        state.giftResults.forEach(
            resultat => {

                const choice =
                    String(
                        resultat.choice
                    )
                        .toUpperCase();


                if (!groupes[choice]) {

                    groupes[choice] = [];

                }


                groupes[choice].push(
                    resultat
                );

            }
        );


        /*
         * Ordre d'affichage :
         * A → B → C
         */

        const choix = obtenirChoixCadeaux();


        const total =
    state.giftResults.length;


/*
 * Nombre de personnes différentes ayant gagné.
 *
 * Une même personne peut avoir gagné
 * plusieurs cadeaux si "unSeulGain" est désactivé.
 */
const nomsGagnants =
    state.giftResults
        .filter(
            resultat =>
                resultat &&
                resultat.participant &&
                resultat.participant.name
        )
        .map(
            resultat =>
                normalizeName(
                    resultat.participant.name
                )
        );


const gagnantsUniques =
    new Set(
        nomsGagnants
    );


const nombreGagnantsUniques =
    gagnantsUniques.size;


        /*
         * Construire l'affichage.
         */

        container.innerHTML = `

            <h3>
                🏆 RÉSULTATS DU TIRAGE
            </h3>


            ${choix.map(
                choice => {

                    const resultats =
                        groupes[choice] || [];


                    if (!resultats.length) {

                        return "";

                    }


                    const premier =
                        resultats[0];


                    return `

                        <div class="resultat-cadeau">

                            <h4>

                                🎁
                                Cadeau
                                ${escapeHTML(
                                    choice
                                )}

                                ${
                                    premier.lot
                                        ? `
                                            — 
                                            ${escapeHTML(
                                                premier.lot
                                            )}
                                        `
                                        : ""
                                }

                            </h4>


                            <div class="liste-gagnants-cadeau">

                                ${resultats.map(
                                    (resultat, index) => `

                                        <div class="winner-name">

                                            ${
                                                index === 0
                                                    ? "🥇"
                                                    : index === 1
                                                        ? "🥈"
                                                        : index === 2
                                                            ? "🥉"
                                                            : `${index + 1}.`
                                            }

                                            ${escapeHTML(
                                                resultat.participant.name
                                            )}

                                        </div>

                                    `
                                ).join("")}

                            </div>

                        </div>

                    `;

                }
            ).join("")}


            <div class="resume-tirage">

                <strong>
                    ━━━━━━━━━━━━━━━━
                </strong>

                <div>
                    🎁 Total :
                    <strong>
                        ${nombreGagnantsUniques}
                    </strong>
                    cadeau(x)
                </div>

                <div>
                    👥 Gagnants :
                    <strong>
                        ${total}
                    </strong>
                </div>

            </div>

        `;

        return;
    }


    /*
     * =================================================
     * JEUX CLASSIQUES SANS CADEAUX
     * =================================================
     */

    if (!state.winners.length) {

        container.innerHTML =
            "<strong>Aucun gagnant.</strong>";

        return;

    }


    const derniersGagnants =
        state.winners.slice(
            -state.currentGame.nombreGagnants
        );


    container.innerHTML = `

        <h3>
            🏆 Gagnant(s)
        </h3>

        ${derniersGagnants.map(
            (winner, index) => `

                <div class="winner-name">

                    ${index + 1}.
                    ${escapeHTML(
                        winner.name
                    )}

                </div>

                <div class="winner-prize">

                    ${escapeHTML(
                        state.currentGame.lots[index]
                            ? state.currentGame.lots[index].nom
                            : "Gagnant du jeu"
                    )}

                </div>

            `
        ).join("")}

    `;

} 
    
/* =====================================================
   AFFICHER LES CHOIX ET LE STOCK DES CADEAUX
===================================================== */

function renderChoixCadeaux() {

    if (
        !state.currentGame ||
        state.currentGame.type !== "cadeaux"
    ) {

        return;

    }

    const container =
        $("listeChoixCadeaux");

    const choix = obtenirChoixCadeaux();

    container.innerHTML =
        choix.map(
            choice => {

                /*
                 * Participants correspondant
                 * à ce choix.
                 */

                let participants =
                    state.eligibleParticipants
                        .filter(
                            participant =>
                                String(
                                    participant.choice
                                )
                                    .toUpperCase() === choice
                        );


                /*
                 * Si "un seul gain" est activé,
                 * retirer les gagnants précédents.
                 */

                participants =
                    obtenirParticipantsDisponibles(
                        participants
                    );


                /*
                 * Récupérer le lot.
                 */

                const choixDisponibles =
    obtenirChoixCadeaux();


const lotIndex =
    choixDisponibles.indexOf(
        String(choice).toUpperCase()
    );


const lot =
    state.currentGame
        .lots[lotIndex];

                /*
                 * Quantité totale du cadeau.
                 */

                const quantiteTotale =
                    obtenirQuantiteLot(
                        choice
                    );


                /*
                 * Quantité déjà attribuée.
                 */

                const quantiteAttribuee =
                    obtenirResultatsCadeau(
                        choice
                    ).length;


                /*
                 * Quantité restante.
                 */

                const quantiteRestante =
                    obtenirQuantiteRestante(
                        choice
                    );


                /*
                 * Vérifier si le cadeau
                 * est épuisé.
                 */

                const epuise =
                    quantiteRestante <= 0;


                return `

                    <div class="choice-draw-item">

                        <div class="choice-draw-header">

                            <h4>

                                🎁 Choix ${choice}

                                ${
                                    lot
                                        ? ` — ${escapeHTML(
                                            lot.nom
                                        )}`
                                        : ""
                                }

                            </h4>


                            <span class="badge">

                                ${participants.length}

                            </span>

                        </div>

                        <div class="choice-participants">

    👥
    ${participants.length}
    participant(s) éligible(s)

</div>

<div class="choice-stock">

    📦 Stock restant :

    <strong>
        ${quantiteRestante}
    </strong>

    /
    ${quantiteTotale}

</div>
                       
                        ${
                            epuise
                                ? `

                                    <div class="choice-stock">

                                        🔒
                                        <strong>
                                            Cadeau épuisé
                                        </strong>

                                    </div>

                                `
                                : ""
                        }


                        <button
                            class="btn btn-primary btn-tirer-choix"
                            data-choice="${choice}"

                            ${
                                participants.length &&
                                !epuise
                                    ? ""
                                    : "disabled"
                            }
                        >

                            ${
                                epuise
                                    ? "🔒 Épuisé"
                                    : `🎲 Tirer ${choice}`
                            }

                        </button>

                    </div>

                `;

            }
        ).join("");


    /*
     * Activer les boutons de tirage.
     */

    container
        .querySelectorAll(
            ".btn-tirer-choix"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        tirerUnChoix(
                            button.dataset.choice
                        );

                    }
                );

            }
        );

}
    
function tirerUnChoix(choice) {

    /*
     * Vérifier s'il reste des cadeaux
     * pour ce choix.
     */

    if (
        obtenirQuantiteRestante(choice) <= 0
    ) {

        showToast(
            `⚠️ Le cadeau ${choice} est épuisé.`
        );

        renderChoixCadeaux();

        return;
    }


    /*
     * Récupérer les participants
     * correspondant au choix.
     */

    let participants =
        state.eligibleParticipants.filter(
            participant =>
                String(
                    participant.choice
                )
                    .toUpperCase() === choice
        );


    /*
     * Si "un seul gain" est activé,
     * retirer les personnes ayant déjà gagné.
     */

    participants =
        obtenirParticipantsDisponibles(
            participants
        );


    if (!participants.length) {

        showToast(
            `⚠️ Aucun participant disponible pour ${choice}.`
        );

        renderChoixCadeaux();

        return;
    }


    /*
     * Tirage aléatoire.
     */

    const winner =
        participants[
            randomIndex(
                participants.length
            )
        ];


    /*
     * Récupérer le cadeau correspondant.
     */

    const lotIndex =
        choice.charCodeAt(0) - 65;

    const lot =
        state.currentGame &&
        state.currentGame.lots
            ? state.currentGame.lots[lotIndex]
            : null;


    const nomCadeau =
        lot && lot.nom
            ? lot.nom
            : `Cadeau ${choice}`;


    /*
     * Enregistrer le résultat du tirage.
     */

    const resultat = {

        participant: winner,

        choice: choice,

        lot: nomCadeau

    };


    state.giftResults.push(
        resultat
    );


    /*
     * Le gagnant est ajouté à la liste
     * globale des gagnants.
     *
     * Si "un seul gain" est désactivé,
     * il pourra quand même être retiré
     * de nouveau lors d'un prochain tirage.
     */

    state.winners.push(
        winner
    );


    afficherResultatTirage();

    enregistrerHistorique();

    updateStats();

    renderChoixCadeaux();


    showToast(
        `🏆 ${winner.name} gagne le cadeau ${choice}.`
    );

}
    
    /* =====================================================
       MISSION SPECIALE
    ====================================================== */

    async function handleMissionFile(file) {

        if (!file) {
            return;
        }


        try {

            const text =
                await file.text();


            state.missionParticipants =
                parseParticipantsCSV(
                    text
                );


            $("etatMission").textContent =
                `📥 ${state.missionParticipants.length} participant(s) validé(s) pour la mission.`;


            showToast(
                "🔥 Participants de la mission chargés."
            );

        } catch (error) {

            console.error(error);


            $("etatMission").textContent =
                "❌ Erreur lors de la lecture.";

        }

    }


    function tirageMission() {

        if (
            !state.missionParticipants.length
        ) {

            showToast(
                "⚠️ Aucun participant Mission spéciale."
            );

            return;

        }


        /*
         * Même règle :
         * un participant ayant déjà gagné
         * ne peut pas gagner la mission
         * si "un seul gain" est activé.
         */

        const disponibles =
            obtenirParticipantsDisponibles(
                state.missionParticipants
            );


        if (!disponibles.length) {

            showToast(
                "⚠️ Aucun participant disponible pour la mission."
            );

            return;

        }


        const winner =
            disponibles[
                randomIndex(
                    disponibles.length
                )
            ];


        const container =
            $("resultatMission");


        container.classList.remove(
            "hidden"
        );


        container.innerHTML = `

            <h3>
                🔥 Mission spéciale
            </h3>

            <div class="winner-name">

                ${escapeHTML(
                    winner.name
                )}

            </div>

            <div class="winner-prize">

                Récompense :

                ${
                    escapeHTML(
                        state.currentGame
                            .mission
                            .recompense ||
                        "Récompense"
                    )
                }

            </div>

        `;


        state.winners.push(
            winner
        );


        enregistrerHistorique();

        updateStats();


        showToast(
            "🔥 Mission spéciale tirée."
        );

    }

    /* =====================================================
   HISTORIQUE
===================================================== */

function enregistrerHistorique() {

    if (!state.currentGame) {
        return;
    }


    /*
     * Pour les jeux avec cadeaux,
     * enregistrer chaque attribution
     * avec le choix et le cadeau.
     */

    let winnersHistorique;


    if (
        state.currentGame.type === "cadeaux"
    ) {

        winnersHistorique =
            state.giftResults.map(
                resultat => {

                    return {
                        name:
                            resultat.participant.name,

                        choice:
                            resultat.choice,

                        lot:
                            resultat.lot

                    };

                }
            );

    } else {

        /*
         * Jeux classiques.
         */

        winnersHistorique =
            state.winners.map(
                winner => {

                    return {
                        name:
                            winner.name
                    };

                }
            );

    }


    const record = {

        id:
            Date.now(),

        gameName:
            state.currentGame.nom,

        gameType:
            state.currentGame.type,

        date:
            new Date()
                .toLocaleString("fr-FR"),

        winners:
            winnersHistorique

    };


    /*
     * Pour l'instant :
     * une seule fiche par jeu.
     */

    const index =
        state.history.findIndex(
            item =>
                item.gameName ===
                    record.gameName
                &&
                item.gameType ===
                    record.gameType
        );


    if (index !== -1) {

        state.history[index] =
            record;

    } else {

        state.history.unshift(
            record
        );

    }


    saveState();

    renderHistory();

}

    function renderHistory() {

    const container =
        $("listeHistorique");


    if (!state.history.length) {

        container.innerHTML = `

            <div class="empty-state">

                Aucun tirage enregistré.

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.history.map(
            item => `

                <div class="history-item">

                    <div class="history-item-header">

                        <div>

                            <h3>

                                🎮
                                ${escapeHTML(
                                    item.gameName
                                )}

                            </h3>

                        </div>


                        <div class="history-date">

                            ${escapeHTML(
                                item.date
                            )}

                        </div>

                    </div>


                    <div class="history-winners">

                        ${
                            item.winners.length

                                ? item.winners.map(
                                    (winner, index) => {

                                        /*
                                         * Compatible avec :
                                         * - ancien format : "Alice"
                                         * - nouveau format : { name, choice, lot }
                                         */

                                        const winnerName =
                                            typeof winner === "string"
                                                ? winner
                                                : winner.name;


                                        const choice =
                                            typeof winner === "object" &&
                                            winner
                                                ? winner.choice
                                                : null;


                                        const lot =
                                            typeof winner === "object" &&
                                            winner
                                                ? winner.lot
                                                : null;


                                        return `

                                            <div class="history-winner">

                                                🏆
                                                ${index + 1}.
                                                ${escapeHTML(
                                                    winnerName
                                                )}

                                                ${
                                                    choice
                                                        ? `
                                                            — Choix
                                                            ${escapeHTML(
                                                                choice
                                                            )}
                                                        `
                                                        : ""
                                                }

                                            </div>


                                            ${
                                                lot
                                                    ? `

                                                        <div class="history-prize">

                                                            🎁
                                                            ${escapeHTML(
                                                                lot
                                                            )}

                                                        </div>

                                                    `
                                                    : ""
                                            }

                                        `;

                                    }
                                ).join("")

                                : "Aucun gagnant"
                        }

                    </div>

                </div>

            `
        ).join("");

}

    /* =====================================================
       EXPORT CSV
    ====================================================== */

    function exporterParticipants() {

        const list =
            state.eligibleParticipants.length
                ? state.eligibleParticipants
                : state.participants;


        if (!list.length) {

            showToast(
                "⚠️ Aucun participant à exporter."
            );

            return;

        }


        const lines = [

            [
                "Nom",
                "Commentaire",
                "Choix",
                "Réponse",
                "Nombre"
            ].join(";")

        ];


        list.forEach(
            participant => {

                lines.push(

                    [

                        participant.name,

                        participant.comment,

                        participant.choice,

                        participant.answer,

                        participant.number

                    ]
                        .map(csvEscape)
                        .join(";")

                );

            }
        );


        downloadFile(
            "participants-crystal-boutik.csv",
            lines.join("\n"),
            "text/csv;charset=utf-8"
        );


        showToast(
            "📤 Participants exportés."
        );

    }


    function csvEscape(value) {

        const text =
            String(value ?? "");


        if (
            text.includes(";") ||
            text.includes('"') ||
            text.includes("\n")
        ) {

            return `"${text.replace(
                /"/g,
                '""'
            )}"`;

        }


        return text;

    }


    function downloadFile(
        filename,
        content,
        type
    ) {

        const blob =
            new Blob(
                [content],
                { type }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const a =
            document.createElement(
                "a"
            );


        a.href =
            url;


        a.download =
            filename;


        document.body.appendChild(
            a
        );


        a.click();


        a.remove();


        URL.revokeObjectURL(
            url
        );

    }


    /* =====================================================
       RESET PARTICIPANTS
    ====================================================== */

    function viderParticipants() {

        if (
            !state.participants.length
        ) {

            showToast(
                "ℹ️ Aucun participant à supprimer."
            );

            return;

        }


        const confirmation =
            confirm(
                "Supprimer tous les participants actuellement chargés ?"
            );


        if (!confirmation) {
            return;
        }


        state.participants =
            [];

        state.eligibleParticipants =
            [];

        state.missionParticipants =
            [];

        state.winners =
            [];

        state.giftResults =
    [];

        $("participantsFile").value =
            "";


        $("missionFile").value =
            "";


        $("etatImport").textContent =
            "Aucun participant chargé.";


        $("etatMission").textContent =
            "Aucun participant Mission spéciale.";


        $("resultatValidation").innerHTML =
            "";


        $("resultatTirage")
            .classList.add("hidden");


        $("resultatTirage").innerHTML =
            "";


        $("resultatMission")
            .classList.add("hidden");


        $("resultatMission").innerHTML =
            "";


        updateStats();

        renderParticipants();

        renderChoixCadeaux();


        showToast(
            "🗑️ Participants supprimés."
        );

    }


    /* =====================================================
       RESET CREATION
    ====================================================== */

    function resetCreationForm() {

        $("nomJeu").value =
            "";

        $("descriptionJeu").value =
            "";

        $("nombreGagnants").value =
            1;

        $("unSeulGain").checked =
            true;

        $("listeLots").innerHTML =
            "";

        $("listeConditions").innerHTML =
            "";

        $("activerMission").checked =
            false;


        $("configurationMission")
            .classList.add("hidden");


        document.querySelector(
            'input[name="typeJeu"][value="simple"]'
        ).checked =
            true;


        ajouterLot();


        ajouterCondition(
            "Suivre la page"
        );


        ajouterCondition(
            "Aimer la publication"
        );


        updateGameOptions();

    }


    /* =====================================================
       EVENEMENTS
    ====================================================== */

    function initEvents() {


        /* -----------------------------------------------
           ACCUEIL
        ------------------------------------------------ */

        $("btnNouveauJeu")
            .addEventListener(
                "click",
                () => {

                    resetCreationForm();

                    showSection(
                        "creationJeu"
                    );

                }
            );


        $("btnOuvrirJeu")
            .addEventListener(
                "click",
                () => {

                    if (
                        state.currentGame
                    ) {

                        afficherJeuActif();

                        showSection(
                            "jeuActif"
                        );

                    } else {

                        showToast(
                            "ℹ️ Aucun jeu actif."
                        );

                    }

                }
            );


        $("btnHistorique")
            .addEventListener(
                "click",
                () => {

                    renderHistory();

                    showSection(
                        "historique"
                    );

                }
            );


        /* -----------------------------------------------
           NAVIGATION
        ------------------------------------------------ */

        $("btnRetourAccueil")
            .addEventListener(
                "click",
                () =>
                    showSection(
                        "accueil"
                    )
            );


        $("btnRetourCreation")
            .addEventListener(
                "click",
                () =>
                    showSection(
                        "creationJeu"
                    )
            );


        $("btnRetourAccueilHistorique")
            .addEventListener(
                "click",
                () =>
                    showSection(
                        "accueil"
                    )
            );


        /* -----------------------------------------------
           TYPE DE JEU
        ------------------------------------------------ */

        document.querySelectorAll(
            'input[name="typeJeu"]'
        ).forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateGameOptions
                );

            }
        );


        /* -----------------------------------------------
           LOTS
        ------------------------------------------------ */

        $("btnAjouterLot")
            .addEventListener(
                "click",
                () =>
                    ajouterLot()
            );

        /* -----------------------------------------------
   MOTS-CLES DE PARTICIPATION
------------------------------------------------ */

$("btnAjouterMotCle")
    .addEventListener(
        "click",
        () => {

            const input =
                $("motCleParticipation");

            const motCle =
                input.value.trim();

            if (!motCle) {
                alert(
                    "Veuillez saisir un mot-clé."
                );
                return;
            }

            const existe =
                state.keywords.some(
                    mot =>
                        mot.toLowerCase() ===
                        motCle.toLowerCase()
                );

            if (existe) {
                alert(
                    "Ce mot-clé existe déjà."
                );
                return;
            }

            state.keywords.push(
                motCle
            );

            input.value = "";

            afficherMotsCles();
        }
    );
       
        /* -----------------------------------------------
           CONDITIONS
        ------------------------------------------------ */

        $("btnAjouterCondition")
            .addEventListener(
                "click",
                () =>
                    ajouterCondition()
            );


        /* -----------------------------------------------
           MISSION
        ------------------------------------------------ */

        $("activerMission")
            .addEventListener(
                "change",
                function () {

                    $("configurationMission")
                        .classList.toggle(
                            "hidden",
                            !this.checked
                        );

                }
            );


        /* -----------------------------------------------
           CREER
        ------------------------------------------------ */

        $("btnCreerJeu")
            .addEventListener(
                "click",
                creerJeu
            );


        /* -----------------------------------------------
           CSV
        ------------------------------------------------ */

        $("participantsFile")
            .addEventListener(
                "change",
                function () {

                    handleParticipantsFile(
                        this.files[0]
                    );

                }
            );
 
   /* -----------------------------------------------
   IMPORT COMMENTAIRES FACEBOOK
    ------------------------------------------------ */

$("btnImporterCommentaires")
    .addEventListener(
        "click",
        importerCommentairesFacebook
    );
       
        $("missionFile")
            .addEventListener(
                "change",
                function () {

                    handleMissionFile(
                        this.files[0]
                    );

                }
            );


        /* -----------------------------------------------
           DEMO
        ------------------------------------------------ */

        $("btnDemoParticipants")
            .addEventListener(
                "click",
                loadDemoParticipants
            );


        /* -----------------------------------------------
           VALIDATION
        ------------------------------------------------ */

        $("btnValiderParticipants")
            .addEventListener(
                "click",
                validateParticipants
            );


        /* -----------------------------------------------
           EXPORT
        ------------------------------------------------ */

        $("btnExporterParticipants")
            .addEventListener(
                "click",
                exporterParticipants
            );


        /* -----------------------------------------------
           VIDER
        ------------------------------------------------ */

        $("btnViderParticipants")
            .addEventListener(
                "click",
                viderParticipants
            );


        /* -----------------------------------------------
           TIRAGE
        ------------------------------------------------ */

        $("btnTirage")
            .addEventListener(
                "click",
                lancerTirage
            );


        /* -----------------------------------------------
           MISSION
        ------------------------------------------------ */

        $("btnTirageMission")
            .addEventListener(
                "click",
                tirageMission
            );


        /* -----------------------------------------------
           HISTORIQUE
        ------------------------------------------------ */

        $("btnEffacerHistorique")
            .addEventListener(
                "click",
                function () {

                    if (
                        !state.history.length
                    ) {

                        showToast(
                            "ℹ️ Historique déjà vide."
                        );

                        return;

                    }


                    if (
                        !confirm(
                            "Effacer tout l'historique ?"
                        )
                    ) {

                        return;

                    }


                    state.history =
                        [];


                    saveState();

                    renderHistory();


                    showToast(
                        "🗑️ Historique effacé."
                    );

                }
            );

    }


    /* =====================================================
       INITIALISATION
    ====================================================== */

    function init() {

        loadHistory();

        initEvents();

        resetCreationForm();

    }


    init();


})();
