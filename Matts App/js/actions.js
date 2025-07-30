// js/actions.js
import { db, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, where } from '../firebase-config.js';
import * as UI from './ui.js';

let currentFilter = 'pending';

function setupCategoryInput(modalType) {
    const categorySelect = document.getElementById(`${modalType}ActionCategory`);
    const customCategoryInput = document.getElementById(`${modalType}CustomCategory`);

    categorySelect.addEventListener('change', () => {
        if (categorySelect.value === 'custom') {
            customCategoryInput.style.display = 'block';
            customCategoryInput.setAttribute('required', 'true');
        } else {
            customCategoryInput.style.display = 'none';
            customCategoryInput.removeAttribute('required');
        }
    });
}

export async function loadActions() {
    const container = document.getElementById('actions');
    container.innerHTML = `
        <div id="actionModal" class="modal">
             <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Add New Action Item</h3>
                    <span class="close" onclick="UI.closeModal('actionModal')">&times;</span>
                </div>
                <form id="actionForm">
                    <div class="form-grid">
                        <div class="form-group"><label class="form-label">Title</label><input type="text" id="actionTitle" class="form-input" required></div>
                        <div class="form-group">
                            <label class="form-label">Priority</label>
                            <select id="actionPriority" class="form-select" required><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select id="addActionCategory" class="form-select" required>
                                <option value="">Select Category</option>
                                <option value="Morning Responsibilities">Morning Responsibilities</option>
                                <option value="Major Projects">Major Projects</option>
                                <option value="Team Development">Team Development</option>
                                <option value="Training">Training</option>
                                <option value="Process Improvement">Process Improvement</option>
                                <option value="custom">-- Add Custom --</option>
                            </select>
                            <input type="text" id="addCustomCategory" class="form-input" style="display:none; margin-top:10px;" placeholder="Enter custom category">
                        </div>
                        <div class="form-group"><label class="form-label">Due Date</label><input type="date" id="actionDueDate" class="form-input" required></div>
                    </div>
                    <div class="form-group"><label class="form-label">Description</label><textarea id="actionDescription" class="form-textarea"></textarea></div>
                    <div class="action-buttons"><button type="submit" class="btn btn-primary">Add Action</button></div>
                </form>
            </div>
        </div>
        <div class="tab-header">
            <h2 class="section-title">Action Item Tracker</h2>
            <button class="btn btn-primary" onclick="UI.openModal('actionModal')">+ Add Action Item</button>
        </div>
        <div class="sub-nav" id="actionsSubNav">
            <button class="sub-tab active" data-filter="pending">Pending</button>
            <button class="sub-tab" data-filter="completed">Completed</button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr><th>Task</th><th>Priority</th><th>Category</th><th>Status</th><th>Due Date</th><th>Actions</th></tr>
                </thead>
                <tbody id="actionsTable"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('actionForm').onsubmit = handleActionSubmit;
    document.getElementById('actionsSubNav').addEventListener('click', (e) => {
        if (e.target.matches('.sub-tab')) {
            currentFilter = e.target.dataset.filter;
            document.querySelectorAll('#actionsSubNav .sub-tab').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            renderActions();
        }
    });
    
    // Setup custom category listener for the "Add" modal
    setupCategoryInput('add');
    
    renderActions();
}

async function renderActions() {
    const tbody = document.getElementById('actionsTable');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, 'actions'));
        const allActions = [];
        querySnapshot.forEach(doc => allActions.push({ id: doc.id, ...doc.data() }));

        const pendingStatuses = ['not-started', 'in-progress', 'on-hold'];
        const filteredActions = allActions.filter(action => {
            if (currentFilter === 'completed') {
                return action.status === 'completed';
            }
            return pendingStatuses.includes(action.status);
        });

        filteredActions.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        tbody.innerHTML = '';
        if (filteredActions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No ${currentFilter} action items.</td></tr>`;
            return;
        }

        filteredActions.forEach((action) => {
            const row = document.createElement('tr');
            row.dataset.id = action.id;
            row.innerHTML = `
                <td data-label="Task"><strong>${action.title}</strong></td>
                <td data-label="Priority"><span class="priority-badge priority-${action.priority}">${action.priority}</span></td>
                <td data-label="Category">${action.category}</td>
                <td data-label="Status"><span class="status-badge status-${(action.status || 'not-started').replace(/\s+/g, '-')}">${action.status || 'Not Started'}</span></td>
                <td data-label="Due Date">${new Date(action.dueDate).toLocaleDateString()}</td>
                <td data-label="Actions" class="action-buttons">
                    <button class="icon-btn edit-btn" onclick="Actions.editAction('${action.id}')" title="Edit Action"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                    <button class="icon-btn delete-btn" onclick="Actions.deleteAction('${action.id}')" title="Delete Action"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                    ${currentFilter !== 'completed' ? `<button class="icon-btn complete-btn" onclick="Actions.completeAction('${action.id}')" title="Complete Action"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading actions:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--error-red);">Error loading action items. Check console for details.</td></tr>`;
    }
}

