// js/team.js
import { db, doc, getDocs, collection, updateDoc, addDoc } from '../firebase-config.js';
import * as UI from './ui.js';

export async function loadTeam() {
    const container = document.getElementById('team');
    container.innerHTML = `
        <div id="teamModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Add New Team Member</h3>
                    <span class="close" onclick="UI.closeModal('teamModal')">&times;</span>
                </div>
                <form id="teamForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Name</label>
                            <input type="text" id="teamMemberName" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <input type="text" id="teamMemberRole" class="form-input" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Active Goal</label>
                        <input type="text" id="teamMemberGoal" class="form-input" placeholder="e.g., IICRC Certification">
                    </div>
                    <div class="action-buttons">
                        <button type="submit" class="btn btn-primary">Add Member</button>
                    </div>
                </form>
            </div>
        </div>
        <div class="tab-header">
            <h2 class="section-title">Team Development & Goals</h2>
            <button class="btn btn-primary" onclick="UI.openModal('teamModal')">+ Add Team Member</button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr><th>Name</th><th>Role</th><th>Active Goal</th><th>Goal Status</th><th>Actions</th></tr>
                </thead>
                <tbody id="teamTable"></tbody>
            </table>
        </div>`;
    
    document.getElementById('teamForm').onsubmit = handleTeamSubmit;
    renderTeam();
}

async function renderTeam() {
    const tbody = document.getElementById('teamTable');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading team data...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, 'team'));
        let html = '';
        
        if (querySnapshot.empty) {
             tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No team members found. Add one using the button above.</td></tr>';
             return;
        }

        querySnapshot.forEach(doc => {
            const member = doc.data();
            const memberId = doc.id;
            const activeGoal = member.goals && member.goals.length > 0 ? member.goals[0] : { title: 'No active goal', status: 'none' };

            html += `
                <tr data-id="${memberId}">
                    <td data-label="Name"><strong>${member.name}</strong></td>
                    <td data-label="Role">${member.role}</td>
                    <td data-label="Active Goal" class="editable" data-field="goals.0.title" onblur="Team.saveField(this, '${memberId}')" contenteditable>${activeGoal.title}</td>
                    <td data-label="Goal Status"><span class="status-badge status-${(activeGoal.status || 'none').toLowerCase()}">${activeGoal.status || 'None'}</span></td>
                    <td data-label="Actions" class="action-buttons">
                        <button class="icon-btn" onclick="UI.openModal('meetingModal');document.getElementById('meetingEmployee').value='${memberId}';" title="Schedule Meeting">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </button>
                    </td>
                </tr>`;
        });
        tbody.innerHTML = html;
    } catch(error) {
        console.error("Error loading team data: ", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--error-red);">Error loading team data.</td></tr>';
    }
}

async function handleTeamSubmit(e) {
    e.preventDefault();
    const newMember = {
        name: document.getElementById('teamMemberName').value,
        role: document.getElementById('teamMemberRole').value,
        goals: [{
            title: document.getElementById('teamMemberGoal').value || 'No active goal',
            status: 'Not Started'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        await addDoc(collection(db, 'team'), newMember);
        UI.closeModal('teamModal');
        renderTeam();
    } catch (error) {
        console.error('Error adding team member:', error);
        alert('Failed to add team member. Please try again.');
    }
}

export async function saveField(element, id) {
    const field = element.dataset.field;
    const value = element.textContent.trim();
    
    if (field !== "goals.0.title") return; // Only allow editing goal title for now

    try {
        const docRef = doc(db, 'team', id);
        
        await updateDoc(docRef, {
             "goals.0.title": value,
             updatedAt: new Date().toISOString() 
        });
        
        console.log(`Team member ${id} updated successfully.`);
        
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 2000);

    } catch (error) {
        console.error("Error updating team member: ", error);
        alert("Failed to save changes.");
        renderTeam(); // Re-render to revert failed changes
    }
}

// Make functions globally available
window.Team = { saveField, loadTeam };