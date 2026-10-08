/* =========================================================
   CLAUSEGUARD AI
   Dashboard Application
   Evidence-Grounded Contract Risk Intelligence
========================================================= */

const API_BASE = "http://127.0.0.1:8000";

const DEFAULT_CONTRACT_ID = 4;

let dashboardData = null;
let currentContract = null;
let selectedFindingId = null;
let riskChart = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeDashboard();
    }
);


async function initializeDashboard() {

    const contractId =
        getActiveContractId();

    await loadDashboard(
        contractId
    );

}


/* =========================================================
   ACTIVE CONTRACT
========================================================= */

function getActiveContractId() {

    const stored =
        localStorage.getItem(
            "activeContractId"
        );


    if (
        stored &&
        /^\d+$/.test(
            String(stored)
        )
    ) {

        return Number(stored);

    }


    return DEFAULT_CONTRACT_ID;

}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard(
    contractId = getActiveContractId()
) {

    contractId =
        Number(contractId);


    if (
        !Number.isInteger(contractId) ||
        contractId <= 0
    ) {

        contractId =
            DEFAULT_CONTRACT_ID;

    }


    setSystemStatus(
        "loading",
        "Loading contract intelligence..."
    );


    showLoadingState();


    try {

        const response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/dashboard`
            );


        const data =
            await parseResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                extractErrorMessage(
                    data,
                    `Dashboard request failed: ${response.status}`
                )
            );

        }


        dashboardData =
            data;


        currentContract =
            dashboardData.contract ||
            {};


        /*
         * Persist the contract currently
         * displayed by the dashboard.
         */

        localStorage.setItem(
            "activeContractId",
            String(contractId)
        );


        renderDashboard();


        /*
         * Obligations are loaded separately.
         * Failure here must not destroy the
         * main risk dashboard.
         */

        await loadObligations(
            contractId
        );


        setSystemStatus(
            "online",
            "Backend connected"
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        setSystemStatus(
            "error",
            "Backend unavailable"
        );


        renderDashboardError(
            error.message
        );

    }

}


/* =========================================================
   REFRESH
========================================================= */

async function refreshDashboard() {

    const contractId =
        currentContract?.id ||
        currentContract?.contract_id ||
        dashboardData?.contract?.id ||
        getActiveContractId();


    await loadDashboard(
        Number(contractId)
    );

}


/* =========================================================
   MAIN RENDER
========================================================= */

function renderDashboard() {

    if (
        !dashboardData
    ) {

        return;

    }


    renderContractHeader();

    renderRiskSummary();

    renderOverallRisk();

    renderRiskChart();

    renderTopRisks();

    renderTraceability();

    renderMissingAmbiguous();

    renderComparison();

}


/* =========================================================
   CONTRACT HEADER
========================================================= */

function renderContractHeader() {

    const contract =
        dashboardData.contract ||
        {};


    const name =
        contract.name ||
        contract.contract_name ||
        localStorage.getItem(
            "activeContractName"
        ) ||
        "Unknown Contract";


    const version =
        contract.version ??
        contract.version_number ??
        1;


    const fileName =
        contract.file_name ||
        contract.filename ||
        localStorage.getItem(
            "activeContractFile"
        ) ||
        "Contract document";


    setText(
        "contractName",
        name
    );


    setText(
        "contractMeta",
        `${fileName} • Version ${version}`
    );


    const versionBadge =
        document.querySelector(
            ".version-badge"
        );


    if (
        versionBadge
    ) {

        versionBadge.textContent =
            `V${version}`;

    }

}


/* =========================================================
   SUMMARY
========================================================= */

function getRiskSummary() {

    return (
        dashboardData?.summary ||
        dashboardData?.risk_summary ||
        dashboardData?.riskSummary ||
        {}
    );

}


function getNumber(
    object,
    ...keys
) {

    if (
        !object
    ) {

        return 0;

    }


    for (
        const key of keys
    ) {

        if (
            object[key] !== undefined &&
            object[key] !== null
        ) {

            const value =
                Number(
                    object[key]
                );


            if (
                !Number.isNaN(value)
            ) {

                return value;

            }

        }

    }


    return 0;

}


/* =========================================================
   RISK SUMMARY CARDS
========================================================= */

function renderRiskSummary() {

    const summary =
        getRiskSummary();


    const highRisk =
        getNumber(
            summary,
            "high_risk",
            "highRisk",
            "high"
        );


    const risky =
        getNumber(
            summary,
            "risky",
            "risky_findings",
            "riskyFindings"
        );


    const standard =
        getNumber(
            summary,
            "standard",
            "standard_findings",
            "standardFindings"
        );


    const ambiguous =
        getNumber(
            summary,
            "ambiguous",
            "ambiguous_findings",
            "ambiguousFindings"
        );


    const missing =
        getNumber(
            summary,
            "missing",
            "missing_findings",
            "missingFindings"
        );


    setText(
        "highRisk",
        highRisk
    );


    setText(
        "riskyFindings",
        risky
    );


    setText(
        "standardFindings",
        standard
    );


    setText(
        "ambiguousFindings",
        ambiguous
    );


    setText(
        "missingFindings",
        missing
    );


    const findings =
        getFindings();


    const priorityCount =
        findings.filter(
            finding => {

                const status =
                    String(
                        finding.status ||
                        ""
                    ).toUpperCase();


                const severity =
                    String(
                        finding.severity ||
                        ""
                    ).toUpperCase();


                return (
                    status === "RISKY" ||
                    severity === "HIGH"
                );

            }
        ).length;


    setText(
        "riskCount",
        priorityCount
    );

}


/* =========================================================
   OVERALL RISK
========================================================= */

function renderOverallRisk() {

    const summary =
        getRiskSummary();


    const highRisk =
        getNumber(
            summary,
            "high_risk",
            "highRisk"
        );


    const risky =
        getNumber(
            summary,
            "risky",
            "risky_findings"
        );


    const standard =
        getNumber(
            summary,
            "standard",
            "standard_findings"
        );


    const ambiguous =
        getNumber(
            summary,
            "ambiguous",
            "ambiguous_findings"
        );


    const missing =
        getNumber(
            summary,
            "missing",
            "missing_findings"
        );


    /*
     * Weighted risk score:
     *
     * HIGH       = 3
     * RISKY      = 2
     * AMBIGUOUS  = 1
     * STANDARD   = 0
     * MISSING    = 0
     */

    const riskPoints =
        (
            highRisk * 3
        ) +
        (
            risky * 2
        ) +
        ambiguous;


    const totalFindings =
        highRisk +
        risky +
        standard +
        ambiguous +
        missing;


    const maxPoints =
        totalFindings * 3;


    const percentage =
        maxPoints > 0
            ? Math.round(
                (
                    riskPoints /
                    maxPoints
                ) * 100
            )
            : 0;


    const indicator =
        document.getElementById(
            "riskIndicator"
        );


    const progress =
        document.getElementById(
            "riskProgress"
        );


    if (
        indicator
    ) {

        indicator.classList.remove(
            "risk-high",
            "risk-medium",
            "risk-low"
        );


        if (
            highRisk > 0
        ) {

            indicator.classList.add(
                "risk-high"
            );


            indicator.textContent =
                "HIGH";

        } else if (
            risky > 0 ||
            ambiguous > 0 ||
            missing > 0
        ) {

            indicator.classList.add(
                "risk-medium"
            );


            indicator.textContent =
                "REVIEW";

        } else {

            indicator.classList.add(
                "risk-low"
            );


            indicator.textContent =
                "LOW";

        }

    }


    setText(
        "riskPoints",
        riskPoints
    );


    if (
        progress
    ) {

        progress.style.width =
            `${Math.min(
                percentage,
                100
            )}%`;

    }

}


/* =========================================================
   FINDINGS
========================================================= */

function getFindings() {

    if (
        Array.isArray(
            dashboardData?.findings
        )
    ) {

        return dashboardData.findings;

    }


    if (
        Array.isArray(
            dashboardData?.top_risks
        )
    ) {

        return dashboardData.top_risks;

    }


    if (
        Array.isArray(
            dashboardData?.risks
        )
    ) {

        return dashboardData.risks;

    }


    return [];

}


/* =========================================================
   RISK CHART
========================================================= */

function renderRiskChart() {

    const canvas =
        document.getElementById(
            "riskChart"
        );


    if (
        !canvas
    ) {

        return;

    }


    if (
        typeof Chart === "undefined"
    ) {

        console.warn(
            "Chart.js is not loaded."
        );

        return;

    }


    const summary =
        getRiskSummary();


    const highRisk =
        getNumber(
            summary,
            "high_risk",
            "highRisk"
        );


    const risky =
        getNumber(
            summary,
            "risky",
            "risky_findings"
        );


    const standard =
        getNumber(
            summary,
            "standard",
            "standard_findings"
        );


    const ambiguous =
        getNumber(
            summary,
            "ambiguous",
            "ambiguous_findings"
        );


    const missing =
        getNumber(
            summary,
            "missing",
            "missing_findings"
        );


    if (
        riskChart
    ) {

        riskChart.destroy();

    }


    riskChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "doughnut",

                data: {

                    labels: [
                        "High Risk",
                        "Risky",
                        "Standard",
                        "Ambiguous",
                        "Missing"
                    ],

                    datasets: [
                        {
                            data: [
                                highRisk,
                                risky,
                                standard,
                                ambiguous,
                                missing
                            ],

                            backgroundColor: [
                                "#ef4444",
                                "#f59e0b",
                                "#27d17f",
                                "#8b5cf6",
                                "#64748b"
                            ],

                            borderWidth: 0
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "72%",

                    plugins: {

                        legend: {
                            display: false
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
        document.getElementById("topRisks");

    if (!container) {
        return;
    }

    const findings = getFindings();

    const priorityFindings =
        findings.filter(finding => {

            const status =
                String(
                    finding.status || ""
                ).toUpperCase();

            const severity =
                String(
                    finding.severity || ""
                ).toUpperCase();

            return (
                status === "RISKY" ||
                severity === "HIGH"
            );
        });

    if (priorityFindings.length === 0) {

        container.innerHTML = `
            <div class="risk-empty-state">

                <strong>
                    No priority risks detected
                </strong>

                <span>
                    No high-severity or risky
                    playbook deviations were found.
                </span>

            </div>
        `;

        return;
    }

    container.innerHTML =
        priorityFindings
            .slice(0, 5)
            .map(finding => {

                const findingId =
                    finding.finding_id ??
                    finding.id;

                const category =
                    escapeHtml(
                        finding.category ||
                        "Risk Finding"
                    );

                const ruleId =
                    escapeHtml(
                        finding.rule_id ||
                        "PLAYBOOK-RULE"
                    );

                const severity =
                    String(
                        finding.severity ||
                        "HIGH"
                    ).toUpperCase();

                const status =
                    String(
                        finding.status ||
                        "RISKY"
                    ).toUpperCase();

                const reason =
                    escapeHtml(
                        finding.reason ||
                        "This finding requires review against the applicable playbook requirement."
                    );

                const actual =
                    escapeHtml(
                        finding.actual ||
                        "Not specified"
                    );

                const expected =
                    escapeHtml(
                        finding.expected ||
                        "Not specified"
                    );

                const evidence =
                    escapeHtml(
                        finding.evidence ||
                        finding.clause_text ||
                        ""
                    );

                return `
                    <article
                        class="risk-intelligence-card"
                    >

                        <div
                            class="risk-card-header"
                        >

                            <div>

                                <span
                                    class="risk-card-category"
                                >
                                    ${category}
                                </span>

                                <span
                                    class="risk-card-rule"
                                >
                                    ${ruleId}
                                </span>

                            </div>

                            <span
                                class="risk-severity ${status.toLowerCase()} ${severity.toLowerCase()}"
                            >
                                ${status}
                            </span>

                        </div>

                        <div
                            class="risk-card-reason"
                        >

                            <span class="risk-card-reason-label">
                                WHY THIS WAS FLAGGED
                            </span>

                            <p>
                                ${reason}
                            </p>

                        </div>

                        ${
                            evidence
                                ? `
                                    <div
                                        class="risk-card-evidence"
                                    >

                                        <span>
                                            CONTRACT EVIDENCE
                                        </span>

                                        <p>
                                            "${evidence}"
                                        </p>

                                    </div>
                                  `
                                : ""
                        }

                        <div
                            class="risk-actual-expected"
                        >

                            <div
                                class="risk-value-box"
                            >

                                <span>
                                    ACTUAL
                                </span>

                                <strong>
                                    ${actual}
                                </strong>

                            </div>

                            <div
                                class="risk-value-box"
                            >

                                <span>
                                    EXPECTED
                                </span>

                                <strong>
                                    ${expected}
                                </strong>

                            </div>

                        </div>

                        <div
                            class="risk-card-footer"
                        >

                            <span>
                                ${status}
                            </span>

                            ${
                                findingId
                                    ? `
                                        <button
                                            type="button"
                                            class="evidence-button"
                                            onclick="openFindingTrace(${Number(findingId)})"
                                        >
                                            View Evidence →
                                        </button>
                                      `
                                    : ""
                            }

                        </div>

                    </article>
                `;

            })
            .join("");
}


/* =========================================================
   TRACEABILITY
========================================================= */

function renderTraceability() {

    const findings =
        getFindings();


    const summary =
        getRiskSummary();


    const total =
        getNumber(
            summary,
            "finding_count",
            "total_findings",
            "findings_count"
        ) ||
        findings.length;


    const traceable =
        findings.filter(
            finding => {

                const id =
                    finding.finding_id ??
                    finding.id;


                const rule =
                    finding.rule_id;


                const evidence =
                    finding.evidence ||
                    finding.clause_text ||
                    finding.reason;


                return (
                    id &&
                    rule &&
                    evidence
                );

            }
        ).length;


    const percentage =
        total > 0
            ? Math.round(
                (
                    traceable /
                    total
                ) * 100
            )
            : 0;


    setText(
        "evidenceCoverage",
        `${percentage}%`
    );


    setText(
        "traceabilityCount",
        `${traceable}/${total} traceable`
    );

}


/* =========================================================
   OPEN FINDING TRACE
========================================================= */

async function openFindingTrace(
    findingId
) {

    if (
        !findingId
    ) {

        return;

    }


    selectedFindingId =
        findingId;


    const panel =
        document.getElementById(
            "tracePanel"
        );


    if (
        !panel
    ) {

        return;

    }


    panel.innerHTML = `

        <div class="trace-empty">

            <div class="trace-icon">
                ...
            </div>

            <h4>
                Loading evidence trace
            </h4>

            <p>
                Retrieving contract evidence
                and playbook rule...
            </p>

        </div>

    `;


    const contractId =
        currentContract?.id ||
        currentContract?.contract_id ||
        dashboardData?.contract?.id ||
        getActiveContractId();


    try {

        const response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/findings/${findingId}/trace`
            );


        const trace =
            await parseResponse(
                response
            );


        if (
            !response.ok
        ) {

            throw new Error(
                extractErrorMessage(
                    trace,
                    `Trace request failed: ${response.status}`
                )
            );

        }


        renderTracePanel(
            trace
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
   TRACE PANEL
========================================================= */

function renderTracePanel(
    trace
) {

    const panel =
        document.getElementById(
            "tracePanel"
        );


    if (
        !panel
    ) {

        return;

    }


    const contract =
        trace.contract ||
        {};


    const finding =
        trace.finding ||
        {};


    const evidence =
        trace.contract_evidence ||
        {};


    const rule =
        trace.playbook_rule ||
        {};


    const assessment =
        trace.assessment ||
        {};


    const severity =
        String(
            finding.severity ||
            "MEDIUM"
        ).toUpperCase();


    const clauseNumber =
        escapeHtml(
            evidence.clause_number ||
            "Clause"
        );


    const clauseTitle =
        escapeHtml(
            evidence.clause_title ||
            ""
        );


    const evidenceText =
        escapeHtml(
            evidence.text ||
            finding.evidence ||
            "No contract evidence available."
        );


    const requirement =
        escapeHtml(
            rule.requirement ||
            finding.expected ||
            "No playbook requirement available."
        );


    const actual =
        escapeHtml(
            assessment.actual ||
            finding.actual ||
            "Not specified"
        );


    const expected =
        escapeHtml(
            assessment.expected ||
            finding.expected ||
            "Not specified"
        );


    const reason =
        escapeHtml(
            assessment.reason ||
            finding.reason ||
            "The contract clause does not satisfy the applicable playbook requirement."
        );


    const action =
        escapeHtml(
            assessment.recommended_action ||
            finding.recommended_action ||
            "Review and amend the clause to satisfy the applicable playbook requirement."
        );


    panel.innerHTML = `

        <div class="trace-header">

            <div>

                <span
                    class="trace-grounded-badge"
                >
                    ✓ SOURCE GROUNDED
                </span>


                <h3>
                    ${escapeHtml(
                        finding.category ||
                        "Risk Finding"
                    )}
                </h3>


                <p>
                    ${escapeHtml(
                        contract.name ||
                        contract.contract_name ||
                        "Contract"
                    )}

                    • V${escapeHtml(
                        contract.version ??
                        contract.version_number ??
                        1
                    )}
                </p>

            </div>


            <span
                class="trace-severity ${severity.toLowerCase()}"
            >
                ${severity}
            </span>

        </div>


        <!-- STEP 01 -->

        <div class="trace-step">

            <div class="trace-step-marker">
                01
            </div>


            <div class="trace-step-content">

                <span class="trace-step-label">
                    CONTRACT EVIDENCE
                </span>


                <h4
                    class="trace-clause-title"
                >
                    ${clauseNumber}
                    ${clauseTitle}
                </h4>


                <div
                    class="evidence-quote"
                >
                    "${evidenceText}"
                </div>

            </div>

        </div>


        <!-- STEP 02 -->

        <div class="trace-step">

            <div class="trace-step-marker">
                02
            </div>


            <div class="trace-step-content">

                <span class="trace-step-label">
                    PLAYBOOK RULE
                </span>


                <div
                    class="rule-id-badge"
                >
                    ${escapeHtml(
                        rule.rule_id ||
                        finding.rule_id ||
                        "PLAYBOOK-RULE"
                    )}
                </div>


                <div
                    class="playbook-requirement"
                >
                    ${requirement}
                </div>

            </div>

        </div>


        <!-- STEP 03 -->

        <div class="trace-step">

            <div class="trace-step-marker">
                03
            </div>


            <div class="trace-step-content">

                <span class="trace-step-label">
                    ASSESSMENT
                </span>


                <div
                    class="assessment-grid"
                >

                    <div
                        class="assessment-field"
                    >

                        <span>
                            ACTUAL
                        </span>

                        <strong>
                            ${actual}
                        </strong>

                    </div>


                    <div
                        class="assessment-field"
                    >

                        <span>
                            EXPECTED
                        </span>

                        <strong>
                            ${expected}
                        </strong>

                    </div>

                </div>


                <div
                    class="assessment-reason"
                >

                    <span>
                        WHY THIS WAS FLAGGED
                    </span>

                    <p>
                        ${reason}
                    </p>

                </div>

            </div>

        </div>


        <!-- STEP 04 -->

        <div class="trace-step">

            <div class="trace-step-marker">
                04
            </div>


            <div class="trace-step-content">

                <span class="trace-step-label">
                    RECOMMENDED ACTION
                </span>


                <div
                    class="recommended-action"
                >
                    ${action}
                </div>

            </div>

        </div>


        <div
            class="trace-verification"
        >

            <span>
                ✓ TRACEABILITY VERIFIED
            </span>


            <p>
                Finding
                ${escapeHtml(
                    finding.id ||
                    selectedFindingId ||
                    ""
                )}
                is connected to contract evidence
                and the applicable playbook rule.
            </p>

        </div>

    `;

}


/* =========================================================
   OBLIGATIONS
========================================================= */

async function loadObligations(
    contractId
) {

    try {

        const response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/obligations`,
                {
                    method: "POST"
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            !response.ok
        ) {

            throw new Error(
                extractErrorMessage(
                    data,
                    `Obligation extraction failed: ${response.status}`
                )
            );

        }


        dashboardData.obligations =
            data.obligations ||
            data.items ||
            data.results ||
            [];


        renderObligations();


    } catch (error) {

        console.warn(
            "Obligation extraction error:",
            error
        );


        dashboardData.obligations =
            dashboardData.obligations ||
            [];


        renderObligations();

    }

}


/* =========================================================
   RENDER OBLIGATIONS
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


    if (
        !container
    ) {

        return;

    }


    const obligations =
        dashboardData?.obligations ||
        [];


    if (
        count
    ) {

        count.textContent =
            obligations.length;

    }


    if (
        obligations.length === 0
    ) {

        container.innerHTML = `

            <div
                class="obligation-empty-state"
            >

                <div
                    class="obligation-empty-icon"
                >
                    ✓
                </div>


                <strong>
                    No obligations detected
                </strong>


                <span>
                    No actionable contractual
                    obligations were extracted
                    from this version.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML =
        obligations
            .map(
                (
                    obligation,
                    index
                ) => {

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
                            : "Not specified";


                    const trigger =
                        obligation.trigger_condition
                            ? escapeHtml(
                                obligation.trigger_condition
                            )
                            : "Not specified";


                    const evidence =
                        escapeHtml(
                            obligation.evidence ||
                            "No source evidence available."
                        );


                    const clauseNumber =
                        escapeHtml(
                            obligation.clause_number ||
                            obligation.clause_id ||
                            "—"
                        );


                    const clauseTitle =
                        escapeHtml(
                            obligation.clause_title ||
                            "Source clause"
                        );


                    return `

                        <article
                            class="obligation-intelligence-card"
                        >

                            <div
                                class="obligation-card-header"
                            >

                                <div
                                    class="obligation-number"
                                >
                                    ${String(
                                        index + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}
                                </div>


                                <div
                                    class="obligation-party"
                                >

                                    <span
                                        class="obligation-label"
                                    >
                                        RESPONSIBLE PARTY
                                    </span>


                                    <strong>
                                        ${actor}
                                    </strong>

                                </div>


                                <span
                                    class="obligation-source-badge"
                                >
                                    ✓ SOURCE LINKED
                                </span>

                            </div>


                            <div
                                class="obligation-main"
                            >

                                <span
                                    class="obligation-label"
                                >
                                    OBLIGATION
                                </span>


                                <h4>
                                    ${action}
                                </h4>

                            </div>


                            <div
                                class="obligation-detail-grid"
                            >

                                <div
                                    class="obligation-detail"
                                >

                                    <span>
                                        DEADLINE
                                    </span>

                                    <strong>
                                        ${deadline}
                                    </strong>

                                </div>


                                <div
                                    class="obligation-detail"
                                >

                                    <span>
                                        TRIGGER
                                    </span>

                                    <strong>
                                        ${trigger}
                                    </strong>

                                </div>

                            </div>


                            <div
                                class="obligation-source"
                            >

                                <div
                                    class="obligation-source-header"
                                >

                                    <span>
                                        SOURCE EVIDENCE
                                    </span>


                                    <small>
                                        CLAUSE
                                        ${clauseNumber}
                                        •
                                        ${clauseTitle}
                                    </small>

                                </div>


                                <p>
                                    "${evidence}"
                                </p>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   MISSING / AMBIGUOUS
========================================================= */

function renderMissingAmbiguous() {

    /*
     * Reserved for the dedicated
     * missing/ambiguous UI.
     *
     * The current dashboard already
     * displays these values in the
     * summary cards.
     */

}


/* =========================================================
   VERSION COMPARISON
========================================================= */

async function renderComparison() {

    const container =
        document.getElementById(
            "comparison"
        );


    if (
        !container
    ) {

        return;

    }


    const contractId =
        currentContract?.id ||
        currentContract?.contract_id ||
        dashboardData?.contract?.id ||
        getActiveContractId();


    if (
        !contractId
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/risk-comparison`
            );


        const data =
            await parseResponse(
                response
            );


        if (
            !response.ok
        ) {

            throw new Error(
                extractErrorMessage(
                    data,
                    "Comparison unavailable"
                )
            );

        }


        renderComparisonContent(
            container,
            data
        );


    } catch (error) {

        console.info(
            "Comparison preview unavailable:",
            error.message
        );


        /*
         * Do not replace the existing
         * comparison UI with an error.
         *
         * The full comparison page
         * can still be opened.
         */

    }

}


/* =========================================================
   COMPARISON CONTENT
========================================================= */

function renderComparisonContent(
    container,
    data
) {

    const comparison =
        data.comparison ||
        data;


    const v1 =
        comparison.v1 ||
        comparison.version_1 ||
        comparison.version1 ||
        {};


    const v2 =
        comparison.v2 ||
        comparison.version_2 ||
        comparison.version2 ||
        {};


    const reduced =
        getNumber(
            comparison,
            "risks_reduced",
            "risk_reduced",
            "riskReduced"
        );


    const increased =
        getNumber(
            comparison,
            "risks_increased",
            "risk_increased",
            "riskIncreased"
        );


    const unchanged =
        getNumber(
            comparison,
            "unchanged",
            "no_material_change",
            "noMaterialChange"
        );


    const resolved =
        getNumber(
            comparison,
            "risks_resolved",
            "risk_resolved"
        );


    const newRisks =
        getNumber(
            comparison,
            "new_risks",
            "newRisks"
        );


    const net =
        getNumber(
            comparison,
            "net_risk_improvement",
            "netRiskImprovement"
        );


    const regression =
        Boolean(
            comparison.risk_regression ??
            comparison.riskRegression ??
            false
        );


    container.innerHTML = `

        <div
            class="comparison-summary"
        >

            <div>

                <span>
                    VERSION 1
                </span>


                <strong>
                    ${escapeHtml(
                        v1.name ||
                        v1.contract_name ||
                        v1.file_name ||
                        "V1"
                    )}
                </strong>

            </div>


            <div
                class="comparison-arrow"
            >
                →
            </div>


            <div>

                <span>
                    VERSION 2
                </span>


                <strong>
                    ${escapeHtml(
                        v2.name ||
                        v2.contract_name ||
                        v2.file_name ||
                        "V2"
                    )}
                </strong>

            </div>

        </div>


        <div
            class="comparison-results"
        >

            <div
                class="comparison-result reduced"
            >

                <span>
                    RISK REDUCED
                </span>

                <strong>
                    ${reduced}
                </strong>

            </div>


            <div
                class="comparison-result increased"
            >

                <span>
                    RISK INCREASED
                </span>

                <strong>
                    ${increased}
                </strong>

            </div>


            <div
                class="comparison-result unchanged"
            >

                <span>
                    NO MATERIAL CHANGE
                </span>

                <strong>
                    ${unchanged}
                </strong>

            </div>


            <div
                class="comparison-result improvement"
            >

                <span>
                    NET RISK IMPACT
                </span>

                <strong>
                    ${net >= 0 ? "+" : ""}
                    ${net}
                </strong>

            </div>

        </div>


        <div
            class="comparison-extra"
        >

            <span>
                RISKS RESOLVED
            </span>

            <strong>
                ${resolved}
            </strong>


            <span>
                NEW RISKS
            </span>

            <strong>
                ${newRisks}
            </strong>


            <span>
                REGRESSION
            </span>

            <strong
                class="${regression ? "bad" : "good"}"
            >
                ${regression ? "YES" : "NO"}
            </strong>

        </div>

    `;

}


/* =========================================================
   ANALYZE CURRENT CONTRACT
========================================================= */

async function analyzeCurrentContract(
    contractId = getActiveContractId()
) {

    contractId =
        Number(contractId);


    if (
        !contractId
    ) {

        showToast(
            "Contract ID is required."
        );

        return;

    }


    setSystemStatus(
        "loading",
        "Analyzing contract..."
    );


    try {

        const response =
            await fetch(
                `${API_BASE}/contracts/${contractId}/analyze`,
                {
                    method: "POST"
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            !response.ok
        ) {

            throw new Error(
                extractErrorMessage(
                    data,
                    `Analysis failed: ${response.status}`
                )
            );

        }


        /*
         * Extract obligations after
         * successful analysis.
         */

        try {

            await fetch(
                `${API_BASE}/contracts/${contractId}/obligations`,
                {
                    method: "POST"
                }
            );

        } catch (
            obligationError
        ) {

            console.warn(
                "Obligation extraction failed:",
                obligationError
            );

        }


        localStorage.setItem(
            "activeContractId",
            String(contractId)
        );


        await loadDashboard(
            contractId
        );


        showToast(
            "Contract analyzed successfully."
        );


    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        setSystemStatus(
            "error",
            "Analysis failed"
        );


        showToast(
            error.message
        );

    }

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
        "ambiguousFindings",
        "—"
    );


    setText(
        "missingFindings",
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


    setText(
        "evidenceCoverage",
        "—"
    );


    setText(
        "traceabilityCount",
        "—"
    );

}


/* =========================================================
   ERROR STATE
========================================================= */

function renderDashboardError(
    message
) {

    setText(
        "contractName",
        "Unable to load contract"
    );


    setText(
        "contractMeta",
        message
    );


    const topRisks =
        document.getElementById(
            "topRisks"
        );


    if (
        topRisks
    ) {

        topRisks.innerHTML = `

            <div
                class="risk-empty-state"
            >

                <strong>
                    Backend connection failed
                </strong>


                <span>
                    ${escapeHtml(
                        message
                    )}
                </span>


                <button
                    type="button"
                    class="view-evidence"
                    onclick="refreshDashboard()"
                >
                    Try Again →
                </button>

            </div>

        `;

    }


    const obligations =
        document.getElementById(
            "obligations"
        );


    if (
        obligations
    ) {

        obligations.innerHTML = `

            <div
                class="obligation-empty-state"
            >

                <strong>
                    Contract data unavailable
                </strong>


                <span>
                    ${escapeHtml(
                        message
                    )}
                </span>

            </div>

        `;

    }

}


/* =========================================================
   SYSTEM STATUS
========================================================= */

function setSystemStatus(
    type,
    message
) {

    const status =
        document.getElementById(
            "systemStatus"
        );


    const statusText =
        document.getElementById(
            "systemStatusText"
        );


    const statusTitle =
        document.getElementById(
            "systemStatusTitle"
        );


    const statusContainer =
        status?.closest(
            ".system-status"
        );


    if (
        statusContainer
    ) {

        statusContainer.classList.remove(
            "online",
            "loading",
            "error"
        );


        statusContainer.classList.add(
            type
        );

    }


    if (
        status
    ) {

        if (
            type === "online"
        ) {

            status.textContent =
                "System Online";

        } else if (
            type === "loading"
        ) {

            status.textContent =
                "Processing";

        } else {

            status.textContent =
                "System Error";

        }

    }


    if (
        statusTitle
    ) {

        if (
            type === "online"
        ) {

            statusTitle.textContent =
                "System Online";

        } else if (
            type === "loading"
        ) {

            statusTitle.textContent =
                "Processing";

        } else {

            statusTitle.textContent =
                "System Error";

        }

    }


    if (
        statusText
    ) {

        statusText.textContent =
            message;

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message
) {

    let toast =
        document.getElementById(
            "appToast"
        );


    if (
        !toast
    ) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "appToast";


        toast.className =
            "app-toast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "visible"
    );


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "visible"
                );

            },
            3000
        );

}


/* =========================================================
   RESPONSE PARSER
========================================================= */

async function parseResponse(
    response
) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        return await response.json();

    }


    const text =
        await response.text();


    return {
        message: text
    };

}


/* =========================================================
   ERROR EXTRACTION
========================================================= */

function extractErrorMessage(
    data,
    fallback
) {

    if (
        !data
    ) {

        return fallback;

    }


    if (
        typeof data === "string"
    ) {

        return data ||
            fallback;

    }


    if (
        typeof data.detail === "string"
    ) {

        return data.detail;

    }


    if (
        Array.isArray(
            data.detail
        )
    ) {

        return data.detail
            .map(
                item =>
                    item.msg ||
                    item.message ||
                    String(item)
            )
            .join(", ");

    }


    if (
        typeof data.message === "string"
    ) {

        return data.message;

    }


    if (
        typeof data.error === "string"
    ) {

        return data.error;

    }


    return fallback;

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


    if (
        element
    ) {

        element.textContent =
            value ??
            "—";

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
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.loadDashboard =
    loadDashboard;


window.refreshDashboard =
    refreshDashboard;


window.openFindingTrace =
    openFindingTrace;


window.analyzeCurrentContract =
    analyzeCurrentContract;


/*
 * Backward compatibility with
 * existing HTML buttons.
 */

window.loadContract =
    loadDashboard;


window.renderObligations =
    renderObligations;


window.getActiveContractId =
    getActiveContractId;