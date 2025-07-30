// js/training.js
import { db, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where } from '../firebase-config.js';
import * as UI from './ui.js';

let currentFilter = 'active';

const initialPlanStructure = [
    { week: 'Orientation', completed: false }, { week: 'Week 1', completed: false },
    { week: 'Week 2', completed: false }, { week: 'Week 3', completed: false },
    { week: 'Week 4', completed: false }, { week: 'Week 5', completed: false },
];

export async function loadTraining() {
    const container = document.getElementById('training');
    container.innerHTML = `
        <div class="tab-header">
            <h2 class="section-title">Technician Training Plans</h2>
            <button class="btn btn-primary" onclick="Training.addTrainingPlan()">+ New Training Plan</button>
        </div>
        <div class="sub-nav" id="trainingSubNav">
            <button class="sub-tab active" data-filter="active">Active</button>
            <button class="sub-tab" data-filter="completed">Completed</button>
        </div>
        <div class="table-container">
            <table class="data-table" id="trainingTable">
                <thead>
                    <tr>
                        <th>Trainee</th>
                        <th>Lead</th>
                        <th style="width: 150px;">Progress</th>
                        <th>Target End Date</th>
                        <th class="text-center">Orientation</th>
                        <th class="text-center">Wk 1</th>
                        <th class="text-center">Wk 2</th>
                        <th class="text-center">Wk 3</th>
                        <th class="text-center">Wk 4</th>
                        <th class="text-center">Wk 5</th>
                        <th class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('trainingSubNav').addEventListener('click', (e) => {
        if (e.target.matches('.sub-tab')) {
            currentFilter = e.target.dataset.filter;
            document.querySelectorAll('#trainingSubNav .sub-tab').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            renderTrainingPlans();
        }
    });
    
    renderTrainingPlans();
}

async function renderTrainingPlans() {
    const tbody = document.querySelector('#trainingTable tbody');
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 40px;">Loading Training Plans...</td></tr>';
    
    try {
        const q = query(collection(db, 'training'), where('status', '==', currentFilter));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 40px;">No ${currentFilter} training plans.</td></tr>`;
            return;
        }

        let html = '';
        querySnapshot.forEach(doc => {
            const plan = { id: doc.id, ...doc.data() };
            const completedCount = plan.plan.filter(item => item.completed).length;
            const progressPercentage = plan.plan.length > 0 ? (completedCount / plan.plan.length) * 100 : 0;
            const targetEndDate = new Date(plan.targetEndDate);

            const weeklyCheckboxes = plan.plan.map((item, index) => `
                <td style="text-align: center;">
                    <input type="checkbox" 
                           class="form-check-input" 
                           ${item.completed ? 'checked' : ''} 
                           onclick="Training.toggleWeekComplete('${plan.id}', ${index})">
                </td>
            `).join('');

            html += `
                <tr id="plan-${plan.id}">
                    <td data-label="Trainee"><strong>${plan.trainee}</strong></td>
                    <td data-label="Lead">${plan.midLead}</td>
                    <td data-label="Progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progressPercentage}%;">${Math.round(progressPercentage)}%</div>
                        </div>
                    </td>
                    <td data-label="Target End">${targetEndDate.toLocaleDateString()}</td>
                    ${weeklyCheckboxes}
                    <td data-label="Actions" class="action-buttons" style="justify-content: center;">
                         <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="Training.editTrainingPlan('${plan.id}')">Update</button>
                         ${plan.status === 'active' ? `<button class="icon-btn complete-btn" onclick="Training.completePlan('${plan.id}')" title="Mark Complete"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>` : ''}
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error("Error loading training plans: ", error);
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color: var(--error-red);">Error loading plans. Check console.</td></tr>`;
    }
}

