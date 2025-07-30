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
                    { text: 'Get Google Calendar access for team schedules.', completed: false, targetDate: '' },
                    { text: 'Schedule initial one-on-ones with Jacob, Hardie, and Chandler.', completed: false, targetDate: '' },
                    { text: 'Begin Project: Create tracking spreadsheet for March-July jobs with outstanding payment issues.', completed: false, targetDate: '' },
                    { text: 'Begin Project: Build a system/spreadsheet for tracking trainee progress and development milestones.', completed: false, targetDate: '' },
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
                    { text: 'Complete 3-day IICRC Water Damage Certification course.', completed: false, targetDate: '' },
                    { text: 'Conduct all initial one-on-one meetings with the team.', completed: false, targetDate: '' },
                    { text: 'Create Execution Plan: Finalize a detailed plan to resolve all outstanding job issues within 6 weeks.', completed: false, targetDate: '' },
                    { text: 'Create Execution Plan: Formalize the trainee tracking system and set a schedule for regular follow-ups.', completed: false, targetDate: '' },
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
                    { text: 'Take ownership of running the daily morning huddle.', completed: false, targetDate: '' },
                    { text: 'Take over daily truck inspections and learn equipment requirements.', completed: false, targetDate: '' },
                    { text: 'Get hands-on training on the DPT system.', completed: false, targetDate: '' },
                    { text: 'Conduct a ride-along with the Second Shift Lead.', completed: false, targetDate: '' },
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
                    { text: 'Take full ownership of the morning routing calls.', completed: false, targetDate: '' },
                    { text: 'Understand and apply capacity planning for the 260 job goal.', completed: false, targetDate: '' },
                    { text: "Launch the 'Floor Demo Cost Analysis' project.", completed: false, targetDate: '' },
                    { text: 'Conduct a ride-along with the Marketing team.', completed: false, targetDate: '' },
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
                    { text: 'Establish a recurring weekly one-on-one schedule with the team.', completed: false, targetDate: '' },
                    { text: 'Begin developing formal development plans for each Level 2.', completed: false, targetDate: '' },
                    { text: 'Begin documenting and prioritizing process improvement opportunities.', completed: false, targetDate: '' },
                    { text: 'Conduct a ride-along with the Sales team.', completed: false, targetDate: '' },
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
                    { text: 'Operate with full responsibility and minimal supervision.', completed: false, targetDate: '' },
                    { text: "Present findings from the 'Outstanding Jobs' and 'Floor Demo' projects.", completed: false, targetDate: '' },
                    { text: 'Identify additional areas for team and process optimization.', completed: false, targetDate: '' },
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

        if (!docSnap.exists()) {
            console.log("No transition plan found, creating a new one.");
            const defaultPlan = await getDefaultPlanData();
            await setDoc(docRef, defaultPlan);
            docSnap = await getDoc(docRef);
        }

        const planData = docSnap.data();

        if (!planData || !planData.weeks) {
             console.error("Transition plan data is corrupt. Cannot render plan.");
             container.innerHTML = `<div style="text-align: center; color: var(--error-red);">Error: Transition plan data is corrupt.</div>`;
             return;
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
                    <button class="btn btn-secondary add-action-item-btn" data-week="${weekId}">+ Add Action Item</button>
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
    if (!Array.isArray(items) || items.length === 0) return '';
    
    return items.map((item, index) => `
        <li data-index="${index}" draggable="true">
            <div class="task-item-content">
                <input type="checkbox" class="action-item-checkbox" ${item.completed ? 'checked' : ''}>
                <span class="task-text ${item.completed ? 'completed-text' : ''}" contenteditable="true">${item.text}</span>
            </div>
            <div class="task-item-controls">
                <input type="date" class="action-item-date" value="${item.targetDate || ''}">
                <button class="icon-btn delete-action-item-btn" title="Delete Item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
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
        if (e.target.matches('.action-item-date')) {
            const li = e.target.closest('li');
            const list = li.closest('ul');
            const weekId = list.dataset.week;
            const index = parseInt(li.dataset.index, 10);
            const newDate = e.target.value;
            await saveDateChange(weekId, index, newDate);
        }
    });

    container.addEventListener('click', async (e) => {
        if (e.target.matches('.add-action-item-btn')) {
            const weekId = e.target.dataset.week;
            await addActionItem(weekId);
        }
        const deleteBtn = e.target.closest('.delete-action-item-btn');
        if (deleteBtn) {
            const li = deleteBtn.closest('li');
            const list = li.closest('ul');
            const weekId = list.dataset.week;
            const index = parseInt(li.dataset.index, 10);
            await deleteActionItem(weekId, index);
        }
    });
    
    let draggedItem = null;

    container.addEventListener('dragstart', (e) => {
        if (e.target.matches('li[draggable="true"]')) {
            draggedItem = e.target;
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        }
    });

    container.addEventListener('dragend', (e) => {
        if (draggedItem) {
            setTimeout(() => {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
            }, 0);
        }
    });

    const lists = container.querySelectorAll('.action-items-list');
    lists.forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        list.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (draggedItem) {
                const targetList = e.target.closest('.action-items-list');
                if (targetList) {
                    const afterElement = getDragAfterElement(targetList, e.clientY);
                    if (afterElement == null) {
                        targetList.appendChild(draggedItem);
                    } else {
                        targetList.insertBefore(draggedItem, afterElement);
                    }
                    await updatePlanAfterDrop();
                }
            }
        });
    });
}

async function addActionItem(weekId) {
    const docRef = doc(db, 'transitionPlans', PLAN_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const planData = docSnap.data();
        const newActionItem = { text: 'New Action Item', completed: false, targetDate: '' };
        if (!planData.weeks[weekId].actionItems) {
            planData.weeks[weekId].actionItems = [];
        }
        planData.weeks[weekId].actionItems.push(newActionItem);
        
        await updateDoc(docRef, { weeks: planData.weeks });
        loadTransitionPlan();
    }
}

async function deleteActionItem(weekId, index) {
    if (!confirm('Are you sure you want to delete this action item?')) {
        return;
    }
    
    const docRef = doc(db, 'transitionPlans', PLAN_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const planData = docSnap.data();
        planData.weeks[weekId].actionItems.splice(index, 1);
        
        await updateDoc(docRef, { weeks: planData.weeks });
        loadTransitionPlan();
    }
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

async function saveDateChange(weekId, index, newDate) {
    const docRef = doc(db, 'transitionPlans', PLAN_ID);
    const fieldPath = `weeks.${weekId}.actionItems.${index}.targetDate`;
    
    try {
        await updateDoc(docRef, { [fieldPath]: newDate });
        const dateInput = document.querySelector(`ul[data-week="${weekId}"] li[data-index="${index}"] .action-item-date`);
        dateInput.style.transition = 'background-color 0.3s ease';
        dateInput.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
        setTimeout(() => {
            dateInput.style.backgroundColor = '';
        }, 2000);
    } catch (error) {
        console.error("Error saving date change: ", error);
        alert("Could not save date. Please refresh and try again.");
    }
}

async function saveTextChange(element) {
    const li = element.closest('li');
    const list = li.closest('ul');

    const weekId = list.dataset.week;
    const type = list.dataset.type;
    const index = parseInt(li.dataset.index, 10);
    const newText = element.textContent;

    const docRef = doc(db, 'transitionPlans', PLAN_ID);
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

async function updatePlanAfterDrop() {
    const docRef = doc(db, 'transitionPlans', PLAN_ID);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const newPlanData = { ...docSnap.data() };
    const allLists = document.querySelectorAll('.action-items-list');

    allLists.forEach(list => {
        const weekId = list.dataset.week;
        const items = [];
        list.querySelectorAll('li').forEach(li => {
            const text = li.querySelector('.task-text').textContent;
            const completed = li.querySelector('.action-item-checkbox').checked;
            const targetDate = li.querySelector('.action-item-date').value;
            items.push({ text, completed, targetDate });
        });
        newPlanData.weeks[weekId].actionItems = items;
    });

    await updateDoc(docRef, { weeks: newPlanData.weeks });
    loadTransitionPlan();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}