async function handleActionSubmit(e) {
    e.preventDefault();
    const categorySelect = document.getElementById('addActionCategory');
    const customCategoryInput = document.getElementById('addCustomCategory');
    const category = categorySelect.value === 'custom' ? customCategoryInput.value : categorySelect.value;

    const actionData = {
        title: document.getElementById('actionTitle').value,
        priority: document.getElementById('actionPriority').value,
        category: category,
        dueDate: document.getElementById('actionDueDate').value,
        description: document.getElementById('actionDescription').value,
        status: 'not-started',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'actions'), actionData);
    UI.closeModal('actionModal');
    renderActions();
}

export async function editAction(id) {
    const docRef = doc(db, 'actions', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) { console.error("No such action document!"); return; }
    const action = docSnap.data();

    // Check if current category is a standard one
    const standardCategories = ["Morning Responsibilities", "Major Projects", "Team Development", "Training", "Process Improvement"];
    const isCustom = !standardCategories.includes(action.category);

    const formHtml = `
        <input type="hidden" name="id" value="${id}">
        <div class="form-grid">
            <div class="form-group"><label class="form-label">Task Title</label><input type="text" class="form-input" name="title" value="${action.title}" required></div>
            <div class="form-group"><label class="form-label">Priority</label><select class="form-select" name="priority" required><option value="high" ${action.priority === 'high' ? 'selected' : ''}>High</option><option value="medium" ${action.priority === 'medium' ? 'selected' : ''}>Medium</option><option value="low" ${action.priority === 'low' ? 'selected' : ''}>Low</option></select></div>
        </div>
        <div class="form-group">
            <label class="form-label">Category</label>
            <select name="categorySelect" id="editActionCategory" class="form-select">
                <option value="Morning Responsibilities" ${action.category === 'Morning Responsibilities' ? 'selected' : ''}>Morning Responsibilities</option>
                <option value="Major Projects" ${action.category === 'Major Projects' ? 'selected' : ''}>Major Projects</option>
                <option value="Team Development" ${action.category === 'Team Development' ? 'selected' : ''}>Team Development</option>
                <option value="Training" ${action.category === 'Training' ? 'selected' : ''}>Training</option>
                <option value="Process Improvement" ${action.category === 'Process Improvement' ? 'selected' : ''}>Process Improvement</option>
                <option value="custom" ${isCustom ? 'selected' : ''}>-- Add Custom --</option>
            </select>
            <input type="text" name="customCategory" id="editCustomCategory" class="form-input" style="display:${isCustom ? 'block' : 'none'}; margin-top:10px;" value="${isCustom ? action.category : ''}" placeholder="Enter custom category">
        </div>
        <div class="form-group"><label class="form-label">Due Date</label><input type="date" class="form-input" name="dueDate" value="${action.dueDate}" required></div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status" required><option value="not-started" ${action.status === 'not-started' ? 'selected' : ''}>Not Started</option><option value="in-progress" ${action.status === 'in-progress' ? 'selected' : ''}>In Progress</option><option value="completed" ${action.status === 'completed' ? 'selected' : ''}>Completed</option><option value="on-hold" ${action.status === 'on-hold' ? 'selected' : ''}>On Hold</option></select></div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" name="description">${action.description || ''}</textarea></div>
        <div class="action-buttons"><button type="submit" class="btn btn-primary">Save Changes</button></div>
    `;

    UI.showEditModal('Edit Action Item', formHtml, async (data) => {
        const category = data.categorySelect === 'custom' ? data.customCategory : data.categorySelect;
        const updateData = {
            title: data.title,
            priority: data.priority,
            category: category,
            dueDate: data.dueDate,
            status: data.status,
            description: data.description,
            updatedAt: new Date().toISOString()
        };
        const docRef = doc(db, 'actions', id);
        await updateDoc(docRef, updateData);
        renderActions();
    });
    
    // Setup custom category listener for the "Edit" modal
    setupCategoryInput('edit');
}

export function deleteAction(id) {
    UI.showConfirmationModal('Delete Action', 'Are you sure you want to delete this action item?', async () => {
        await deleteDoc(doc(db, 'actions', id));
        renderActions();
    });
}

export async function completeAction(id) {
    await updateDoc(doc(db, 'actions', id), { status: 'completed', updatedAt: new Date().toISOString() });
    renderActions();
}