export function addTrainingPlan() {
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 90);
    const formattedDefaultEndDate = defaultEndDate.toISOString().split('T')[0];

    const formHtml = `
        <div class="form-group">
            <label class="form-label">Trainee Name</label>
            <input type="text" name="trainee" class="form-input" required>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Mid-Lead</label>
                <select name="midLead" class="form-select" required>
                    <option value="Jacob">Jacob</option>
                    <option value="Hardy">Hardy</option>
                    <option value="Chandler">Chandler</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Target End Date</label>
                <input type="date" name="targetEndDate" value="${formattedDefaultEndDate}" class="form-input" required>
            </div>
        </div>
        <div class="action-buttons">
            <button type="submit" class="btn btn-primary">Create Plan</button>
        </div>
    `;

    UI.showEditModal('Create New Training Plan', formHtml, async (data) => {
        const newPlan = {
            trainee: data.trainee,
            midLead: data.midLead,
            startDate: new Date().toISOString(),
            targetEndDate: new Date(data.targetEndDate).toISOString(),
            status: 'active',
            plan: initialPlanStructure,
            notes: ''
        };
        await addDoc(collection(db, 'training'), newPlan);
        renderTrainingPlans();
    });
}

export async function editTrainingPlan(id) {
    const docRef = doc(db, 'training', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) { console.error("No such plan!"); return; }
    
    const plan = docSnap.data();
    const formattedEndDate = new Date(plan.targetEndDate).toISOString().split('T')[0];
    
    const checklistHtml = plan.plan.map((item, index) => `
        <div class="form-check">
            <input type="checkbox" name="week_${index}" class="form-check-input" id="edit_${id}_${index}" ${item.completed ? 'checked' : ''}>
            <label for="edit_${id}_${index}" class="form-check-label">${item.week}</label>
        </div>
    `).join('');

    const formHtml = `
        <div class="form-grid">
             <div class="form-group">
                <label class="form-label">Trainee</label>
                <input type="text" name="trainee" class="form-input" value="${plan.trainee}">
            </div>
             <div class="form-group">
                <label class="form-label">Target End Date</label>
                <input type="date" name="targetEndDate" value="${formattedEndDate}" class="form-input" required>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Weekly Progress</label>
            <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                ${checklistHtml}
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea name="notes" class="form-textarea" style="min-height: 150px;">${plan.notes || ''}</textarea>
        </div>
        <div class="action-buttons" style="justify-content: space-between;">
             <button type="button" class="btn btn-danger" onclick="Training.deleteTrainingPlan('${id}')">Delete Plan</button>
             <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
    `;

    UI.showEditModal(`Update Plan for ${plan.trainee}`, formHtml, async (data) => {
        const updatedPlanItems = plan.plan.map((item, index) => ({
            ...item,
            completed: data[`week_${index}`] === 'on'
        }));
        
        await updateDoc(docRef, {
            trainee: data.trainee,
            targetEndDate: new Date(data.targetEndDate).toISOString(),
            notes: data.notes,
            plan: updatedPlanItems
        });
        renderTrainingPlans();
    });
}

export async function toggleWeekComplete(planId, weekIndex) {
    const docRef = doc(db, 'training', planId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const planData = docSnap.data();
        const newPlanArray = [...planData.plan];
        newPlanArray[weekIndex].completed = !newPlanArray[weekIndex].completed;

        await updateDoc(docRef, { plan: newPlanArray });
        
        const completedCount = newPlanArray.filter(item => item.completed).length;
        const progressPercentage = newPlanArray.length > 0 ? (completedCount / newPlanArray.length) * 100 : 0;
        
        const row = document.getElementById(`plan-${planId}`);
        const progressBar = row.querySelector('.progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.textContent = `${Math.round(progressPercentage)}%`;
    }
}

export async function completePlan(id) {
    await updateDoc(doc(db, 'training', id), { status: 'completed' });
    renderTrainingPlans();
}

export function deleteTrainingPlan(id) {
    UI.showConfirmationModal(
        'Delete Training Plan',
        'Are you sure you want to permanently delete this plan?',
        async () => {
            await deleteDoc(doc(db, 'training', id));
            UI.closeModal('editModal');
            renderTrainingPlans();
        }
    );
}

// Make functions globally available
window.Training = {
    loadTraining,
    addTrainingPlan,
    editTrainingPlan,
    toggleWeekComplete,
    completePlan,
    deleteTrainingPlan
};