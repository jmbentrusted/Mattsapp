// js/jobs.js
import { db, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from '../firebase-config.js';
import * as UI from './ui.js';

let currentFilter = 'active';

export async function loadJobs() {
    const container = document.getElementById('jobs');
    container.innerHTML = `
        <div class="tab-header">
            <h2 class="section-title">Job Management</h2>
            <div>
                <button class="btn btn-secondary" onclick="UI.openModal('batchJobModal')">Batch Add Jobs</button>
                <button class="btn btn-primary" onclick="UI.openModal('jobModal')">+ Add Job</button>
            </div>
        </div>
        <div class="sub-nav" id="jobsSubNav">
            <button class="sub-tab active" data-filter="active">Active</button>
            <button class="sub-tab" data-filter="completed">Completed</button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Job Name</th>
                        <th>Slack</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Target Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="jobsTable"></tbody>
            </table>
        </div>
        
        <div id="batchJobModal" class="modal">
            <div class="modal-content" style="max-width: 1000px;">
                <div class="modal-header">
                    <h3 class="modal-title">Batch Add Jobs</h3>
                    <span class="close" onclick="UI.closeModal('batchJobModal')">&times;</span>
                </div>
                <form id="batchJobForm">
                    <div class="table-container">
                        <table class="data-table" id="batchJobsTable">
                            <thead>
                                <tr>
                                    <th>Job Name</th>
                                    <th>Slack Channel</th>
                                    <th>Priority</th>
                                    <th>Assigned To</th>
                                    <th>Target Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody id="batchJobsTableBody">
                                </tbody>
                        </table>
                    </div>
                    <div class="action-buttons" style="margin-top: 20px; justify-content: space-between;">
                         <button type="button" class="btn btn-secondary" id="addJobRowBtn">+ Add Row</button>
                         <button type="submit" class="btn btn-primary">Submit All Jobs</button>
                    </div>
                </form>
            </div>
        </div>
        `;

    setupJobsEventListeners();
    renderJobs();
}

function addBatchJobRow() {
    const tbody = document.getElementById('batchJobsTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td data-label="Job Name"><input type="text" class="form-input" name="jobName" required></td>
        <td data-label="Slack Channel"><input type="url" class="form-input" name="slackChannel" placeholder="https://slack.com/..."></td>
        <td data-label="Priority">
            <select class="form-select" name="jobPriority" required>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="low">Low</option>
            </select>
        </td>
        <td data-label="Assigned To">
            <select class="form-select" name="jobAssignee" required>
                <option value="jacob">Jacob</option>
                <option value="hardy">Hardy</option>
                <option value="chandler">Chandler</option>
                <option value="nate">Nate</option>
                <option value="josh">Josh</option>
            </select>
        </td>
        <td data-label="Target Date"><input type="date" class="form-input" name="jobTargetDate" required></td>
        <td class="action-buttons">
            <button type="button" class="icon-btn delete-btn remove-job-row-btn" title="Remove Row">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

async function handleBatchJobSubmit(e) {
    e.preventDefault();
    const tbody = document.getElementById('batchJobsTableBody');
    const rows = tbody.querySelectorAll('tr');
    const promises = [];

    rows.forEach(row => {
        const nameInput = row.querySelector('input[name="jobName"]');
        const slackInput = row.querySelector('input[name="slackChannel"]');
        const priorityInput = row.querySelector('select[name="jobPriority"]');
        const assigneeInput = row.querySelector('select[name="jobAssignee"]');
        const targetDateInput = row.querySelector('input[name="jobTargetDate"]');

        if (nameInput.value && targetDateInput.value) {
            const jobData = {
                name: nameInput.value,
                slackChannel: slackInput.value || "",
                priority: priorityInput.value,
                status: 'active',
                targetDate: targetDateInput.value,
                assignee: assigneeInput.value,
                issue: "",
                nextAction: "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            promises.push(addDoc(collection(db, 'jobs'), jobData));
        }
    });

    try {
        await Promise.all(promises);
        UI.closeModal('batchJobModal');
        tbody.innerHTML = ''; // Clear the table for next time
        renderJobs();
    } catch (error) {
        console.error('Error batch adding jobs:', error);
        alert('There was an error submitting the jobs. Please check the console.');
    }
}

async function handleInlineUpdate(element) {
    const id = element.closest('tr').dataset.id;
    const field = element.dataset.field;
    let value = element.value;

    if (!id || !field) return;

    const docRef = doc(db, 'jobs', id);
    try {
        await updateDoc(docRef, {
            [field]: value,
            updatedAt: new Date().toISOString()
        });
        
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 2000);

    } catch (error) {
        console.error("Error updating job inline: ", error);
        alert("Failed to save changes.");
        renderJobs();
    } finally {
        // Revert cell back to text
        const cell = element.parentElement;
        if (element.type === 'date') {
            cell.textContent = new Date(value).toLocaleDateString();
        } else {
            cell.textContent = value;
        }
    }
}

function createSelectForCell(cell, options, currentValue) {
    const select = document.createElement('select');
    select.classList.add('inline-edit-select');
    select.dataset.field = cell.dataset.field;

    options.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue.charAt(0).toUpperCase() + optionValue.slice(1);
        if (optionValue === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    cell.innerHTML = '';
    cell.appendChild(select);
    select.focus();

    const saveAndUpdate = () => {
        handleInlineUpdate(select);
    };

    select.addEventListener('blur', saveAndUpdate);
    select.addEventListener('change', saveAndUpdate);
}

function createDateInputForCell(cell, currentValue) {
    const input = document.createElement('input');
    input.type = 'date';
    input.classList.add('inline-edit-date');
    input.dataset.field = cell.dataset.field;
    input.value = currentValue;

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();

    const saveAndUpdate = () => {
        handleInlineUpdate(input);
    };

    input.addEventListener('blur', saveAndUpdate);
    input.addEventListener('change', saveAndUpdate);
}


function setupJobsEventListeners() {
    const jobsTableBody = document.getElementById('jobsTable');
    if (jobsTableBody) {
        jobsTableBody.addEventListener('click', (e) => {
            const cell = e.target.closest('.editable-cell');
            if (!cell || cell.querySelector('select, input')) return; // Already in edit mode

            const field = cell.dataset.field;

            if (cell.classList.contains('select-edit')) {
                const currentValue = cell.textContent.trim().toLowerCase();
                let options = [];

                if (field === 'priority') {
                    options = ['high', 'medium', 'low'];
                } else if (field === 'status') {
                    options = ['active', 'pending', 'on-hold', 'completed'];
                } else if (field === 'assignee') {
                    options = ['jacob', 'hardy', 'chandler', 'nate', 'josh'];
                }
                
                if (options.length > 0) {
                    createSelectForCell(cell, options, currentValue);
                }
            } else if (field === 'targetDate') {
                // Convert displayed date to yyyy-mm-dd format for the input
                const dateParts = cell.textContent.trim().split('/');
                const formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
                createDateInputForCell(cell, formattedDate);
            }
        });

        jobsTableBody.addEventListener('blur', (e) => {
             const element = e.target;
             if(element.matches('.editable-cell[contenteditable="true"]')) {
                const id = element.closest('tr').dataset.id;
                const field = element.dataset.field;
                let value = element.textContent.trim();
                const docRef = doc(db, 'jobs', id);
                updateDoc(docRef, { [field]: value, updatedAt: new Date().toISOString() });
             }
        }, true);
    }
    
    // Standard form submission
    const jobForm = document.getElementById('jobForm');
    if (jobForm) jobForm.onsubmit = handleJobSubmit;
    
    // Sub-nav filtering
    document.getElementById('jobsSubNav').addEventListener('click', (e) => {
        if (e.target.matches('.sub-tab')) {
            currentFilter = e.target.dataset.filter;
            document.querySelectorAll('#jobsSubNav .sub-tab').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            renderJobs();
        }
    });

    // Batch Add functionality
    document.getElementById('addJobRowBtn').addEventListener('click', addBatchJobRow);
    document.getElementById('batchJobForm').addEventListener('submit', handleBatchJobSubmit);
    
    document.getElementById('batchJobsTableBody').addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-job-row-btn');
        if(removeBtn) {
            removeBtn.closest('tr').remove();
        }
    });
    
    // Add one row by default when opening the batch modal
    const batchModal = document.getElementById('batchJobModal');
    batchModal.addEventListener('click', (e) => {
        if (e.target.id === 'batchJobModal' || e.target.classList.contains('close')) {
             document.getElementById('batchJobsTableBody').innerHTML = '';
        }
    }, true);
    
    document.querySelector('button[onclick="UI.openModal(\'batchJobModal\')"]').addEventListener('click', () => {
        if (document.getElementById('batchJobsTableBody').children.length === 0) {
            addBatchJobRow();
        }
    });
}


async function renderJobs() {
    const activeStatuses = ['active', 'pending', 'on-hold'];
    const statusFilter = currentFilter === 'completed' ? ['==', 'completed'] : ['in', activeStatuses];
    
    const q = query(collection(db, 'jobs'), where('status', statusFilter[0], statusFilter[1]));
    
    try {
        const querySnapshot = await getDocs(q);
        const tbody = document.getElementById('jobsTable');
        tbody.innerHTML = '';
        
        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No ${currentFilter} jobs found.</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const job = doc.data();
            const row = document.createElement('tr');
            row.dataset.id = doc.id;
            const targetDate = new Date(job.targetDate + 'T00:00:00');

            row.innerHTML = `
                <td data-label="Job Name" class="editable-cell" data-field="name" contenteditable="true">${job.name}</td>
                <td data-label="Slack" class="editable-cell" data-field="slackChannel" contenteditable="true">${job.slackChannel || ''}</td>
                <td data-label="Priority" class="editable-cell select-edit" data-field="priority">${job.priority}</td>
                <td data-label="Status" class="editable-cell select-edit" data-field="status">${job.status}</td>
                <td data-label="Assigned To" class="editable-cell select-edit" data-field="assignee">${job.assignee}</td>
                <td data-label="Target Date" class="editable-cell" data-field="targetDate">${targetDate.toLocaleDateString()}</td>
                <td data-label="Actions" class="action-buttons">
                    <button class="icon-btn edit-btn" onclick="Jobs.editJob('${doc.id}')" title="Edit Job (Advanced)"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                    <button class="icon-btn delete-btn" onclick="Jobs.deleteJob('${doc.id}')" title="Delete Job"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                    ${currentFilter !== 'completed' ? `<button class="icon-btn complete-btn" onclick="Jobs.completeJob('${doc.id}')" title="Complete Job"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsTable').innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--error-red);">Error loading jobs.</td></tr>';
    }
}

async function handleJobSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const jobData = {
        name: form.jobName.value, slackChannel: form.jobSlackChannel.value, priority: form.jobPriority.value,
        status: form.jobStatus.value, targetDate: form.jobTargetDate.value, assignee: form.jobAssignee.value,
        issue: form.jobIssue.value, nextAction: form.jobNextAction.value,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    try {
        await addDoc(collection(db, 'jobs'), jobData);
        UI.closeModal('jobModal');
        renderJobs();
    } catch (error) {
        console.error('Error adding job:', error);
        alert('Error adding job. Please try again.');
    }
}

export async function editJob(id) {
    const docRef = doc(db, 'jobs', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) { console.error("No such document!"); return; }
    const job = docSnap.data();

    const formHtml = `
        <input type="hidden" name="id" value="${id}">
        <div class="form-grid">
            <div class="form-group"><label class="form-label">Job Name</label><input type="text" class="form-input" name="name" value="${job.name}" required></div>
            <div class="form-group"><label class="form-label">Slack Channel Link</label><input type="url" class="form-input" name="slackChannel" value="${job.slackChannel || ''}" placeholder="https://slack.com/channels/..."></div>
            <div class="form-group"><label class="form-label">Priority</label><select class="form-select" name="priority" required><option value="high" ${job.priority === 'high' ? 'selected' : ''}>High</option><option value="medium" ${job.priority === 'medium' ? 'selected' : ''}>Medium</option><option value="low" ${job.priority === 'low' ? 'selected' : ''}>Low</option></select></div>
            <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status" required><option value="active" ${job.status === 'active' ? 'selected' : ''}>Active</option><option value="pending" ${job.status === 'pending' ? 'selected' : ''}>Pending</option><option value="completed" ${job.status === 'completed' ? 'selected' : ''}>Completed</option><option value="on-hold" ${job.status === 'on-hold' ? 'selected' : ''}>On Hold</option></select></div>
            <div class="form-group"><label class="form-label">Target Date</label><input type="date" class="form-input" name="targetDate" value="${job.targetDate}" required></div>
            <div class="form-group"><label class="form-label">Assigned To</label><select class="form-select" name="assignee" required><option value="jacob" ${job.assignee === 'jacob' ? 'selected' : ''}>Jacob</option><option value="hardy" ${job.assignee === 'hardy' ? 'selected' : ''}>Hardy</option><option value="chandler" ${job.assignee === 'chandler' ? 'selected' : ''}>Chandler</option><option value="nate" ${job.assignee === 'nate' ? 'selected' : ''}>Nate</option><option value="josh" ${job.assignee === 'josh' ? 'selected' : ''}>Josh</option></select></div>
        </div>
        <div class="form-group"><label class="form-label">Issue Description</label><textarea class="form-textarea" name="issue">${job.issue || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Next Action</label><textarea class="form-textarea" name="nextAction">${job.nextAction || ''}</textarea></div>
        <div class="action-buttons"><button type="submit" class="btn btn-primary">Save Changes</button></div>
    `;

    UI.showEditModal('Edit Job', formHtml, async (data) => {
        const docRef = doc(db, 'jobs', id);
        await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
        renderJobs();
    });
}

export function deleteJob(id) {
    UI.showConfirmationModal('Delete Job', 'Are you sure you want to permanently delete this job?', async () => {
        await deleteDoc(doc(db, 'jobs', id));
        renderJobs();
    });
}

export async function completeJob(id) {
    const docRef = doc(db, 'jobs', id);
    await updateDoc(docRef, { status: 'completed', updatedAt: new Date().toISOString() });
    renderJobs();
}