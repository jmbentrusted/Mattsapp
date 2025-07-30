// js/ui.js

export function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

export function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

export function showConfirmationModal(title, text, onConfirm) {
    document.getElementById('confirmationModalTitle').textContent = title;
    document.getElementById('confirmationModalText').textContent = text;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    // Clone and replace the button to remove old event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal('confirmationModal');
    });

    cancelBtn.addEventListener('click', () => closeModal('confirmationModal'), { once: true });

    openModal('confirmationModal');
}

export function showEditModal(title, formHtml, onSubmit) {
    document.getElementById('editModalTitle').textContent = title;
    const form = document.getElementById('editForm');
    form.innerHTML = formHtml;

    // Remove old event listener before adding a new one
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(newForm);
        const data = Object.fromEntries(formData.entries());
        onSubmit(data);
        closeModal('editModal');
    });
    document.getElementById('closeEditModal').onclick = () => closeModal('editModal');
    openModal('editModal');
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}