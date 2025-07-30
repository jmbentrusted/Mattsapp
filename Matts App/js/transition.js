// js/transition.js
import { db, doc, getDoc, updateDoc, setDoc } from '../firebase-config.js';
import * as UI from './ui.js';

const PLAN_ID = 'main_transition_plan'; // Using a single document for the plan

/**
 * Contains the complete, correct, and protected default data for the transition plan.
 * This function serves as the single source of truth and is used to create or repair the plan in the database.
 */
async function getDefaultPlanData() {
    return {
        title: "Matt's 6-Week Transition Plan",
        weeks: {
            week1: {
                title: 'Week 1',
                focus: 'Foundation & Project Kick-off',
                actionItems: [
                    { text: 'Get Google Calendar access for team schedules.', completed: false },
                    { text: 'Schedule initial one-on-ones with Jacob, Hardie, and Chandler.', completed: false },
                    { text: 'Begin Project: Create tracking spreadsheet for March-July jobs with outstanding payment issues.', completed: false },
                    { text: 'Begin Project: Build a system/spreadsheet for tracking trainee progress and development milestones.', completed: false },
                ],
                learningFocus: [
                    'Admin Tasks: Learn how to track performance metrics and ensure daily operational reports are accurate.',
                    'Team Development: Understand how to prepare high-performing Level 2s for future leadership roles.',
                ],
            },
            week2: {
                title: 'Week 2',
                focus: 'Technical Immersion & Strategic Planning',
                actionItems: [
                    { text: 'Complete 3-day IICRC Water Damage Certification course.', completed: false },
                    { text: 'Conduct all initial one-on-one meetings with the team.', completed: false },
                    { text: 'Create Execution Plan: Finalize a detailed plan to resolve all outstanding job issues within 6 weeks.', completed: false },
                    { text: 'Create Execution Plan: Formalize the trainee tracking system and set a schedule for regular follow-ups.', completed: false },
                ],
                learningFocus: [
                   'Mit Tech Fulfillment: Learn to audit work quality, ensuring consistency in service delivery based on IICRC standards.',
                   'Planning: Develop skills in creating daily and weekly work schedules for Level 2s and Mit Techs.',
                ],
            },
            week3: {
                title: 'Week 3',
                focus: 'Mastering Morning Operations',
                actionItems: [
                    { text: 'Take ownership of running the daily morning huddle.', completed: false },
                    { text: 'Take over daily truck inspections and learn equipment requirements.', completed: false },
                    { text: 'Get hands-on training on the DPT system.', completed: false },
                    { text: 'Conduct a ride-along with the Second Shift Lead.', completed: false },
                ],
                learningFocus: [
                    'Customer Communication (Advanced): Learn to address critical customer service concerns and handle escalations.',
                   'Safety & Compliance: Take responsibility for ensuring adherence to safety regulations at an operational level.',
                ],
            },
            week4: {
                title: 'Week 4',
                focus: 'Routing & Cross-Departmental Insights',
                actionItems: [
                    { text: 'Take full ownership of the morning routing calls.', completed: false },
                    { text: 'Understand and apply capacity planning for the 260 job goal.', completed: false },
                    { text: "Launch the 'Floor Demo Cost Analysis' project.", completed: false },
                    { text: 'Conduct a ride-along with the Marketing team.', completed: false },
                ],
                learningFocus: [
                    'Workload & Labor Management: Learn to handle daily operational challenges and ensure the right workload distribution.',
                    'Performance Management: Begin to review and address performance trends for Level 2s and their teams.',
                ],
            },
            week5: {
                title: 'Week 5',
                focus: 'Team Growth & Process Improvement',
                actionItems: [
                    { text: 'Establish a recurring weekly one-on-one schedule with the team.', completed: false },
                    { text: 'Begin developing formal development plans for each Level 2.', completed: false },
                    { text: 'Begin documenting and prioritizing process improvement opportunities.', completed: false },
                    { text: 'Conduct a ride-along with the Sales team.', completed: false },
                ],
                 learningFocus: [
                    'Internal Communication: Learn to communicate effectively with upper management and internal teams to solve problems.',
                    'Strategic Oversight: Practice ensuring that all established processes are being followed consistently by the team.',
                ],
            },
            week6: {
                title: 'Week 6',
                focus: 'Full Independence & Optimization',
                actionItems: [
                    { text: 'Operate with full responsibility and minimal supervision.', completed: false },
                    { text: "Present findings from the 'Outstanding Jobs' and 'Floor Demo' projects.", completed: false },
                    { text: 'Identify additional areas for team and process optimization.', completed: false },
                ],
                 learningFocus: [
                    'Labor Spend Management: Demonstrate the ability to manage labor spend effectively, optimizing team resources and time.',
                    'Leadership: Solidify the ability to develop Level 2s into strong leaders who effectively manage Mit Techs.',
                ],
            },
        }
    };
}

