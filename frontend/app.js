/* =========================================================
   CLAUSEGUARD AI
   Contract Risk Intelligence Frontend
========================================================= */

const API_BASE = "http://127.0.0.1:8000";

const DEFAULT_CONTRACT_ID = 4;

let dashboardData = null;
let riskChart = null;


/* =========================================================
   ACTIVE CONTRACT
========================================================= */

function getActiveContractId() {

    const storedId =
        localStorage.getItem("activeContractId");

    if (storedId) {
        return Number(storedId);
    }

    return DEFAULT_CONTRACT_ID;
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDashboard();

    }
);


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    const contractId =
        getActiveContractId();

    try {

        showLoadingState();


        /* -------------------------------------------------
           1. Load dashboard
        ------------------------------------------------- */

        let response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/dashboard`
            );


        if (!response.ok) {

            throw new Error(
                `Dashboard request failed: ${response.status}`
            );

        }


        dashboardData =
            await response.json();


        /* -------------------------------------------------
           2. Extract obligations if dashboard has none
        ------------------------------------------------- */

        if (
            !dashboardData.obligations ||
            dashboardData.obligations.length === 0
        ) {

            try {

                const obligationResponse =
                    await fetch(
                        `${API_BASE}/contracts/${contractId}/obligations`,
                        {
                            method: "POST"
                        }
                    );


                if (!obligationResponse.ok) {

                    console.warn(
                        "Obligation extraction failed:",
                        obligationResponse.status
                    );

                } else {

                    /*
                     * IMPORTANT:
                     * Reload dashboard after obligations
                     * have been saved to MySQL.
                     */

                    response =
                        await fetch(
                            `${API_BASE}/contracts/${contractId}/dashboard`
                        );


                    if (response.ok) {

                        dashboardData =
                            await response.json();

                    }

                }

            } catch (obligationError) {

                console.warn(
                    "Obligation extraction error:",
                    obligationError
                );

            }

        }


        /* -------------------------------------------------
           3. Render dashboard
        ------------------------------------------------- */

        renderContractInfo();

        renderRiskSummary();

        renderRiskChart();

        renderTopRisks();

        renderObligations();


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        showError(
            "Unable to load contract dashboard. " +
            "Make sure the FastAPI backend is running."
        );

    }

}


/* =========================================================
   CONTRACT INFORMATION
========================================================= */

function renderContractInfo() {

    if (
        !dashboardData ||
        !dashboardData.contract
    ) {

        return;

    }


    const contract =
        dashboardData.contract;


    const nameElement =
        document.getElementById(
            "contractName"
        );


    const metaElement =
        document.getElementById(
            "contractMeta"
        );


    if (nameElement) {

        nameElement.textContent =
            contract.name ||
            "Unnamed Contract";

    }


    if (metaElement) {

        metaElement.textContent =
            `${contract.file_name || ""} • ` +
            `${contract.file_type || "DOCUMENT"} • ` +
            `Version ${contract.version ?? 1}`;

    }


    const versionBadge =
        document.querySelector(
            ".version-badge"
        );


    if (versionBadge) {

        versionBadge.textContent =
            `V${contract.version ?? 1}`;

    }

}


/* =========================================================
   RISK SUMMARY
========================================================= */

function renderRiskSummary() {

    const summary =
        dashboardData?.risk_summary;


    const indicator =
        dashboardData?.risk_indicator;


    if (!summary) {

        return;

    }


    setText(
        "highRisk",
        summary.high_risk ?? 0
    );


    setText(
        "riskyFindings",
        summary.risky ?? 0
    );


    setText(
        "standardFindings",
        summary.standard ?? 0
    );


    if (indicator) {

        setText(
            "riskIndicator",
            indicator.level || "UNKNOWN"
        );


        setText(
            "riskPoints",
            indicator.points ?? 0
        );


        updateRiskIndicator(
            indicator.level
        );

    }

}


/* =========================================================
   RISK INDICATOR
========================================================= */

function updateRiskIndicator(
    level
) {

    const indicator =
        document.getElementById(
            "riskIndicator"
        );


    const progress =
        document.getElementById(
            "riskProgress"
        );


    if (!indicator) {

        return;

    }


    const normalized =
        String(
            level || ""
        ).toUpperCase();


    indicator.textContent =
        normalized || "UNKNOWN";


    if (
        normalized === "HIGH"
    ) {

        indicator.style.background =
            "rgba(255, 92, 108, 0.12)";

        indicator.style.color =
            "#ff5c6c";


        if (progress) {

            progress.style.width =
                "90%";

        }

    } else if (
        normalized === "MEDIUM"
    ) {

        indicator.style.background =
            "rgba(255, 180, 84, 0.12)";

        indicator.style.color =
            "#ffb454";


        if (progress) {

            progress.style.width =
                "60%";

        }

    } else {

        indicator.style.background =
            "rgba(39, 209, 127, 0.12)";

        indicator.style.color =
            "#27d17f";


        if (progress) {

            progress.style.width =
                "25%";

        }

    }

}


/* =========================================================
   RISK CHART
========================================================= */

function renderRiskChart() {

    const canvas =
        document.getElementById(
            "riskChart"
        );


    if (!canvas) {

        return;

    }


    const summary =
        dashboardData?.risk_summary || {};


    const standard =
        Number(
            summary.standard || 0
        );


    const risky =
        Number(
            summary.risky || 0
        );


    const ambiguous =
        Number(
            summary.ambiguous || 0
        );


    const missing =
        Number(
            summary.missing || 0
        );


    if (riskChart) {

        riskChart.destroy();

    }


    if (
        typeof Chart === "undefined"
    ) {

        console.warn(
            "Chart.js is not loaded."
        );

        return;

    }


    riskChart =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels: [
                        "Standard",
                        "Risky",
                        "Ambiguous",
                        "Missing"
                    ],

                    datasets: [

                        {

                            data: [
                                standard,
                                risky,
                                ambiguous,
                                missing
                            ],

                            backgroundColor: [
                                "#27d17f",
                                "#ff5c6c",
                                "#ffb454",
                                "#6fa8ff"
                            ],

                            borderColor:
                                "#0d1211",

                            borderWidth:
                                4,

                            hoverOffset:
                                5

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "70%",

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                color:
                                    "#a5b2ae",

                                padding:
                                    18,

                                usePointStyle:
                                    true,

                                pointStyle:
                                    "circle",

                                font: {
                                    size: 10
                                }

                            }

                        },

                        tooltip: {

                            backgroundColor:
                                "#151d1b",

                            titleColor:
                                "#f2f7f5",

                            bodyColor:
                                "#a5b2ae",

                            borderColor:
                                "rgba(255,255,255,0.08)",

                            borderWidth:
                                1,

                            padding:
                                10

                        }

                    }

                }

            }
        );

}


/* =========================================================
   TOP RISKS
========================================================= */

function renderTopRisks() {

    const container =
        document.getElementById(
            "topRisks"
        );


    const count =
        document.getElementById(
            "riskCount"
        );


    if (!container) {

        return;

    }


    const risks =
        dashboardData?.top_risks || [];


    if (count) {

        count.textContent =
            risks.length;

    }


    if (
        risks.length === 0
    ) {

        container.innerHTML = `
            <div class="loading">
                No priority risks detected.
            </div>
        `;

        return;

    }


    container.innerHTML =
        risks
            .map(
                risk => {

                    const findingId =
                        Number(
                            risk.finding_id
                        );


                    const category =
                        escapeHtml(
                            risk.category ||
                            "Unknown"
                        );


                    const severity =
                        escapeHtml(
                            risk.severity ||
                            "UNKNOWN"
                        );


                    const actual =
                        escapeHtml(
                            risk.actual ||
                            "Not specified"
                        );


                    const expected =
                        escapeHtml(
                            risk.expected ||
                            "Not specified"
                        );


                    const reason =
                        escapeHtml(
                            risk.reason ||
                            ""
                        );


                    return `

                        <div class="risk-item">

                            <div class="risk-item-top">

                                <div class="risk-category">

                                    <span class="risk-dot"></span>

                                    ${category}

                                </div>


                                <span class="severity-badge">

                                    ${severity}

                                </span>

                            </div>


                            <div class="risk-detail">

                                ${reason}

                            </div>


                            <div class="risk-actual">

                                Actual:
                                ${actual}

                                &nbsp; • &nbsp;

                                Expected:
                                ${expected}

                            </div>


                            <button
                                class="view-evidence"
                                onclick="loadTrace(${findingId})"
                            >

                                View Evidence →

                            </button>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   EVIDENCE TRACE
========================================================= */

async function loadTrace(
    findingId
) {

    const contractId =
        getActiveContractId();


    const panel =
        document.getElementById(
            "tracePanel"
        );


    if (!panel) {

        return;

    }


    panel.innerHTML = `

        <div class="trace-empty">

            <div class="loading">

                Loading evidence trace...

            </div>

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/findings/${findingId}/trace`
            );


        if (!response.ok) {

            throw new Error(
                `Trace request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        renderTrace(
            data
        );


    } catch (error) {

        console.error(
            "Trace error:",
            error
        );


        panel.innerHTML = `

            <div class="trace-empty">

                <div class="trace-icon">
                    !
                </div>

                <h4>
                    Unable to load evidence
                </h4>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   RENDER TRACE
========================================================= */

function renderTrace(
    data
) {

    const panel =
        document.getElementById(
            "tracePanel"
        );


    if (!panel) {

        return;

    }


    const evidence =
        data.contract_evidence || {};


    const rule =
        data.playbook_rule || {};


    const assessment =
        data.assessment || {};


    panel.innerHTML = `

        <div class="trace-box">

            <div class="trace-box-header">

                <span class="trace-box-title">

                    Contract Evidence

                </span>


                <span class="trace-box-label">

                    CLAUSE
                    ${escapeHtml(
                        evidence.clause_number ||
                        evidence.clause_id ||
                        "—"
                    )}

                </span>

            </div>


            <p class="trace-text">

                ${escapeHtml(
                    evidence.text ||
                    "No evidence available."
                )}

            </p>

        </div>


        <div class="trace-box">

            <div class="trace-box-header">

                <span class="trace-box-title">

                    Playbook Rule

                </span>


                <span class="trace-box-label">

                    ${escapeHtml(
                        rule.rule_id ||
                        "RULE"
                    )}

                </span>

            </div>


            <p class="trace-rule">

                ${escapeHtml(
                    rule.requirement ||
                    rule.description ||
                    "No rule description available."
                )}

            </p>

        </div>


        <div class="assessment">

            <strong>
                Why this was flagged
            </strong>


            <p>

                ${escapeHtml(
                    assessment.reason ||
                    "No assessment reason available."
                )}

            </p>


            <p>

                <strong>
                    Recommended action:
                </strong>

                ${escapeHtml(
                    assessment.recommended_action ||
                    "Review the contract clause."
                )}

            </p>

        </div>

    `;


    panel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   OBLIGATIONS
========================================================= */

function renderObligations() {

    const container =
        document.getElementById(
            "obligations"
        );


    const count =
        document.getElementById(
            "obligationCount"
        );


    if (!container) {

        return;

    }


    const obligations =
        dashboardData?.obligations || [];


    if (count) {

        count.textContent =
            obligations.length;

    }


    if (
        obligations.length === 0
    ) {

        container.innerHTML = `

            <div class="loading">

                No obligations extracted.

            </div>

        `;

        return;

    }


    container.innerHTML =
        obligations
            .map(
                obligation => {

                    const actor =
                        escapeHtml(
                            obligation.actor ||
                            "Responsible party"
                        );


                    const action =
                        escapeHtml(
                            obligation.action ||
                            "No action specified"
                        );


                    const deadline =
                        obligation.deadline
                            ? escapeHtml(
                                obligation.deadline
                            )
                            : "";


                    const trigger =
                        obligation.trigger_condition
                            ? escapeHtml(
                                obligation.trigger_condition
                            )
                            : "";


                    const evidence =
                        escapeHtml(
                            obligation.evidence ||
                            ""
                        );


                    return `

                        <div class="obligation-item">

                            <div class="obligation-actor">

                                ${actor}

                            </div>


                            <div class="obligation-action">

                                ${action}

                            </div>


                            <div class="obligation-meta">

                                ${
                                    deadline
                                        ? `
                                            <span class="obligation-tag">

                                                Deadline:
                                                ${deadline}

                                            </span>
                                          `
                                        : ""
                                }


                                ${
                                    trigger
                                        ? `
                                            <span class="obligation-tag">

                                                Trigger:
                                                ${trigger}

                                            </span>
                                          `
                                        : ""
                                }

                            </div>


                            <div class="obligation-evidence">

                                ${evidence}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   VERSION COMPARISON
========================================================= */

async function loadComparison() {

    const contractId =
        getActiveContractId();


    const container =
        document.getElementById(
            "comparison"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="comparison-placeholder">

            <strong>
                Comparing V1 and V2...
            </strong>

            <span>
                Loading risk change intelligence.
            </span>

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/risk-comparison`
            );


        if (!response.ok) {

            throw new Error(
                `Comparison request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        renderComparison(
            data
        );


    } catch (error) {

        console.error(
            "Comparison error:",
            error
        );


        container.innerHTML = `

            <div class="comparison-placeholder">

                <strong>
                    V2 comparison unavailable
                </strong>

                <span>
                    This contract may not have a V2 version yet.
                </span>

            </div>

        `;

    }

}


/* =========================================================
   RENDER COMPARISON
========================================================= */

function renderComparison(
    data
) {

    const container =
        document.getElementById(
            "comparison"
        );


    if (!container) {

        return;

    }


    const highReduction =
        Number(
            data.high_risk_reduction ||
            0
        );


    const improvement =
        Number(
            data.net_risk_improvement ||
            0
        );


    const risksReduced =
        Number(
            data.risks_reduced ||
            0
        );


    container.innerHTML = `

        <div class="comparison-stat">

            <div class="comparison-stat-label">
                V1 HIGH RISKS
            </div>

            <div class="comparison-stat-value bad">
                ${data.v1_high_risk ?? 0}
            </div>

        </div>


        <div class="comparison-stat">

            <div class="comparison-stat-label">
                V2 HIGH RISKS
            </div>

            <div class="comparison-stat-value good">
                ${data.v2_high_risk ?? 0}
            </div>

        </div>


        <div class="comparison-stat">

            <div class="comparison-stat-label">
                HIGH RISK REDUCTION
            </div>

            <div class="comparison-stat-value good">
                ↓ ${highReduction}
            </div>

        </div>


        <div class="comparison-stat">

            <div class="comparison-stat-label">
                NET IMPROVEMENT
            </div>

            <div class="comparison-stat-value good">
                +${improvement}
            </div>

        </div>


        <div class="comparison-stat">

            <div class="comparison-stat-label">
                V1 RISKY FINDINGS
            </div>

            <div class="comparison-stat-value bad">
                ${data.v1_risky ?? 0}
            </div>

        </div>


        <div class="comparison-stat">

            <div class="comparison-stat-label">
                V2 RISKY FINDINGS
            </div>

            <div class="comparison-stat-value good">
                ${data.v2_risky ?? 0}
            </div>

        </div>


        <div class="comparison-stat">

            <div class="comparison-stat-label">
                RISKS REDUCED
            </div>

            <div class="comparison-stat-value good">
                ${risksReduced}
            </div>

        </div>


        <div class="comparison-stat">

            <div class="comparison-stat-label">
                RISK REGRESSION
            </div>

            <div
                class="comparison-stat-value ${
                    data.risk_regression
                        ? "bad"
                        : "good"
                }"
            >

                ${
                    data.risk_regression
                        ? "YES"
                        : "NO"
                }

            </div>

        </div>

    `;

}


/* =========================================================
   ANALYZE CURRENT CONTRACT
========================================================= */

async function analyzeContract() {

    const contractId =
        getActiveContractId();


    const button =
        document.querySelector(
            ".primary-button"
        );


    const originalText =
        button
            ? button.textContent
            : "";


    if (button) {

        button.textContent =
            "Analyzing...";

        button.disabled =
            true;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/analyze`,
                {
                    method: "POST"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Analysis failed: ${response.status}`
            );

        }


        await response.json();


        /*
         * Extract obligations immediately after
         * analysis.
         */

        const obligationResponse =
            await fetch(
                `${API_BASE}/contracts/${contractId}/obligations`,
                {
                    method: "POST"
                }
            );


        if (!obligationResponse.ok) {

            console.warn(
                "Obligation extraction returned:",
                obligationResponse.status
            );

        }


        await loadDashboard();


    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        showError(
            "Contract analysis failed."
        );


    } finally {

        if (button) {

            button.textContent =
                originalText;

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

function refreshDashboard() {

    loadDashboard();

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoadingState() {

    setText(
        "contractName",
        "Loading contract..."
    );


    setText(
        "contractMeta",
        "Connecting to backend..."
    );


    setText(
        "highRisk",
        "—"
    );


    setText(
        "riskyFindings",
        "—"
    );


    setText(
        "standardFindings",
        "—"
    );


    setText(
        "riskIndicator",
        "..."
    );


    setText(
        "riskPoints",
        "—"
    );

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    const container =
        document.getElementById(
            "topRisks"
        );


    if (!container) {

        console.error(
            message
        );

        return;

    }


    container.innerHTML = `

        <div class="risk-item">

            <div class="risk-category">

                <span class="risk-dot"></span>

                Connection Error

            </div>


            <div class="risk-detail">

                ${escapeHtml(
                    message
                )}

            </div>


            <button
                class="view-evidence"
                onclick="loadDashboard()"
            >

                Try Again →

            </button>

        </div>

    `;

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


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