export async function loadTransitionPlan() {
    const container = document.getElementById('transition');
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 40px;">Loading Transition Plan...</div>`;

    try {
        const docRef = doc(db, 'transitionPlans', PLAN_ID);
        let docSnap = await getDoc(docRef);
        let planData = docSnap.exists() ? docSnap.data() : null;

        // **DEFINITIVE DATA CORRUPTION CHECK**
        // If the plan doesn't exist, is empty, or is missing essential data (like week1),
        // we treat it as corrupt and force a rewrite from the default template.
        if (!planData || !planData.weeks || !planData.weeks.week1) {
            console.warn("Transition plan data is missing or corrupt. Forcing a rewrite from default template.");
            const defaultPlan = await getDefaultPlanData();
            await setDoc(docRef, defaultPlan); // Use setDoc to overwrite any bad data.
            docSnap = await getDoc(docRef); // Re-fetch the newly created/repaired plan
            planData = docSnap.data();
        }
        
        renderPlan(container, planData);

    } catch (error) {
        console.error("Error loading transition plan: ", error);
        container.innerHTML = `<div style="text-align: center; color: var(--error-red);">Error loading plan. Please check the console.</div>`;
    }
}

function renderPlan(container, planData) {
    let weeklyCardsHtml = '';
    if (planData && planData.weeks) {
        // Sort the weeks by the number in their key to guarantee correct order.
        const sortedWeeks = Object.entries(planData.weeks).sort((a, b) => {
            const weekNumA = parseInt(a[0].replace('week', ''), 10);
            const weekNumB = parseInt(b[0].replace('week', ''), 10);
            return weekNumA - weekNumB;
        });

        weeklyCardsHtml = sortedWeeks.map(([weekId, weekData]) => `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">${weekData.title}</div>
                    <div class="card-focus">${weekData.focus}</div>
                </div>
                <div class="content-section">
                    <h4>Action Items</h4>
                    <ul class="task-list action-items-list" data-week="${weekId}" data-type="actions">
                        ${renderActionItems(weekData.actionItems)}
                    </ul>
                </div>
                <div class="content-section">
                    <h4>Learning Focus</h4>
                    <ul class="task-list" data-week="${weekId}" data-type="learning">
                        ${renderLearningFocusItems(weekData.learningFocus)}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    container.innerHTML = `<div class="plan-grid">${weeklyCardsHtml}</div>`;
    setupEventListeners(container);
}

function renderActionItems(items) {
    if (!Array.isArray(items) || items.length === 0) return '<li>No action items listed.</li>';
    
    return items.map((item, index) => `
        <li data-index="${index}">
            <div class="task-item-container">
                <input type="checkbox" class="action-item-checkbox" ${item.completed ? 'checked' : ''}>
                <span class="task-text ${item.completed ? 'completed-text' : ''}" contenteditable="true">${item.text}</span>
            </div>
        </li>
    `).join('');
}

function renderLearningFocusItems(items) {
    if (!Array.isArray(items) || items.length === 0) return '<li>No learning focus items listed.</li>';

    return items.map((item, index) => `
        <li data-index="${index}" contenteditable="true">${item}</li>
    `).join('');
}


function setupEventListeners(container) {
    container.addEventListener('focusout', (e) => {
        const target = e.target;
        if (target.matches('.task-text') || target.matches('.task-list[data-type="learning"] li')) {
             saveTextChange(target);
        }
    });

    container.addEventListener('change', async (e) => {
        if (e.target.matches('.action-item-checkbox')) {
            await saveCheckboxState(e.target);
        }
    });
}

async function saveCheckboxState(checkbox) {
    const li = checkbox.closest('li');
    const list = li.closest('ul');
    const textSpan = li.querySelector('.task-text');
    
    const weekId = list.dataset.week;
    const index = parseInt(li.dataset.index, 10);
    const isCompleted = checkbox.checked;

    textSpan.classList.toggle('completed-text', isCompleted);

    const docRef = doc(db, 'transitionPlans', PLAN_ID);
    const fieldPath = `weeks.${weekId}.actionItems.${index}.completed`;
    
    try {
        await updateDoc(docRef, { [fieldPath]: isCompleted });
    } catch (error) {
        console.error("Error saving checkbox state: ", error);
        alert("Could not save completion status. Please refresh and try again.");
    }
}

async function saveTextChange(element) {
    const li = element.closest('li');
    const list = li.closest('ul');

    const weekId = list.dataset.week;
    const type = list.dataset.type; // "actions" or "learning"
    const index = parseInt(li.dataset.index, 10);
    const newText = element.textContent;

    const docRef = doc(db, 'transitionPlans', PLAN_ID);
    // Construct the correct path in the database based on the type of item
    const fieldPath = type === 'actions' 
        ? `weeks.${weekId}.actionItems.${index}.text` 
        : `weeks.${weekId}.learningFocus.${index}`;

    try {
        await updateDoc(docRef, { [fieldPath]: newText });
    } catch (error) {
        console.error("Error saving text change: ", error);
        alert("Could not save text changes. Please refresh and try again.");
    }
}